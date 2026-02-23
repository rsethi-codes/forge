'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

export async function isAdmin() {
    try {
        const cookieStore = cookies()
        const token = cookieStore.get('forge_admin_token')?.value

        if (!token) return false

        const adminPassword = process.env.ADMIN_PASSWORD
        const adminSalt = process.env.ADMIN_SALT || 'forge-default-salt'

        if (!adminPassword) {
            console.error('[auth-utils] Error: ADMIN_PASSWORD is missing from environment.')
            return false
        }

        const expectedToken = createHash('sha256').update(adminPassword + adminSalt).digest('hex')
        return token === expectedToken
    } catch (e) {
        console.error('[auth-utils] isAdmin check failed:', e)
        return false
    }
}

export async function getCurrentUser() {
    try {
        // First try standard Supabase Auth
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) return user

        // Fallback to Admin Bypass
        if (await isAdmin()) {
            return {
                id: '00000000-0000-0000-0000-000000000000',
                email: 'admin@forge.app',
                role: 'admin'
            } as any
        }
    } catch (e) {
        // If the database is down, createClient() or getUser() might throw.
        // We still check for admin cookie to allow limited offline/cached access if needed.
        if (await isAdmin()) {
            return {
                id: '00000000-0000-0000-0000-000000000000',
                email: 'admin@forge.app',
                role: 'admin'
            } as any
        }
    }
    return null
}

export async function requireUser() {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')
    return user
}
