import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'

export type CurrentUser = {
    id: string
    email: string
}

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'
const DEMO_USER_EMAIL = 'demo@forge.local'

function isDemoModeEnabled() {
    return process.env.FORGE_DEMO_MODE === 'true'
}

async function ensureDemoUserSeeded() {
    const now = new Date()

    await db
        .insert(schema.profiles)
        .values({
            id: DEMO_USER_ID,
            email: DEMO_USER_EMAIL,
            fullName: 'Forge Demo',
            bio: 'Local demo profile',
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [schema.profiles.email],
            set: {
                fullName: 'Forge Demo',
                bio: 'Local demo profile',
                updatedAt: now,
            },
        })

    await db
        .insert(schema.rewardsWallet)
        .values({
            userId: DEMO_USER_ID,
            coinsBalance: 0,
        })
        .onConflictDoNothing()
}

async function getDemoUser(): Promise<CurrentUser> {
    await ensureDemoUserSeeded()
    return { id: DEMO_USER_ID, email: DEMO_USER_EMAIL }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
    if (isDemoModeEnabled()) {
        return await getDemoUser()
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user || !data.user.email) return null

    return {
        id: data.user.id,
        email: data.user.email,
    }
}

export async function requireUser(): Promise<CurrentUser> {
    const user = await getCurrentUser()
    if (!user) {
        throw new Error('Unauthorized')
    }
    return user
}

export async function isAdmin(): Promise<boolean> {
    const allowedEmail = process.env.ALLOWED_USER_EMAIL

    if (isDemoModeEnabled()) {
        return process.env.FORGE_DEMO_IS_ADMIN === 'true'
    }

    const cookieStore = cookies()
    const adminToken = cookieStore.get('forge_admin_token')?.value
    const adminPassword = process.env.ADMIN_PASSWORD
    const adminSalt = process.env.ADMIN_SALT || 'forge-default-salt'

    if (adminPassword && adminToken) {
        const expectedToken = createHash('sha256').update(adminPassword + adminSalt).digest('hex')
        if (adminToken === expectedToken) return true
    }

    const user = await getCurrentUser()
    if (!user) return false

    if (allowedEmail) {
        return user.email === allowedEmail
    }

    return false
}
