import { NextResponse } from 'next/server'
import { getAllMilestones } from '@/lib/milestones'
import { getAuthStatus } from '@/lib/actions/auth-status'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const auth = await getAuthStatus()
        if (!auth.isAuthenticated) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const data = await getAllMilestones()
        return NextResponse.json(data)
    } catch (error) {
        console.error('[API Milestones List] Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
