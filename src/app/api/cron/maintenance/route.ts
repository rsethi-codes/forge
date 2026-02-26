
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, and, sql, isNull } from 'drizzle-orm'
import { format, subDays } from 'date-fns'
import { getRoadmapSchedule, setDayOff } from '@/lib/actions/scheduling'
import { sendStartReminder, sendYesterdayStats } from '@/lib/actions/email'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('[Maintenance Cron] Starting...')
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd')

    try {
        // 1. Get all active programs
        const activePrograms = await db
            .select()
            .from(schema.roadmapPrograms)
            .where(and(
                eq(schema.roadmapPrograms.isActive, true),
                isNull(schema.roadmapPrograms.deletedAt)
            ))

        for (const program of activePrograms) {
            console.log(`[Maintenance Cron] Processing program: ${program.id} for user: ${program.userId}`)

            // a. Get schedule
            const { schedule } = await getRoadmapSchedule(program.id)
            const dateToDay: Record<string, string> = {}
            Object.entries(schedule).forEach(([dayId, dates]) => {
                dates.forEach(d => { dateToDay[d] = dayId })
            })

            // b. Check if yesterday was missed
            if (dateToDay[yesterdayStr]) {
                const [progress] = await db
                    .select()
                    .from(schema.dailyProgress)
                    .where(and(
                        eq(schema.dailyProgress.userId, program.userId),
                        eq(schema.dailyProgress.date, yesterdayStr)
                    ))
                    .limit(1)

                if (!progress) {
                    await setDayOff(program.id, yesterdayStr, true)
                    console.log(`[Maintenance Cron] Auto-shifted missed day: ${yesterdayStr}`)
                }
            }

            // c. Send Yesterday Stats
            const [profile] = await db
                .select()
                .from(schema.profiles)
                .where(eq(schema.profiles.id, program.userId))
                .limit(1)

            if (profile && profile.emailNotifications) {
                if (profile.hasStartedRoadmap) {
                    await sendYesterdayStats(program.userId, profile.email)
                    console.log(`[Maintenance Cron] Stats email sent to ${profile.email}`)
                } else {
                    await sendStartReminder(profile.email)
                    console.log(`[Maintenance Cron] Start reminder sent to ${profile.email}`)
                }
            }
        }

        return NextResponse.json({ success: true, processed: activePrograms.length })
    } catch (error) {
        console.error('[Maintenance Cron] Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
