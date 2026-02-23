'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, desc, and, sql, inArray } from 'drizzle-orm'
import { format } from 'date-fns'
import { calculateDailyDiscipline, calculateCurrentStreak } from '@/lib/discipline'
import { requireUser } from '@/lib/auth-utils'

export async function getDashboardData() {
    const user = await requireUser()
    const today = format(new Date(), 'yyyy-MM-dd')

    // 1. Get current (active) program
    let program;
    try {
        console.log(`[getDashboardData] Looking for active program for user: ${user.id}`)
        const programs = await db
            .select()
            .from(schema.roadmapPrograms)
            .where(and(
                eq(schema.roadmapPrograms.isActive, true),
                eq(schema.roadmapPrograms.userId, user.id)
            ))
            .limit(1)
        program = programs[0]

        if (program) {
            console.log(`[getDashboardData] Found active program: ${program.title} (${program.id})`)
        }
    } catch (e: any) {
        console.error('[getDashboardData] Database query failed:', {
            message: e.message,
            code: e.code,
            detail: e.detail,
            hint: e.hint
        })
        throw e
    }

    if (!program) {
        console.log(`[getDashboardData] No active program found. Looking for most recent...`)
        const fallbackPrograms = await db
            .select()
            .from(schema.roadmapPrograms)
            .where(eq(schema.roadmapPrograms.userId, user.id))
            .orderBy(desc(schema.roadmapPrograms.createdAt))
            .limit(1)

        program = fallbackPrograms[0]

        if (program) {
            console.log(`[getDashboardData] Found fallback program: ${program.title} (${program.id})`)
        } else {
            console.warn(`[getDashboardData] No programs found at all for user: ${user.id}`)
        }
    }

    if (!program) {
        return { hasProgram: false }
    }

    // Parallelize independent queries
    const [dailyProgressArr, disciplineArr, streak, fetchedMilestones] = await Promise.all([
        db.select().from(schema.dailyProgress).where(and(
            eq(schema.dailyProgress.date, today),
            eq(schema.dailyProgress.userId, user.id)
        )).limit(1),
        db.select().from(schema.disciplineScores).where(and(
            eq(schema.disciplineScores.date, today),
            eq(schema.disciplineScores.userId, user.id)
        )).limit(1),
        calculateCurrentStreak(user.id),
        db.select().from(schema.milestones).where(eq(schema.milestones.userId, user.id)).orderBy(schema.milestones.criteriaType, schema.milestones.criteriaValue)
    ])

    let allMilestones = fetchedMilestones
    if (allMilestones.length === 0) {
        const { initializeUserMilestones } = await import('@/lib/actions/milestones')
        await initializeUserMilestones()
        allMilestones = await db.select().from(schema.milestones).where(eq(schema.milestones.userId, user.id)).orderBy(schema.milestones.criteriaType, schema.milestones.criteriaValue)
    }

    const dailyProgress = dailyProgressArr[0]
    const discipline = disciplineArr[0]

    // 4. Get active day (correctly scoped to program)
    const start = new Date(program.startDate)
    const diffDays = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 3600 * 24))
    const currentDayNum = Math.min(Math.max(diffDays + 1, 1), 60)

    const [currentDay] = await db
        .select({
            id: schema.roadmapDays.id,
            title: schema.roadmapDays.title,
            focus: schema.roadmapDays.focus,
            dayNumber: schema.roadmapDays.dayNumber
        })
        .from(schema.roadmapDays)
        .innerJoin(schema.roadmapWeeks, eq(schema.roadmapDays.weekId, schema.roadmapWeeks.id))
        .innerJoin(schema.roadmapMonths, eq(schema.roadmapWeeks.monthId, schema.roadmapMonths.id))
        .where(and(
            eq(schema.roadmapMonths.programId, program.id),
            eq(schema.roadmapDays.dayNumber, currentDayNum.toString())
        ))
        .limit(1)

    // 5. Tasks and Content for the day
    let tasksTodo = 0
    let tasksDone = 0
    let dayTasks: any[] = []

    if (currentDay) {
        dayTasks = await db
            .select()
            .from(schema.roadmapTasks)
            .where(eq(schema.roadmapTasks.dayId, currentDay.id))
            .orderBy(schema.roadmapTasks.sortOrder)

        tasksTodo = dayTasks.length

        if (dailyProgress) {
            const completions = await db
                .select()
                .from(schema.taskCompletions)
                .where(eq(schema.taskCompletions.dailyProgressId, dailyProgress.id))

            const completionMap = new Map(completions.map((c: any) => [c.taskId, c.completed]))
            dayTasks = dayTasks.map(t => ({
                ...t,
                completed: !!completionMap.get(t.id)
            }))

            tasksDone = completions.filter((c: any) => c.completed).length
        }
    }

    const unlockedCount = allMilestones.filter((m: any) => m.achievedAt).length
    const upcomingMilestones = allMilestones.filter((m: any) => !m.achievedAt).slice(0, 5)

    return {
        hasProgram: true,
        programTitle: program.title,
        day: currentDayNum,
        totalDays: 60,
        focus: currentDay?.focus || "Relax or catch up on missed foundations.",
        dayTitle: currentDay?.title,
        disciplineScore: discipline ? parseInt(discipline.disciplineScore) : 0,
        streak,
        hoursLogged: dailyProgress ? parseFloat(dailyProgress.hoursLogged) : 0,
        hoursTarget: 8,
        tasksDone,
        tasksTotal: tasksTodo,
        tasks: dayTasks,
        message: discipline?.motivationMessage || "The forge is cold. Start a task to ignite it.",
        unlockedCount,
        totalMilestones: allMilestones.length,
        upcomingMilestones,
        isReviewDay: currentDayNum % 7 === 0
    }
}

