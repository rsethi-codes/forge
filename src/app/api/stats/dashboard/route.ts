import { NextResponse } from 'next/server'
import { getDashboardData } from '@/lib/actions/roadmap'
import { getAuthStatus } from '@/lib/actions/auth-status'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date') || undefined

        const auth = await getAuthStatus()
        if (!auth.isAuthenticated) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const data = await getDashboardData(date)
        return NextResponse.json(data)
    } catch (error) {
        console.error('[API Dashboard Data] Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
