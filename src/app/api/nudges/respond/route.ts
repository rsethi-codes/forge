import { NextResponse } from 'next/server'
import { getAuthStatus } from '@/lib/actions/auth-status'
import { respondToNudge } from '@/lib/actions/behavior'

export async function POST(req: Request) {
    const auth = await getAuthStatus()
    if (!auth.isAuthenticated) return new NextResponse('Unauthorized', { status: 401 })

    const { nudgeId, response } = await req.json()
    const result = await respondToNudge(nudgeId, response)

    return NextResponse.json(result)
}
