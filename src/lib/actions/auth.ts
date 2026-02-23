'use server'

import { cookies } from 'next/headers'
import { createHash } from 'crypto'

export async function loginAdmin(password: string) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'grind' // Fallback for safety but recommend env

    if (password === adminPassword) {
        // Create a persistent token based on the password
        // This makes it so if you change the password in env, all current sessions log out
        const token = createHash('sha256').update(password + 'forge-salt-2026').digest('hex')

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
