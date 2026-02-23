'use server'

import { getCurrentUser, isAdmin } from '@/lib/auth-utils'

export async function getAuthStatus() {
    const user = await getCurrentUser()
    const admin = await isAdmin()

    return {
        user,
        isAdmin: admin,
        isAuthenticated: !!user
    }
}
