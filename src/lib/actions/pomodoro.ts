'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireUser } from '../auth-utils'

export async function createPomodoroSession(data: {
    type: 'work' | 'short_break' | 'long_break'
    durationMinutes: number
    taskId?: string
}) {
    const user = await requireUser()
    // Find today's progress to link to
    const today = new Date().toISOString().split('T')[0]

    const [progress] = await db
        .select()
        .from(schema.dailyProgress)
        .where(and(
            eq(schema.dailyProgress.date, today),
            eq(schema.dailyProgress.userId, user.id)
        ))
        .limit(1)

    const [session] = await db
        .insert(schema.pomodoroSessions)
        .values({
            userId: user.id,
            dailyProgressId: progress?.id || null,
            type: data.type,
            durationMinutes: data.durationMinutes,
            taskId: data.taskId || null,
            completed: false,
            startedAt: new Date(),
        })
        .returning()

    return session
}

export async function completePomodoroSession(id: string) {
    const user = await requireUser()
    await db
        .update(schema.pomodoroSessions)
        .set({
            completed: true,
            completedAt: new Date(),
        })
        .where(and(
            eq(schema.pomodoroSessions.id, id),
            eq(schema.pomodoroSessions.userId, user.id)
        ))

    revalidatePath('/analytics')
    return { success: true }
}

export async function getTodaysPomodoros() {
    const user = await requireUser()
    const today = new Date().toISOString().split('T')[0]

    return await db
        .select({
            id: schema.pomodoroSessions.id,
            type: schema.pomodoroSessions.type,
            durationMinutes: schema.pomodoroSessions.durationMinutes,
            completed: schema.pomodoroSessions.completed,
            startedAt: schema.pomodoroSessions.startedAt,
        })
        .from(schema.pomodoroSessions)
        .where(and(
            eq(sql`CAST(${schema.pomodoroSessions.startedAt} AS DATE)`, today),
            eq(schema.pomodoroSessions.userId, user.id)
        ))
        .orderBy(desc(schema.pomodoroSessions.startedAt))
}
