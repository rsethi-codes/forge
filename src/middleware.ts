import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth')
    const isCallback = request.nextUrl.pathname.startsWith('/auth/callback')
    const isPublicPage = request.nextUrl.pathname.startsWith('/blog') || request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/profile')

    // 1. Create an initial response
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 2. Initialize Supabase with the response-aware cookie handler
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

    // 3. Get User and Admin Status
    const adminToken = request.cookies.get('forge_admin_token')?.value
    const adminPassword = process.env.ADMIN_PASSWORD
    const adminSalt = process.env.ADMIN_SALT || 'forge-default-salt'

    let isDevAuthorized = false
    if (adminPassword && adminToken) {
        const encoder = new TextEncoder()
        const passwordData = encoder.encode(adminPassword + adminSalt)
        const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData)
        const expectedToken = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        isDevAuthorized = adminToken === expectedToken
    }

    const { data: { user } } = await supabase.auth.getUser()

    // 4. Helper to return a response with cookies preserved
    const redirectWithCookies = (url: string) => {
        const redirectResponse = NextResponse.redirect(new URL(url, request.url))
        // IMPORTANT: Copy all cookies from the 'response' object we've been building
        // to the new redirect response. This fixes the session persistence bug.
        response.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, {
                path: cookie.path,
                domain: cookie.domain,
                maxAge: cookie.maxAge,
                secure: cookie.secure,
                sameSite: cookie.sameSite,
            })
        })
        return redirectResponse
    }

    // 5. Access Control Logic
    if (isDevAuthorized && !isPublicPage && !isAuthPage) {
        return response
    }

    if (!user && !isAuthPage && !isPublicPage) {
        return redirectWithCookies('/login')
    }

    const ALLOWED_EMAIL = process.env.ALLOWED_USER_EMAIL?.toLowerCase()

    if (user && ALLOWED_EMAIL && user.email?.toLowerCase() !== ALLOWED_EMAIL && !isPublicPage && !isDevAuthorized) {
        if (request.nextUrl.searchParams.get('error') === 'unauthorized') {
            return response
        }
        await supabase.auth.signOut()
        return redirectWithCookies(`/login?error=unauthorized&email=${user.email}`)
    }

    if ((user || isDevAuthorized) && isAuthPage && !isCallback) {
        return redirectWithCookies('/dashboard')
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
