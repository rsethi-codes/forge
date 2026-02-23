import { NextResponse } from 'next/server'
import { getDashboardData } from '@/lib/actions/roadmap'
import { getAuthStatus } from '@/lib/actions/auth-status'

export async function GET() {
    try {
        const auth = await getAuthStatus()
        if (!auth.isAuthenticated) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const data = await getDashboardData()
        return NextResponse.json(data)
    } catch (error) {
        console.error('[API Dashboard Data] Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
