import { NextResponse } from 'next/server'
import { getAnalyticsData } from '@/lib/actions/analytics'
import { getAuthStatus } from '@/lib/actions/auth-status'

export async function GET() {
    try {
        const auth = await getAuthStatus()
        if (!auth.isAuthenticated) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const data = await getAnalyticsData(auth.user?.id)
        return NextResponse.json(data)
    } catch (error) {
        console.error('[API Analytics Data] Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
