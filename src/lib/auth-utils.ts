import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export type CurrentUser = {
    id: string
    email: string
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
    // DEV ONLY: Bypass auth for local testing
    if (process.env.NODE_ENV === 'development') {
        const cookieStore = cookies()
        if (cookieStore.get('forge_test_mode')?.value === 'true') {
            return {
                id: '00000000-0000-0000-0000-000000000000',
                email: 'test@forge.dev',
            }
        }
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
        return user.email.toLowerCase() === allowedEmail.toLowerCase()
    }

    return false
}
