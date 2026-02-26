
'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, and, lt, isNull, desc, sql } from 'drizzle-orm'
import { requireUser } from '../auth-utils'
import { format, isBefore, parseISO, addDays, startOfDay } from 'date-fns'
import { getRoadmapSchedule, setDayOff } from './scheduling'
import { sendMorningDigest, sendStartReminder } from './email'

export async function syncUserDailyLogin(todayStr: string) {
    const user = await requireUser()
    const now = new Date()

    // 1. Get profile
    const [profile] = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.id, user.id))
        .limit(1)

    if (!profile) return { isFirstLoginToday: false }

    const lastLoginStr = profile.lastLoginAt ? format(profile.lastLoginAt, 'yyyy-MM-dd') : null
    const isFirstLoginToday = lastLoginStr !== todayStr

    // 2. Update last login
    await db.update(schema.profiles)
        .set({ lastLoginAt: now })
        .where(eq(schema.profiles.id, user.id))

    if (isFirstLoginToday) {
        // Run daily sync logic
        await runDailyMaintenance(user.id, profile, todayStr)
    }

    return {
        isFirstLoginToday,
        hasStartedRoadmap: profile.hasStartedRoadmap
    }
}

async function runDailyMaintenance(userId: string, profile: any, todayStr: string) {
    // 1. Get active program
    const [program] = await db
        .select()
        .from(schema.roadmapPrograms)
        .where(and(
            eq(schema.roadmapPrograms.userId, userId),
            eq(schema.roadmapPrograms.isActive, true)
        ))
        .limit(1)

    if (!program) return

    // 2. Check if we missed any days
    // We get the schedule and see what day was supposed to be done yesterday
    console.log(`[DailyMaintenance] Syncing for user ${userId}, today is ${todayStr}`)
    const { schedule } = await getRoadmapSchedule(program.id, userId)

    // Convert schedule dayId -> [date] into date -> dayId
    const dateToDay: Record<string, string> = {}
    Object.entries(schedule).forEach(([dayId, dates]) => {
        dates.forEach(d => { dateToDay[d] = dayId })
    })

    // Find the starting point for checking missed days
    const startCheckingFrom = profile.lastLoginAt
        ? startOfDay(new Date(profile.lastLoginAt))
        : startOfDay(new Date(program.startDate))

    const today = startOfDay(parseISO(todayStr))
    console.log(`[DailyMaintenance] Syncing for user ${userId}, checking from ${format(startCheckingFrom, 'yyyy-MM-dd')} to ${todayStr}`)

    let checkDate = startCheckingFrom
    while (isBefore(checkDate, today)) {
        const dateToCheckStr = format(checkDate, 'yyyy-MM-dd')

        // Check if user had any progress on this date
        const [progress] = await db
            .select()
            .from(schema.dailyProgress)
            .where(and(
                eq(schema.dailyProgress.userId, userId),
                eq(schema.dailyProgress.date, dateToCheckStr)
            ))
            .limit(1)

        // If no progress AND it was a scheduled day, we used to auto-shift.
        // Now we leave it as 'missed' naturally to maintain linear focus.
        if (!progress && dateToDay[dateToCheckStr]) {
            console.log(`[DailyMaintenance] Missed day detected: ${dateToCheckStr}. Linear mode active, no auto-shift.`)
        }

        checkDate = addDays(checkDate, 1)
    }

    // 3. Handle "Not Started" Reminder
    if (!profile.hasStartedRoadmap) {
        // Check if we already sent a reminder today
        const lastSent = profile.lastReminderSentAt ? startOfDay(new Date(profile.lastReminderSentAt)) : null
        const today = startOfDay(new Date())

        if (!lastSent || isBefore(lastSent, today)) {
            const res = await sendStartReminder(profile.email)
            if (res.success) {
                await db.update(schema.profiles)
                    .set({ lastReminderSentAt: new Date() })
                    .where(eq(schema.profiles.id, userId))
                console.log(`[DailyMaintenance] Start reminder sent to ${profile.email}`)
            }
        }
    }
}

async function sendReminderToStart(email: string) {
    // This is the "Reminder if not started" email with an awesome quote
    const quotes = [
        "The secret of getting ahead is getting started. — Mark Twain",
        "You don't have to be great to start, but you have to start to be great. — Zig Ziglar",
        "The best time to plant a tree was 20 years ago. The second best time is now. — Chinese Proverb",
        "Amateurs sit and wait for inspiration, the rest of us just get up and go to work. — Stephen King",
        "Done is better than perfect. — Sheryl Sandberg"
    ]
    const quote = quotes[Math.floor(Math.random() * quotes.length)]

    // We can reuse the sendMorningDigest logic or create a specific one
    // For now, let's just log it or add a TODO for a specific email template
    console.log(`[Reminder] Sending starting reminder to ${email}: ${quote}`)

    // TODO: Implement specific ReminderEmail template
}
