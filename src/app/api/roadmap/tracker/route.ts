import { NextRequest, NextResponse } from 'next/server'
import { getTrackerData } from '@/lib/actions/roadmap'
import { getAuthStatus } from '@/lib/actions/auth-status'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthStatus()
        if (!auth.isAuthenticated) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const month = parseInt(searchParams.get('month') || '1')
        const date = searchParams.get('date') || undefined

        const data = await getTrackerData(month, date)
        return NextResponse.json(data)
    } catch (error) {
        console.error('[API Tracker Data] Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
