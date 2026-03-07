import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const isCallback = pathname.startsWith('/auth/callback')

    // Always allow the auth callback through untouched
    if (isCallback) {
        return NextResponse.next()
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Security hardening for Forge Docs Reader
    // Docs HTML is rendered via sandboxed iframe srcDoc (no scripts allowed there).
    // CSP here protects the Forge page itself while keeping Next.js functional.
    if (/^\/tracker\/day\/[^\/]+\/docs\/?$/.test(pathname)) {
        response.headers.set(
            'Content-Security-Policy',
            [
                "default-src 'self'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'self'",
                "script-src 'self'",
                "style-src 'self' 'unsafe-inline' https:",
                "img-src 'self' https: data:",
                "font-src 'self' https: data:",
                "connect-src 'self' https:",
                "frame-src 'self'",
                "object-src 'none'",
            ].join('; ')
        )
        response.headers.set('X-Content-Type-Options', 'nosniff')
        response.headers.set('Referrer-Policy', 'no-referrer')
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: { name: string, value: string, options: any }[]) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // DEV ONLY: Bypass Auth for testing
    const isTestMode = process.env.NODE_ENV === 'development' && request.cookies.get('forge_test_mode')?.value === 'true'

    const isLogin = pathname.startsWith('/login')
    const isPublic = pathname === '/' || pathname.startsWith('/blog') || pathname.startsWith('/profile') || pathname.startsWith('/auth')

    // Only redirect to login if accessing a protected route without a session
    if (!user && !isPublic && !isLogin && !isTestMode) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
