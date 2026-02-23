import { getCurrentUser } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import React from 'react'
import LandingClient from '@/components/LandingClient'

export default async function LandingPage() {
    const user = await getCurrentUser()

    if (user) {
        redirect('/dashboard')
    }

    return <LandingClient />
}
