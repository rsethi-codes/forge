import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

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

    const adminToken = request.cookies.get('forge_admin_token')?.value
    const adminPassword = process.env.ADMIN_PASSWORD || 'grind'

    // Create the expected token using a static hash for comparison
    // We use a simple buffer comparison for security
    const encoder = new TextEncoder()
    const passwordData = encoder.encode(adminPassword + 'forge-salt-2026')
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData)
    const expectedToken = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

    const isDevAuthorized = adminToken === expectedToken

    const { data: { user } } = await supabase.auth.getUser()

    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth')
    const isPublicPage = request.nextUrl.pathname.startsWith('/blog') || request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/profile')

    // Admin Bypass for dev
    if (isDevAuthorized && !isPublicPage && !isAuthPage) {
        return response
    }

    // Redirect to login if not authenticated and trying to access protected route
    if (!user && !isAuthPage && !isPublicPage) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Single User Lock: Only allow a specific email
    const ALLOWED_EMAIL = process.env.ALLOWED_USER_EMAIL

    // If in dev and no allowed email is set, we can be more lenient or log a warning
    // BUT to follow the "Single User" requirement, we should still check if one is defined.

    if (user && ALLOWED_EMAIL && user.email !== ALLOWED_EMAIL && !isPublicPage && !isDevAuthorized) {
        // If authenticated but not the owner, sign out or block
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL(`/login?error=unauthorized&email=${user.email}`, request.url))
    }

    // Redirect to dashboard if (authenticated OR dev-authorized) and trying to access login
    if ((user || isDevAuthorized) && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - icon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
