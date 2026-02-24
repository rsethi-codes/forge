import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'

    console.log('--- Auth Callback Start ---')
    console.log('Origin:', requestUrl.origin)
    console.log('Next path:', next)

    if (code) {
        const supabase = createClient()
        console.log('Exchanging code for session...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log('Success! User ID:', data.user?.id)
            console.log('Email:', data.user?.email)

            // Log if session is specifically returned
            if (data.session) {
                console.log('Session established. Redirecting to:', next)
            } else {
                console.warn('Code exchanged but NO session returned.')
            }

            const redirectUrl = new URL(next, requestUrl.origin)
            return NextResponse.redirect(redirectUrl)
        }

        console.error('Auth callback error detail:', error)
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
    }

    console.warn('No code found in search params.')
    return NextResponse.redirect(new URL('/login?error=No+authentication+code+found', request.url))
}
