import { NextResponse } from 'next/server'
import { getAuthStatus } from '@/lib/actions/auth-status'
import { getQuickDashboard } from '@/lib/actions/behavior'
import { getDashboardData } from '@/lib/actions/roadmap'

export async function GET() {
    const auth = await getAuthStatus()
    if (!auth.isAuthenticated) return new NextResponse('Unauthorized', { status: 401 })

    const [quick, full] = await Promise.all([
        getQuickDashboard(auth.user!.id),
        getDashboardData()
    ])

    const tasks = (full as any).tasks || []
    let topTask = tasks[0]?.title ?? "Review Core Logic"

    // If momentum mode, find the "easiest" task (e.g., study type)
    if (quick.recommendedAction === 'Momentum') {
        const easyTask = tasks.find((t: any) => t.taskType === 'study') || tasks[0]
        if (easyTask) topTask = `Starter: ${easyTask.title} (Just 2 mins)`
    }

    return NextResponse.json({
        dayTitle: (full as any).dayTitle || "Day 00",
        topTask,
        ...quick
    })
}
