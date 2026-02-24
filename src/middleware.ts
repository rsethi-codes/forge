import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Robust Middleware for Next.js 14+ and Supabase SSR
 * Handles session refreshing, Admin bypass, and single-user locking.
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/auth')
    const isCallback = pathname.startsWith('/auth/callback')
    const isPublicPage = pathname.startsWith('/blog') || pathname === '/' || pathname.startsWith('/profile') || pathname.startsWith('/api')

    // 1. Initialize result with default next()
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 2. Initialize Supabase
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
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 3. Admin Token Verification (Developer Bypass)
    const adminToken = request.cookies.get('forge_admin_token')?.value
    const adminPassword = process.env.ADMIN_PASSWORD
    const adminSalt = process.env.ADMIN_SALT || 'forge-default-salt'

    let isDevAuthorized = false
    if (adminPassword && adminToken) {
        // Simple hash check consistent with loginAdmin action
        const encoder = new TextEncoder()
        const passwordData = encoder.encode(adminPassword + adminSalt)
        const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData)
        const expectedToken = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        isDevAuthorized = adminToken === expectedToken
    }

    // 4. Authenticate User
    const { data: { user } } = await supabase.auth.getUser()

    /**
     * Helper to return a redirect while preserving ALL cookies (session + admin)
     */
    const secureRedirect = (url: string) => {
        const redirectResponse = NextResponse.redirect(new URL(url, request.url))
        // Copy cookies from the active response object (which may have updated Supabase cookies)
        response.cookies.getAll().forEach((c) => {
            redirectResponse.cookies.set(c.name, c.value, {
                path: c.path,
                domain: c.domain,
                maxAge: c.maxAge,
                secure: c.secure,
                sameSite: c.sameSite,
            })
        })
        return redirectResponse
    }

    // --- ACCESS LOGIC ---

    // A. Developer Bypass: Admins can go anywhere
    if (isDevAuthorized) {
        if (isAuthPage && !isCallback) {
            return secureRedirect('/dashboard')
        }
        return response
    }

    // B. Public Access: No auth required
    if (isPublicPage || isCallback) {
        return response
    }

    // C. Guest Access: Force login if not authenticated
    if (!user) {
        return secureRedirect('/login')
    }

    // D. Single User Lock: Only allow specific owner
    const ALLOWED_EMAIL = process.env.ALLOWED_USER_EMAIL?.toLowerCase()
    if (ALLOWED_EMAIL && user.email?.toLowerCase() !== ALLOWED_EMAIL) {
        // If they are already on login with an error, don't loop
        if (request.nextUrl.searchParams.get('error') === 'unauthorized') {
            return response
        }
        // Force sign out and block
        await supabase.auth.signOut()
        return secureRedirect(`/login?error=unauthorized&email=${user.email}`)
    }

    // E. Authenticated Redirect: Logged in users shouldn't see login page
    if (isAuthPage) {
        return secureRedirect('/dashboard')
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
