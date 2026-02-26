
import { NextResponse } from 'next/server'
import { syncUserDailyLogin } from '@/lib/actions/login-sync'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const result = await syncUserDailyLogin(todayStr)
        return NextResponse.json({ success: true, result, todayStr })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 })
    }
}
