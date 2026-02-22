'use server'

import { Resend } from 'resend'
import { MorningDigestEmail } from '@/components/emails/MorningDigest'
import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { desc, eq, sql } from 'drizzle-orm'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendMorningDigest(email: string) {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured')
        return { success: false, error: 'API Key missing' }
    }

    // 1. Get stats
    const [latestScore] = await db
        .select()
        .from(schema.disciplineScores)
        .orderBy(desc(schema.disciplineScores.date))
        .limit(1)

    const [currentDay] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.dailyProgress)
        .where(eq(schema.dailyProgress.status, 'complete'))

    const dayNumber = Number(currentDay?.count || 0) + 1

    // 2. Get today's tasks
    // This is a bit simplified - we fetch the first program's tasks for current dayNumber
    const [day] = await db
        .select()
        .from(schema.roadmapDays)
        .where(eq(schema.roadmapDays.dayNumber, dayNumber.toString()))
        .limit(1)

    let taskTitles: string[] = []
    if (day) {
        const tasks = await db
            .select()
            .from(schema.roadmapTasks)
            .where(eq(schema.roadmapTasks.dayId, day.id))
        taskTitles = tasks.map((t: any) => t.title)
    }

    // 3. Send email
    try {
        const { data, error: resendError } = await resend.emails.send({
            from: 'FORGE <onboarding@resend.dev>', // For dev testing, Resend allows this
            to: [email],
            subject: `FORGE: Day ${dayNumber} Briefing`,
            react: MorningDigestEmail({
                dayNumber,
                streak: latestScore?.streakDays || 0,
                disciplineScore: Number(latestScore?.disciplineScore || 0),
                tasks: taskTitles.length > 0 ? taskTitles : ['Push your boundaries.', 'Analyze performance.', 'Stay disciplined.']
            }),
        })

        if (resendError) {
            return { success: false, error: resendError.message }
        }

        return { success: true, id: data?.id }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}
