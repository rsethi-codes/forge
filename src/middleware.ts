import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/auth')
    const isCallback = pathname.startsWith('/auth/callback')
    const isPublicPage = pathname.startsWith('/blog') || pathname === '/' || pathname.startsWith('/profile') || pathname.startsWith('/api')

    // --- SAFETY NET: Catch misplaced auth codes ---
    const code = searchParams.get('code')
    if (code && !isCallback) {
        // If a code lands anywhere else, force it into the callback handler
        const callbackUrl = new URL('/auth/callback', request.url)
        callbackUrl.searchParams.set('code', code)
        const next = searchParams.get('next')
        if (next) callbackUrl.searchParams.set('next', next)
        return NextResponse.redirect(callbackUrl)
    }

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

    const secureRedirect = (url: string) => {
        const redirectResponse = NextResponse.redirect(new URL(url, request.url))
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

    if (isDevAuthorized) {
        if (isAuthPage && !isCallback) {
            return secureRedirect('/dashboard')
        }
        return response
    }

    if (isPublicPage || isCallback) {
        return response
    }

    if (!user) {
        return secureRedirect('/login')
    }

    const ALLOWED_EMAIL = process.env.ALLOWED_USER_EMAIL?.toLowerCase()
    if (ALLOWED_EMAIL && user.email?.toLowerCase() !== ALLOWED_EMAIL) {
        if (request.nextUrl.searchParams.get('error') === 'unauthorized') {
            return response
        }
        await supabase.auth.signOut()
        return secureRedirect(`/login?error=unauthorized&email=${user.email}`)
    }

    if (isAuthPage) {
        return secureRedirect('/dashboard')
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
