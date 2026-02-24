import { getCurrentUser, isAdmin } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import React from 'react'
import LandingClient from '@/components/LandingClient'

export default async function LandingPage() {
    const user = await getCurrentUser()

    if (user) {
        const admin = await isAdmin()
        if (admin) {
            redirect('/admin')
        }
        redirect('/dashboard')
    }

    return <LandingClient />
}
