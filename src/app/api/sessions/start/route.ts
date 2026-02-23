import { NextResponse } from 'next/server'
import { getAuthStatus } from '@/lib/actions/auth-status'
import { startSession } from '@/lib/actions/behavior'

export async function POST(req: Request) {
    const auth = await getAuthStatus()
    if (!auth.isAuthenticated) return new NextResponse('Unauthorized', { status: 401 })

    const { dayId } = await req.json()
    const sessionId = await startSession(dayId)

    return NextResponse.json({ sessionId })
}
