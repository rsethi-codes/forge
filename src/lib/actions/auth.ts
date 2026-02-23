'use server'

import { cookies } from 'next/headers'
import { createHash } from 'crypto'

export async function loginAdmin(password: string) {
    const adminPassword = process.env.ADMIN_PASSWORD
    const adminSalt = process.env.ADMIN_SALT || 'forge-default-salt'

    if (!adminPassword) return { success: false, error: 'Admin access not configured.' }

    if (password === adminPassword) {
        const token = createHash('sha256').update(password + adminSalt).digest('hex')

        cookies().set('forge_admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        })

        return { success: true }
    }

    return { success: false, error: 'Invalid master credentials.' }
}

export async function logoutAdmin() {
    cookies().delete('forge_admin_token')
}
