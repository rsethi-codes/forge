import { NextResponse } from 'next/server'
import { getAuthStatus } from '@/lib/actions/auth-status'
import { logAppEvent } from '@/lib/actions/behavior'

export async function POST(req: Request) {
    const auth = await getAuthStatus()
    if (!auth.isAuthenticated) return new NextResponse('Unauthorized', { status: 401 })

    const { type, meta, sessionId } = await req.json()
    await logAppEvent(auth.user!.id, sessionId, type, meta)

    return NextResponse.json({ success: true })
}