export async function logHours(hours: number) {
    const user = await requireUser()
    const today = format(new Date(), 'yyyy-MM-dd')

    // Get active program for day reference
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

    if (!program) return { error: "No program active" }

    // Use current day logic (same as above)
    const start = new Date(program.startDate)
    const diffDays = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 3600 * 24))
    const currentDayNum = Math.min(Math.max(diffDays + 1, 1), 60)

    const [currentDay] = await db
        .select()
        .from(schema.roadmapDays)
        .where(eq(schema.roadmapDays.dayNumber, currentDayNum.toString()))
        .limit(1)

    if (!currentDay) return { error: "Day not found in roadmap" }

    // Update or Insert Daily Progress
    await db
        .insert(schema.dailyProgress)
        .values({
            dayId: currentDay.id,
            userId: user.id,
            date: today,
            hoursLogged: hours.toString(),
            status: 'in_progress'
        })
        .onConflictDoUpdate({
            target: [schema.dailyProgress.userId, schema.dailyProgress.dayId, schema.dailyProgress.date],
            set: { hoursLogged: hours.toString() }
        })

    // Re-calculate discipline score
    await calculateDailyDiscipline(today, user.id)

    return { success: true }
}

export async function getTrackerData(month: number = 1) {
    const user = await requireUser()
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

    const [monthData] = await db
        .select()
        .from(schema.roadmapMonths)
        .where(and(
            eq(schema.roadmapMonths.programId, program.id),
            eq(schema.roadmapMonths.monthNumber, month)
        ))
        .limit(1)

    if (!monthData) return { month: null, weeks: [] }

    // Fetch weeks and all days in those weeks in parallel
    const weeks = await db
        .select()
        .from(schema.roadmapWeeks)
        .where(eq(schema.roadmapWeeks.monthId, monthData.id))
        .orderBy(schema.roadmapWeeks.weekNumber)

    const weekIds = weeks.map((w: any) => w.id)
    if (weekIds.length === 0) return { month: monthData, weeks: [] }

    // Fetch days and progress in parallel
    const days = await db
        .select()
        .from(schema.roadmapDays)
        .where(inArray(schema.roadmapDays.weekId, weekIds))
        .orderBy(schema.roadmapDays.sortOrder)

    const dayIds = days.map((d: any) => d.id)
    const progress = dayIds.length > 0
        ? await db
            .select()
            .from(schema.dailyProgress)
            .where(and(
                inArray(schema.dailyProgress.dayId, dayIds),
                eq(schema.dailyProgress.userId, user.id)
            ))
        : []

    return {
        month: monthData,
        weeks: weeks.map((w: any) => ({
            ...w,
            days: days
                .filter((d: any) => d.weekId === w.id)
                .map((d: any) => ({
                    ...d,
                    isComplete: progress.some((p: any) => p.dayId === d.id && p.status === 'complete'),
                    isCurrent: false,
                }))
        }))
    }
}
