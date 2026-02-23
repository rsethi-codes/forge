import { NextResponse } from 'next/server'
import { getAuthStatus } from '@/lib/actions/auth-status'
import { endSession } from '@/lib/actions/behavior'

export async function POST(req: Request) {
    const auth = await getAuthStatus()
    if (!auth.isAuthenticated) return new NextResponse('Unauthorized', { status: 401 })

    const { sessionId, interruptions, distractions } = await req.json()
    const result = await endSession(sessionId, { interruptions, distractions })

    return NextResponse.json(result)
}
