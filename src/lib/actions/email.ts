'use server'

import { Resend } from 'resend'
import { MorningDigestEmail } from '@/components/emails/MorningDigest'
import { ReminderEmail } from '@/components/emails/ReminderEmail'
import { YesterdayStatsEmail } from '@/components/emails/YesterdayStatsEmail'
import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { desc, eq, sql, and } from 'drizzle-orm'
import { format } from 'date-fns'

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
export async function sendStartReminder(email: string) {
    if (!process.env.RESEND_API_KEY) return { success: false }

    const quotes = [
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
        { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
        { text: "Done is better than perfect.", author: "Sheryl Sandberg" }
    ]
    const quote = quotes[Math.floor(Math.random() * quotes.length)]

    try {
        await resend.emails.send({
            from: 'FORGE <onboarding@resend.dev>',
            to: [email],
            subject: 'FORGE: Ignite the Engine',
            react: ReminderEmail({ quote: quote.text, author: quote.author }),
        })
        return { success: true }
    } catch (e) {
        return { success: false, error: String(e) }
    }
}

export async function sendYesterdayStats(userId: string, email: string) {
    if (!process.env.RESEND_API_KEY) return { success: false }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = format(yesterday, 'yyyy-MM-dd')

    // Get score
    const [score] = await db
        .select()
        .from(schema.disciplineScores)
        .where(and(eq(schema.disciplineScores.userId, userId), eq(schema.disciplineScores.date, dateStr)))
        .limit(1)

    if (!score) return { success: false, error: 'No stats for yesterday' }

    // Get completion counts
    const [progress] = await db
        .select()
        .from(schema.dailyProgress)
        .where(and(eq(schema.dailyProgress.userId, userId), eq(schema.dailyProgress.date, dateStr)))
        .limit(1)

    if (!progress) return { success: false }

    const tasks = await db
        .select()
        .from(schema.taskCompletions)
        .where(eq(schema.taskCompletions.dailyProgressId, progress.id))

    const dayNumber = await db.select({ num: schema.roadmapDays.dayNumber })
        .from(schema.roadmapDays)
        .where(eq(schema.roadmapDays.id, progress.dayId))
        .limit(1)
        .then(res => parseInt(res[0]?.num || '0'))

    try {
        await resend.emails.send({
            from: 'FORGE <onboarding@resend.dev>',
            to: [email],
            subject: `FORGE: Day ${dayNumber} Post-Mortem`,
            react: YesterdayStatsEmail({
                date: dateStr,
                dayNumber,
                disciplineScore: Number(score.disciplineScore),
                hoursLogged: progress.hoursLogged,
                tasksCompleted: tasks.filter(t => t.completed).length,
                tasksTotal: tasks.length
            }),
        })
        return { success: true }
    } catch (e) {
        return { success: false, error: String(e) }
    }
}
