'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, and, sql, desc, avg, count, sum } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { adjustCoins } from './rewards'
import { requireUser } from '../auth-utils'

export async function startSession(dayId?: string) {
    const user = await requireUser()
    const [session] = await db.insert(schema.timeSessions)
        .values({
            userId: user.id,
            dayId,
            startedAt: new Date()
        })
        .returning()
    return session.id
}

export async function endSession(sessionId: string, data: { interruptions: number, distractions: number }) {
    const [session] = await db.select().from(schema.timeSessions).where(eq(schema.timeSessions.id, sessionId)).limit(1)
    if (!session) return null

    const endedAt = new Date()
    const diffMs = endedAt.getTime() - session.startedAt.getTime()
    const activeMinutes = Math.floor(diffMs / 60000)

    await db.update(schema.timeSessions)
        .set({
            endedAt,
            totalActiveMinutes: activeMinutes,
            interruptionsCount: data.interruptions,
            distractionsCount: data.distractions
        })
        .where(eq(schema.timeSessions.id, sessionId))

    // Reward for deep session (no interruptions, > 60 mins)
    if (activeMinutes >= 60 && data.interruptions === 0) {
        await adjustCoins(session.userId, 'deep_session')
    }

    return { success: true, activeMinutes }
}

export async function logAppEvent(userId: string, sessionId: string | null, type: string, meta: any) {
    await db.insert(schema.appEvents).values({
        userId,
        sessionId,
        eventType: type,
        eventMeta: meta
    })
}

export async function computeDailyBehavior(userId: string, dateStr: string) {
    // 1. Fetch sessions for this day
    const sessions = await db.select().from(schema.timeSessions)
        .where(and(
            eq(schema.timeSessions.userId, userId),
            sql`date(${schema.timeSessions.startedAt}) = ${dateStr}`
        ))

    // 2. Fetch events for this day
    const events = await db.select().from(schema.appEvents)
        .where(and(
            eq(schema.appEvents.userId, userId),
            sql`date(${schema.appEvents.createdAt}) = ${dateStr}`
        ))

    if (sessions.length === 0) return null

    const productiveMinutes = sessions.reduce((acc, s) => acc + s.totalActiveMinutes, 0)
    const interruptions = sessions.reduce((acc, s) => acc + s.interruptionsCount, 0)
    const switchCount = events.filter(e => e.eventType === 'tab_switch').length

    // Simple algorithms for scores
    const switchRate = (switchCount / (productiveMinutes / 60 || 1)).toFixed(2)
    const focusScore = Math.max(0, 100 - (interruptions * 5) - (parseFloat(switchRate) * 2))
    const procrastinationScore = events.filter(e => e.eventType === 'distraction_click').length * 10

    // Peak window - simplified mode
    const hMap: Record<number, number> = {}
    sessions.forEach(s => {
        const h = s.startedAt.getHours()
        hMap[h] = (hMap[h] || 0) + s.totalActiveMinutes
    })
    const peakHour = Object.entries(hMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '9'
    const peakWindow = `${peakHour}:00 - ${parseInt(peakHour) + 2}:00`

    // Mock pomodoro success for logic
    const pomodoroSuccessRate = "0.85"

    await db.insert(schema.behaviorProfile)
        .values({
            userId,
            date: dateStr,
            focusScore: Math.round(focusScore),
            procrastinationScore,
            switchRate,
            pomodoroSuccessRate,
            productiveMinutes,
            peakProductivityWindow: peakWindow
        })
        .onConflictDoUpdate({
            target: [schema.behaviorProfile.userId, schema.behaviorProfile.date],
            set: {
                focusScore: Math.round(focusScore),
                procrastinationScore,
                switchRate,
                productiveMinutes,
                peakProductivityWindow: peakWindow
            }
        })

    return { focusScore, productiveMinutes }
}

export async function getQuickDashboard(userId: string) {
    const today = new Date().toISOString().split('T')[0]

    const [wallet] = await db.select({ coins: schema.rewardsWallet.coinsBalance })
        .from(schema.rewardsWallet)
        .where(eq(schema.rewardsWallet.userId, userId))
        .limit(1)

    const [profile] = await db.select().from(schema.behaviorProfile)
        .where(and(eq(schema.behaviorProfile.userId, userId), eq(schema.behaviorProfile.date, today)))
        .limit(1)

    let recommendedAction: 'QuickWin' | 'DeepWork' | 'Momentum' = 'DeepWork'
    let shortDiagnostic = "System nominal. Optimal window for Deep Work."

    // Check if it's late and nothing started
    const currentHour = new Date().getHours()
    const isLateStart = currentHour >= 11 && (!profile || profile.productiveMinutes === 0)

    if (isLateStart) {
        recommendedAction = 'Momentum'
        shortDiagnostic = "Inertia detected. Initializing 2-minute 'starter' sequence to bypass resistance."
    } else if (profile) {
        if (profile.focusScore < 60) {
            recommendedAction = 'QuickWin'
            shortDiagnostic = "Focus levels are erratic. Tackle a small task to recalibrate."
        } else if (profile.procrastinationScore > 40) {
            shortDiagnostic = "Distraction patterns detected. Tighten the environment."
        }
    }

    return {
        recommendedAction,
        shortDiagnostic,
        coinsBalance: wallet?.coins ?? 0,
        isLateStart
    }
}

export async function respondToNudge(nudgeId: string, responseText: string) {
    const [nudge] = await db.update(schema.nudges)
        .set({
            respondedAt: new Date(),
            response: responseText
        })
        .where(eq(schema.nudges.id, nudgeId))
        .returning()

    if (nudge && responseText.toLowerCase().includes('start')) {
        await adjustCoins(nudge.userId, 'task_complete') // Small reward for starting after nudge
    }

    return { success: true }
}
