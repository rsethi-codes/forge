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
import { adjustCoins } from './rewards'
import { groq } from '@ai-sdk/groq'
import { generateObject } from 'ai'
import { z } from 'zod'

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
    const [tasks, completions, kcs, kcResults, topicsData, topicCompletions, leetcodeProblems] = await Promise.all([
        db.select().from(schema.roadmapTasks).where(eq(schema.roadmapTasks.dayId, day.id)).orderBy(schema.roadmapTasks.sortOrder),
        db.select().from(schema.taskCompletions).where(eq(schema.taskCompletions.dailyProgressId, progress.id)),
        db.select().from(schema.knowledgeChecks).where(eq(schema.knowledgeChecks.dayId, day.id)).orderBy(schema.knowledgeChecks.sortOrder),
        db.select().from(schema.knowledgeCheckResults).where(eq(schema.knowledgeCheckResults.dailyProgressId, progress.id)),
        db.select().from(schema.roadmapTopics).where(eq(schema.roadmapTopics.dayId, day.id)).orderBy(schema.roadmapTopics.sortOrder),
        db.select().from(schema.topicCompletions).where(eq(schema.topicCompletions.dailyProgressId, progress.id)),
        db.select().from(schema.leetcodeProblems).where(eq(schema.leetcodeProblems.dayId, day.id)).orderBy(schema.leetcodeProblems.sortOrder)
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
                timeSpent: comp?.timeSpent || 0,       // gross seconds
                timeSpentNet: comp?.timeSpentNet || 0, // net seconds
                startedAt: comp?.startedAt || null,
                timerSessions: comp?.timerSessions || [],
                timerStatus: comp?.timerStatus || 'idle',
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
                timeSpent: comp?.timeSpent || 0,       // gross seconds
                timeSpentNet: comp?.timeSpentNet || 0, // net seconds
                startedAt: comp?.startedAt || null,
                timerSessions: comp?.timerSessions || [],
                timerStatus: comp?.timerStatus || 'idle',
                notes: comp?.notes || '',
                subtopics: subtopics.filter((s: any) => s.topicId === t.id)
            }
        }),
        leetcodeProblems
    }
}

