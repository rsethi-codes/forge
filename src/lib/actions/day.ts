'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, and, sql, inArray, desc } from 'drizzle-orm'
import { format, addDays } from 'date-fns'
import { calculateDailyDiscipline } from '@/lib/discipline'
import { checkAndUnlockMilestones } from '@/lib/milestones'
import { revalidatePath } from 'next/cache'
import { analytics } from '@/lib/analytics'
import { requireUser } from '@/lib/auth-utils'
import { postToLinkedIn, generateBuildCompletionPost } from '@/lib/integrations/linkedin'

export async function getDayDetail(dayNumber: number | string) {
    const user = await requireUser()
    // 1. Get the current (active) program to find the absolute date for this day
    let [program] = await db
        .select()
        .from(schema.roadmapPrograms)
        .where(and(
            eq(schema.roadmapPrograms.isActive, true),
            eq(schema.roadmapPrograms.userId, user.id)
        ))
        .limit(1)

    if (!program) {
        [program] = await db
            .select()
            .from(schema.roadmapPrograms)
            .where(eq(schema.roadmapPrograms.userId, user.id))
            .orderBy(desc(schema.roadmapPrograms.createdAt))
            .limit(1)
    }

    if (!program) return null

    // Calculate the target date for this dayNumber
    const dNum = parseInt(dayNumber.toString())
    const targetDate = format(addDays(new Date(program.startDate), dNum - 1), 'yyyy-MM-dd')

    // 2. Get the day definition
    const [day] = await db
        .select()
        .from(schema.roadmapDays)
        .where(eq(schema.roadmapDays.dayNumber, dayNumber.toString()))
        .limit(1)

    if (!day) return null

    // 3. Get or create daily progress for this date and day
    let [progress] = await db
        .select()
        .from(schema.dailyProgress)
        .where(and(
            eq(schema.dailyProgress.dayId, day.id),
            eq(schema.dailyProgress.date, targetDate),
            eq(schema.dailyProgress.userId, user.id)
        ))
        .limit(1)

    if (!progress) {
        [progress] = await db
            .insert(schema.dailyProgress)
            .values({
                dayId: day.id,
                userId: user.id,
                date: targetDate,
                status: 'not_started',
                hoursLogged: '0'
            })
            .returning()
    }

    // 4, 5, 6. Fetch related data in parallel
    const [tasks, completions, kcs, kcResults, topicsData, topicCompletions] = await Promise.all([
        db.select().from(schema.roadmapTasks).where(eq(schema.roadmapTasks.dayId, day.id)).orderBy(schema.roadmapTasks.sortOrder),
        db.select().from(schema.taskCompletions).where(eq(schema.taskCompletions.dailyProgressId, progress.id)),
        db.select().from(schema.knowledgeChecks).where(eq(schema.knowledgeChecks.dayId, day.id)).orderBy(schema.knowledgeChecks.sortOrder),
        db.select().from(schema.knowledgeCheckResults).where(eq(schema.knowledgeCheckResults.dailyProgressId, progress.id)),
        db.select().from(schema.roadmapTopics).where(eq(schema.roadmapTopics.dayId, day.id)).orderBy(schema.roadmapTopics.sortOrder),
        db.select().from(schema.topicCompletions).where(eq(schema.topicCompletions.dailyProgressId, progress.id))
    ])

    // Get subtopics for all topics at once
    const topicIds = topicsData.map((t: any) => t.id)
    const subtopics = topicIds.length > 0
        ? await db
            .select()
            .from(schema.roadmapSubtopics)
            .where(inArray(schema.roadmapSubtopics.topicId, topicIds))
            .orderBy(schema.roadmapSubtopics.sortOrder)
        : []

    return {
        day,
        progress: {
            ...progress,
            hoursLogged: Number(progress.hoursLogged)
        },
        tasks: tasks.map((t: any) => {
            const comp = completions.find((c: any) => c.taskId === t.id)
            return {
                ...t,
                completed: comp?.completed || false,
                timeSpent: comp?.timeSpent || 0,
                notes: comp?.notes || ''
            }
        }),
        kcs: kcs.map((k: any) => ({
            ...k,
            result: kcResults.find((r: any) => r.knowledgeCheckId === k.id)
        })),
        topics: topicsData.map((t: any) => {
            const comp = topicCompletions.find((tc: any) => tc.topicId === t.id)
            return {
                ...t,
                completed: comp?.completed || false,
                timeSpent: comp?.timeSpent || 0,
                notes: comp?.notes || '',
                subtopics: subtopics.filter((s: any) => s.topicId === t.id)
            }
        })
    }
}

