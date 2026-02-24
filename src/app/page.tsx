import { getCurrentUser, isAdmin } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import React from 'react'
import LandingClient from '@/components/LandingClient'

interface LandingPageProps {
    searchParams: { code?: string; next?: string }
}

export default async function LandingPage({ searchParams }: LandingPageProps) {
    // If Supabase redirected a magic link code to /, forward it to the real handler
    if (searchParams.code) {
        const callbackUrl = `/auth/callback?code=${searchParams.code}${searchParams.next ? `&next=${searchParams.next}` : ''}`
        redirect(callbackUrl)
    }

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