export async function toggleTaskCompletion(taskId: string, progressId: string, completed: boolean) {
    // Fetch existing completion to preserve startedAt if already set
    const [existing] = await db
        .select({ startedAt: schema.taskCompletions.startedAt })
        .from(schema.taskCompletions)
        .where(and(
            eq(schema.taskCompletions.taskId, taskId),
            eq(schema.taskCompletions.dailyProgressId, progressId)
        ))
        .limit(1)

    const startedAt = existing?.startedAt ?? (completed ? new Date() : null)

    await db
        .insert(schema.taskCompletions)
        .values({
            taskId,
            dailyProgressId: progressId,
            completed,
            completedAt: completed ? new Date() : null,
            startedAt,
            timeSpent: 0
        })
        .onConflictDoUpdate({
            target: [schema.taskCompletions.taskId, schema.taskCompletions.dailyProgressId],
            set: {
                completed,
                completedAt: completed ? new Date() : null,
                // Only set startedAt if not already recorded
                ...(existing?.startedAt == null && completed ? { startedAt: new Date() } : {})
            }
        })

    const [prog] = await db
        .select({ date: schema.dailyProgress.date, userId: schema.dailyProgress.userId })
        .from(schema.dailyProgress)
        .where(eq(schema.dailyProgress.id, progressId))
        .limit(1)

    let unlockedMilestones: any[] = []
    if (prog) {
        await calculateDailyDiscipline(prog.date, prog.userId)
        unlockedMilestones = await checkAndUnlockMilestones(prog.userId)

        if (completed) {
            analytics.trackTaskCompleted(taskId, progressId)
            await adjustCoins(prog.userId, 'task_complete')

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

    // Revalidate only the specific day page and the tracker overview
    const dayNum = await getDayNumberForProgress(progressId)
    if (dayNum) revalidatePath(`/tracker/day/${dayNum}`)
    revalidatePath('/tracker')
    revalidatePath('/dashboard')

    return { success: true, unlockedMilestones }
}

export async function updateTaskDetail(
    taskId: string,
    progressId: string,
    data: {
        timeSpent?: number        // gross seconds
        timeSpentNet?: number     // net seconds
        startedAt?: Date | null
        timerSessions?: Array<{ start: string; end: string }>
        notes?: string
    }
) {
    const user = await requireUser()
    await db
        .insert(schema.taskCompletions)
        .values({
            taskId,
            dailyProgressId: progressId,
            timeSpent: data.timeSpent ?? 0,
            timeSpentNet: data.timeSpentNet ?? 0,
            startedAt: data.startedAt ?? null,
            timerSessions: data.timerSessions ?? [],
            notes: data.notes || '',
            completed: false
        })
        .onConflictDoUpdate({
            target: [schema.taskCompletions.taskId, schema.taskCompletions.dailyProgressId],
            set: {
                ...(data.timeSpent !== undefined && { timeSpent: data.timeSpent }),
                ...(data.timeSpentNet !== undefined && { timeSpentNet: data.timeSpentNet }),
                ...(data.startedAt !== undefined && { startedAt: data.startedAt }),
                ...(data.timerSessions !== undefined && { timerSessions: data.timerSessions }),
                ...(data.notes !== undefined && { notes: data.notes })
            }
        })

    // Auto-recalc hoursLogged from sum of all topic + task net times
    await recalcDayHours(progressId)
    // No revalidatePath here — client updates state optimistically via handleTimerStop
}

export async function toggleTopicCompletion(topicId: string, progressId: string, completed: boolean) {
    const [existing] = await db
        .select({ startedAt: schema.topicCompletions.startedAt })
        .from(schema.topicCompletions)
        .where(and(
            eq(schema.topicCompletions.topicId, topicId),
            eq(schema.topicCompletions.dailyProgressId, progressId)
        ))
        .limit(1)

    await db
        .insert(schema.topicCompletions)
        .values({
            topicId,
            dailyProgressId: progressId,
            completed,
            completedAt: completed ? new Date() : null,
            startedAt: existing?.startedAt ?? (completed ? new Date() : null),
            timeSpent: 0
        })
        .onConflictDoUpdate({
            target: [schema.topicCompletions.topicId, schema.topicCompletions.dailyProgressId],
            set: {
                completed,
                completedAt: completed ? new Date() : null,
                ...(existing?.startedAt == null && completed ? { startedAt: new Date() } : {})
            }
        })
    if (completed) {
        analytics.trackTopicCompleted(topicId, progressId)
    }

    const [prog] = await db
        .select({ date: schema.dailyProgress.date, userId: schema.dailyProgress.userId })
        .from(schema.dailyProgress)
        .where(eq(schema.dailyProgress.id, progressId))
        .limit(1)

    let unlockedMilestones: any[] = []
    if (prog) {
        await calculateDailyDiscipline(prog.date, prog.userId)
        unlockedMilestones = await checkAndUnlockMilestones(prog.userId)
    }

    const dayNum = await getDayNumberForProgress(progressId)
    if (dayNum) revalidatePath(`/tracker/day/${dayNum}`)
    revalidatePath('/tracker')
    revalidatePath('/dashboard')

    return { success: true, unlockedMilestones }
}

export async function updateTopicDetail(
    topicId: string,
    progressId: string,
    data: {
        timeSpent?: number
        timeSpentNet?: number
        startedAt?: Date | null
        timerSessions?: Array<{ start: string; end: string }>
        notes?: string
    }
) {
    const user = await requireUser()
    await db
        .insert(schema.topicCompletions)
        .values({
            topicId,
            dailyProgressId: progressId,
            timeSpent: data.timeSpent ?? 0,
            timeSpentNet: data.timeSpentNet ?? 0,
            startedAt: data.startedAt ?? null,
            timerSessions: data.timerSessions ?? [],
            notes: data.notes || '',
            completed: false
        })
        .onConflictDoUpdate({
            target: [schema.topicCompletions.topicId, schema.topicCompletions.dailyProgressId],
            set: {
                ...(data.timeSpent !== undefined && { timeSpent: data.timeSpent }),
                ...(data.timeSpentNet !== undefined && { timeSpentNet: data.timeSpentNet }),
                ...(data.startedAt !== undefined && { startedAt: data.startedAt }),
                ...(data.timerSessions !== undefined && { timerSessions: data.timerSessions }),
                ...(data.notes !== undefined && { notes: data.notes })
            }
        })

    await recalcDayHours(progressId)
    // No revalidatePath here — client updates state optimistically via handleTimerStop
}

/** Look up the dayNumber for a given progressId to build a targeted revalidatePath */
async function getDayNumberForProgress(progressId: string): Promise<string | null> {
    const [row] = await db
        .select({ dayNumber: schema.roadmapDays.dayNumber })
        .from(schema.dailyProgress)
        .innerJoin(schema.roadmapDays, eq(schema.dailyProgress.dayId, schema.roadmapDays.id))
        .where(eq(schema.dailyProgress.id, progressId))
        .limit(1)
    return row?.dayNumber ?? null
}

/** Sum all net seconds from topic + task completions and write hoursLogged automatically */
async function recalcDayHours(progressId: string) {
    const [taskTimes, topicTimes] = await Promise.all([
        db.select({ net: schema.taskCompletions.timeSpentNet })
            .from(schema.taskCompletions)
            .where(eq(schema.taskCompletions.dailyProgressId, progressId)),
        db.select({ net: schema.topicCompletions.timeSpentNet })
            .from(schema.topicCompletions)
            .where(eq(schema.topicCompletions.dailyProgressId, progressId)),
    ])
    const totalNetSeconds = [
        ...taskTimes.map((r: any) => r.net ?? 0),
        ...topicTimes.map((r: any) => r.net ?? 0)
    ].reduce((a: number, b: number) => a + b, 0)
    const hoursLogged = (totalNetSeconds / 3600).toFixed(2)
    await db
        .update(schema.dailyProgress)
        .set({ hoursLogged })
        .where(eq(schema.dailyProgress.id, progressId))
}

export async function updateDayProgress(progressId: string, data: { status?: any, hours?: string, notes?: string }) {
    await db
        .update(schema.dailyProgress)
        .set({
            ...(data.status !== undefined && { status: data.status }),
            // hours is auto-managed by recalcDayHours; only override if explicitly passed
            ...(data.hours !== undefined && { hoursLogged: data.hours }),
            // Use !== undefined so clearing notes (empty string) actually saves
            ...(data.notes !== undefined && { sessionNotes: data.notes }),
            ...(data.status === 'complete' && { completedAt: new Date() })
        })
        .where(eq(schema.dailyProgress.id, progressId))

    const [prog] = await db
        .select({ date: schema.dailyProgress.date, userId: schema.dailyProgress.userId })
        .from(schema.dailyProgress)
        .where(eq(schema.dailyProgress.id, progressId))
        .limit(1)

    let unlockedMilestones: any[] = []
    if (prog) {
        await calculateDailyDiscipline(prog.date, prog.userId)
        unlockedMilestones = await checkAndUnlockMilestones(prog.userId)
    }

    // Status/notes changes affect both the day view and the dashboard overview
    const dayNum = await getDayNumberForProgress(progressId)
    if (dayNum) revalidatePath(`/tracker/day/${dayNum}`)
    revalidatePath('/tracker')
    revalidatePath('/dashboard')

    return { success: true, unlockedMilestones }
}


export async function updateKCResult(kcId: string, progressId: string, passed: boolean, notes: string, answer?: string) {
    const user = await requireUser()

    // 1. Get Context for AI Evaluation if answer provided
    let aiUpdate = {}
    if (answer) {
        const check = await db.query.knowledgeChecks.findFirst({
            where: eq(schema.knowledgeChecks.id, kcId),
            with: {
                day: {
                    with: {
                        topics: {
                            with: {
                                subtopics: true
                            }
                        }
                    }
                }
            }
        })

        if (check) {
            const { day } = check as any;
            const { object: feedback } = await generateObject({
                model: groq('llama-3.3-70b-versatile'),
                schema: z.object({
                    score: z.number().min(0).max(100),
                    missedPoints: z.array(z.string()),
                    understandingLevel: z.enum(['Novice', 'Competent', 'Operational', 'Expert']),
                    feedback: z.string(),
                    mentorComment: z.string()
                }),
                system: `You are the Forge AI Evaluator. You assess a user's comprehension of a specific technical topic.
                Be brutal but constructive. Reward depth and architectural understanding. 
                Penalize surface-level answers that don't address the "Why" or "Scale".`,
                prompt: `
                Context (Day): ${day.title}
                Focus: ${day.focus}
                Detailed Topics: ${day.topics.map((t: any) => t.title + ': ' + t.subtopics.map((s: any) => s.content).join(', ')).join('; ')}
                
                Question: ${check.questionText}
                User Answer: "${answer}"

                Analyze the answer and provide:
                1. A score from 0-100.
                2. A list of specific technical points or concepts they missed.
                3. Their understanding level.
                4. Detailed feedback explaining the score.
                5. A personal, high-agency mentor comment.
                `
            })

            aiUpdate = {
                aiScore: feedback.score,
                aiFeedback: feedback.feedback + "\n\n" + feedback.mentorComment,
                missedPoints: feedback.missedPoints,
                understandingLevel: feedback.understandingLevel,
                passed: feedback.score >= 70, // Auto-pass threshold
                answer
            }
        }
    }

    await db
        .insert(schema.knowledgeCheckResults)
        .values({
            knowledgeCheckId: kcId,
            dailyProgressId: progressId,
            attempted: true,
            passed,
            notes,
            ...aiUpdate
        })
        .onConflictDoUpdate({
            target: [schema.knowledgeCheckResults.knowledgeCheckId, schema.knowledgeCheckResults.dailyProgressId],
            set: {
                passed: (aiUpdate as any).passed ?? passed,
                notes,
                attempted: true,
                ...aiUpdate
            }
        })

    const [prog] = await db
        .select({ date: schema.dailyProgress.date, userId: schema.dailyProgress.userId })
        .from(schema.dailyProgress)
        .where(eq(schema.dailyProgress.id, progressId))
        .limit(1)

    let unlockedMilestones: any[] = []
    if (prog) {
        await calculateDailyDiscipline(prog.date, prog.userId)
        unlockedMilestones = await checkAndUnlockMilestones(prog.userId)
        analytics.trackKCAttempted(kcId, (aiUpdate as any).passed ?? passed)
        if ((aiUpdate as any).passed ?? passed) {
            await adjustCoins(prog.userId, 'kc_pass')
        }
    }

    return { success: true, unlockedMilestones, feedback: (aiUpdate as any).aiFeedback }
}

export async function syncTimerState(
    type: 'task' | 'topic',
    id: string,
    progressId: string,
    status: 'idle' | 'running' | 'paused',
    data: {
        timeSpent?: number
        timeSpentNet?: number
        sessions?: any[]
    }
) {
    // Guard: ensure the progress record belongs to the calling user
    const user = await requireUser()
    const [prog] = await db
        .select({ userId: schema.dailyProgress.userId })
        .from(schema.dailyProgress)
        .where(and(
            eq(schema.dailyProgress.id, progressId),
            eq(schema.dailyProgress.userId, user.id)
        ))
        .limit(1)
    if (!prog) throw new Error('Unauthorized')
    const table: any = type === 'task' ? schema.taskCompletions : schema.topicCompletions
    const idField = type === 'task' ? 'taskId' : 'topicId'

    await db
        .insert(table)
        .values({
            [idField]: id,
            dailyProgressId: progressId,
            timerStatus: status,
            lastTimerPulse: new Date(),
            timeSpent: data.timeSpent ?? 0,
            timeSpentNet: data.timeSpentNet ?? 0,
            timerSessions: data.sessions ?? []
        })
        .onConflictDoUpdate({
            target: [table[idField], table.dailyProgressId],
            set: {
                timerStatus: status,
                lastTimerPulse: new Date(),
                ...(data.timeSpent !== undefined && { timeSpent: data.timeSpent }),
                ...(data.timeSpentNet !== undefined && { timeSpentNet: data.timeSpentNet }),
                ...(data.sessions !== undefined && { timerSessions: data.sessions })
            }
        })

    if (status === 'idle') {
        await recalcDayHours(progressId)
    }
}
