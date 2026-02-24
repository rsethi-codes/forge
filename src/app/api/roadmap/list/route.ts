import { NextResponse } from 'next/server'
import { listRoadmaps } from '@/lib/actions/roadmap-mgmt'
import { getAuthStatus } from '@/lib/actions/auth-status'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const auth = await getAuthStatus()
        if (!auth.isAuthenticated) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const data = await listRoadmaps()
        return NextResponse.json(data)
    } catch (error) {
        console.error('[API Roadmaps List] Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
