import { NextResponse } from 'next/server'
import { getAnalyticsData } from '@/lib/actions/analytics'
import { getAuthStatus } from '@/lib/actions/auth-status'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const auth = await getAuthStatus()
        if (!auth.isAuthenticated) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const data = await getAnalyticsData(auth.user?.id)
        return NextResponse.json({ ...data, isAdmin: auth.isAdmin })
    } catch (error) {
        console.error('[API Analytics Data] Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
