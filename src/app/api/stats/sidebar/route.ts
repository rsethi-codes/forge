import { NextResponse } from 'next/server'
import { getSidebarStats } from '@/lib/actions/sidebar'
import { getAuthStatus } from '@/lib/actions/auth-status'

export async function GET() {
    try {
        const auth = await getAuthStatus()
        if (!auth.isAuthenticated) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const stats = await getSidebarStats()
        return NextResponse.json(stats)
    } catch (error) {
        console.error('[API Sidebar Stats] Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
