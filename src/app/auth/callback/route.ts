import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'

    console.log('--- Auth Callback Start ---')
    console.log('Origin:', requestUrl.origin)
    console.log('Next path:', next)

    if (code) {
        // Create the redirect response first
        const response = NextResponse.redirect(new URL(next, requestUrl.origin))

        // Create a dedicated Supabase client that writes directly to THAT response
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet: { name: string, value: string, options: any }[]) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        console.log('Exchanging code for session...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log('Success! User ID:', data.user?.id)
            if (data.session) {
                console.log('Session established. Redirecting with cookies.')
            }
            return response
        }

        console.error('Auth callback error detail:', error)
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
    }

    console.warn('No code found in search params.')
    return NextResponse.redirect(new URL('/login?error=No+authentication+code+found', request.url))
}
