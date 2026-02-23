import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

export async function isAdmin() {
    const token = cookies().get('forge_admin_token')?.value
    if (!token) return false

    const adminPassword = process.env.ADMIN_PASSWORD
    const adminSalt = process.env.ADMIN_SALT || 'forge-default-salt'
    if (!adminPassword) return false

    const expectedToken = createHash('sha256').update(adminPassword + adminSalt).digest('hex')
    return token === expectedToken
}

export async function getCurrentUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) return user

    // Check for admin bypass
    if (await isAdmin()) {
        // Return a stable "System/Admin" user for consistency
        return {
            id: '00000000-0000-0000-0000-000000000000', // System UUID
            email: 'admin@forge.app',
            role: 'admin'
        } as any
    }

    return null
}

export async function requireUser() {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')
    return user
}
