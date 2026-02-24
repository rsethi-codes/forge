import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'

    console.log('[AUTH_CALLBACK] Firing. Code present:', !!code)

    if (code) {
        // Prepare the response
        const response = NextResponse.redirect(new URL(next, request.url))

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

        console.log('[AUTH_CALLBACK] Attempting code exchange...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log('[AUTH_CALLBACK] Success. User:', data.user?.email)
            // Force the response to have a long-lived session cookie for Vercel
            if (data.session) {
                response.cookies.set('sb-access-token', data.session.access_token, { path: '/', sameSite: 'lax', secure: true })
            }
            return response
        }

        console.error('[AUTH_CALLBACK] Exchange error:', error.message)
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
    }

    console.warn('[AUTH_CALLBACK] No code found.')
    return NextResponse.redirect(new URL('/login?error=No+authentication+code+found', request.url))
}