export async function toggleTaskCompletion(taskId: string, progressId: string, completed: boolean) {
    await db
        .insert(schema.taskCompletions)
        .values({
            taskId,
            dailyProgressId: progressId,
            completed,
            completedAt: completed ? new Date() : null,
            timeSpent: 0
        })
        .onConflictDoUpdate({
            target: [schema.taskCompletions.taskId, schema.taskCompletions.dailyProgressId],
            set: {
                completed,
                completedAt: completed ? new Date() : null
            }
        })

    const [prog] = await db
        .select({ date: schema.dailyProgress.date, userId: schema.dailyProgress.userId })
        .from(schema.dailyProgress)
        .where(eq(schema.dailyProgress.id, progressId))
        .limit(1)

    if (prog) {
        await calculateDailyDiscipline(prog.date, prog.userId)
        await checkAndUnlockMilestones(prog.userId)

        if (completed) {
            analytics.trackTaskCompleted(taskId, progressId)

            // Check for build-type task to trigger social update
            const [task] = await db
                .select()
                .from(schema.roadmapTasks)
                .where(eq(schema.roadmapTasks.id, taskId))
                .limit(1)

            if (task && task.taskType === 'build') {
                const post = await generateBuildCompletionPost(task)
                await postToLinkedIn(prog.userId, post)
            }
        }
    }

    revalidatePath('/tracker')
}

export async function updateTaskDetail(taskId: string, progressId: string, data: { timeSpent: number, notes?: string }) {
    await db
        .insert(schema.taskCompletions)
        .values({
            taskId,
            dailyProgressId: progressId,
            timeSpent: data.timeSpent,
            notes: data.notes || '',
            completed: false
        })
        .onConflictDoUpdate({
            target: [schema.taskCompletions.taskId, schema.taskCompletions.dailyProgressId],
            set: {
                timeSpent: data.timeSpent,
                notes: data.notes || ''
            }
        })
    revalidatePath('/tracker')
}

export async function toggleTopicCompletion(topicId: string, progressId: string, completed: boolean) {
    await db
        .insert(schema.topicCompletions)
        .values({
            topicId,
            dailyProgressId: progressId,
            completed,
            completedAt: completed ? new Date() : null,
            timeSpent: 0
        })
        .onConflictDoUpdate({
            target: [schema.topicCompletions.topicId, schema.topicCompletions.dailyProgressId],
            set: {
                completed,
                completedAt: completed ? new Date() : null
            }
        })
    if (completed) {
        analytics.trackTopicCompleted(topicId, progressId)
    }
    revalidatePath('/tracker')
}

export async function updateTopicDetail(topicId: string, progressId: string, data: { timeSpent: number, notes?: string }) {
    await db
        .insert(schema.topicCompletions)
        .values({
            topicId,
            dailyProgressId: progressId,
            timeSpent: data.timeSpent,
            notes: data.notes || '',
            completed: false
        })
        .onConflictDoUpdate({
            target: [schema.topicCompletions.topicId, schema.topicCompletions.dailyProgressId],
            set: {
                timeSpent: data.timeSpent,
                notes: data.notes || ''
            }
        })
    revalidatePath('/tracker')
}

export async function updateDayProgress(progressId: string, data: { status?: any, hours?: string, notes?: string }) {
    await db
        .update(schema.dailyProgress)
        .set({
            ...(data.status && { status: data.status }),
            ...(data.hours && { hoursLogged: data.hours }),
            ...(data.notes && { sessionNotes: data.notes }),
            ...(data.status === 'complete' && { completedAt: new Date() })
        })
        .where(eq(schema.dailyProgress.id, progressId))

    const [prog] = await db
        .select({ date: schema.dailyProgress.date, userId: schema.dailyProgress.userId })
        .from(schema.dailyProgress)
        .where(eq(schema.dailyProgress.id, progressId))
        .limit(1)

    if (prog) {
        await calculateDailyDiscipline(prog.date, prog.userId)
        await checkAndUnlockMilestones(prog.userId)
    }

    revalidatePath('/tracker')
    revalidatePath('/dashboard')
}

export async function updateKCResult(kcId: string, progressId: string, passed: boolean, notes: string) {
    await db
        .insert(schema.knowledgeCheckResults)
        .values({
            knowledgeCheckId: kcId,
            dailyProgressId: progressId,
            attempted: true,
            passed,
            notes
        })
        .onConflictDoUpdate({
            target: [schema.knowledgeCheckResults.knowledgeCheckId, schema.knowledgeCheckResults.dailyProgressId],
            set: { passed, notes, attempted: true }
        })

    const [prog] = await db
        .select({ date: schema.dailyProgress.date, userId: schema.dailyProgress.userId })
        .from(schema.dailyProgress)
        .where(eq(schema.dailyProgress.id, progressId))
        .limit(1)

    if (prog) {
        await calculateDailyDiscipline(prog.date, prog.userId)
        await checkAndUnlockMilestones(prog.userId)
        analytics.trackKCAttempted(kcId, passed)
    }
}
