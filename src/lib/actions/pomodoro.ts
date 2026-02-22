'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createPomodoroSession(data: {
    type: 'work' | 'short_break' | 'long_break'
    durationMinutes: number
    taskId?: string
}) {
    // Find today's progress to link to
    const today = new Date().toISOString().split('T')[0]

    // We fetch any daily progress for today. Ideally, we should have a logic 
    // to ensure daily progress exists before starting a session.
    // For now, we find the most recent one or allow null (schema allows it)

    const [progress] = await db
        .select()
        .from(schema.dailyProgress)
        .where(eq(schema.dailyProgress.date, today))
        .limit(1)

    const [session] = await db
        .insert(schema.pomodoroSessions)
        .values({
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
    await db
        .update(schema.pomodoroSessions)
        .set({
            completed: true,
            completedAt: new Date(),
        })
        .where(eq(schema.pomodoroSessions.id, id))

    revalidatePath('/analytics')
    return { success: true }
}

export async function getTodaysPomodoros() {
    const today = new Date().toISOString().split('T')[0]

    // This is a bit complex since sessions are linked to dailyProgress
    // We can join with dailyProgress to filter by date
    return await db
        .select({
            id: schema.pomodoroSessions.id,
            type: schema.pomodoroSessions.type,
            durationMinutes: schema.pomodoroSessions.durationMinutes,
            completed: schema.pomodoroSessions.completed,
            startedAt: schema.pomodoroSessions.startedAt,
        })
        .from(schema.pomodoroSessions)
        .leftJoin(schema.dailyProgress, eq(schema.pomodoroSessions.dailyProgressId, schema.dailyProgress.id))
        .where(eq(schema.dailyProgress.date, today))
        .orderBy(desc(schema.pomodoroSessions.startedAt))
}
