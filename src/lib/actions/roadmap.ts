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

    // 2. Identify the Active Roadmap Day
    // Instead of just relying on startDate + diff, find the latest day with any activity
    const [latestProgress] = await db
        .select({ dayId: schema.dailyProgress.dayId })
        .from(schema.dailyProgress)
        .where(eq(schema.dailyProgress.userId, user.id))
        .orderBy(desc(schema.dailyProgress.date))
        .limit(1)

    // 3. Parallelize independent queries
    const [dailyProgressArr, disciplineArr, streak, fetchedMilestones, totalTasksDoneArr, tasksDoneTodayArr, wallet] = await Promise.all([
        db.select()
            .from(schema.dailyProgress)
            .where(and(
                eq(schema.dailyProgress.date, today),
                eq(schema.dailyProgress.userId, user.id)
            )).limit(1),
        db.select()
            .from(schema.disciplineScores)
            .where(and(
                eq(schema.disciplineScores.date, today),
                eq(schema.disciplineScores.userId, user.id)
            )).limit(1),
        calculateCurrentStreak(user.id),
        db.select().from(schema.milestones).where(eq(schema.milestones.userId, user.id)).orderBy(schema.milestones.criteriaType, schema.milestones.criteriaValue),
        db.select({ count: sql<number>`count(*)::int` })
            .from(schema.taskCompletions)
            .innerJoin(schema.dailyProgress, eq(schema.taskCompletions.dailyProgressId, schema.dailyProgress.id))
            .where(and(
                eq(schema.dailyProgress.userId, user.id),
                eq(schema.taskCompletions.completed, true)
            )),
        db.select({ count: sql<number>`count(*)::int` })
            .from(schema.taskCompletions)
            .innerJoin(schema.dailyProgress, eq(schema.taskCompletions.dailyProgressId, schema.dailyProgress.id))
            .where(and(
                eq(schema.dailyProgress.userId, user.id),
                eq(schema.taskCompletions.completed, true),
                sql`date(${schema.taskCompletions.completedAt}) = ${today}`
            )),
        db.select().from(schema.rewardsWallet).where(eq(schema.rewardsWallet.userId, user.id)).limit(1).then(res => res[0])
    ])

    let allMilestones = fetchedMilestones
    if (allMilestones.length === 0) {
        const { initializeUserMilestones } = await import('@/lib/actions/milestones')
        await initializeUserMilestones()
        allMilestones = await db.select().from(schema.milestones).where(eq(schema.milestones.userId, user.id)).orderBy(schema.milestones.criteriaType, schema.milestones.criteriaValue)
    }

    const dailyProgress = dailyProgressArr[0]
    const discipline = disciplineArr[0]
    const totalTasksDone = totalTasksDoneArr[0]?.count ?? 0
    const tasksDoneToday = tasksDoneTodayArr[0]?.count ?? 0

    // 4. Get active day details
    const start = new Date(program.startDate)
    const diffDays = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 3600 * 24))
    const calendarDayNum = Math.min(Math.max(diffDays + 1, 1), 60)

    // Use latestProgress.dayId if available to track "active" context
    const [currentDay] = await db
        .select({
            id: schema.roadmapDays.id,
            title: schema.roadmapDays.title,
            focus: schema.roadmapDays.focus,
            dayNumber: schema.roadmapDays.dayNumber
        })
        .from(schema.roadmapDays)
        .where(
            latestProgress?.dayId
                ? eq(schema.roadmapDays.id, latestProgress.dayId)
                : and(
                    eq(schema.roadmapDays.dayNumber, calendarDayNum.toString()),
                    // Need to join to ensure correct program if multiple exist
                    sql`${schema.roadmapDays.weekId} IN (
                        SELECT w.id FROM roadmap_weeks w 
                        JOIN roadmap_months m ON w.month_id = m.id 
                        WHERE m.program_id = ${program.id}
                    )`
                )
        )
        .limit(1)

    const activeDayNum = currentDay ? parseInt(currentDay.dayNumber) : calendarDayNum

    // 5. Tasks for the Active Day
    let activeDayTasks: any[] = []
    let activeDayTasksTodo = 0
    let activeDayTasksDone = 0

    if (currentDay) {
        activeDayTasks = await db
            .select()
            .from(schema.roadmapTasks)
            .where(eq(schema.roadmapTasks.dayId, currentDay.id))
            .orderBy(schema.roadmapTasks.sortOrder)

        activeDayTasksTodo = activeDayTasks.length

        // Fetch completion for THIS specific active day (even if it wasn't today)
        const [activeDayProgress] = await db
            .select({ id: schema.dailyProgress.id })
            .from(schema.dailyProgress)
            .where(and(
                eq(schema.dailyProgress.dayId, currentDay.id),
                eq(schema.dailyProgress.userId, user.id)
            ))
            .limit(1)

        if (activeDayProgress) {
            const completions = await db
                .select()
                .from(schema.taskCompletions)
                .where(eq(schema.taskCompletions.dailyProgressId, activeDayProgress.id))

            const completionMap = new Map(completions.map((c: any) => [c.taskId, c.completed]))
            activeDayTasks = activeDayTasks.map(t => ({
                ...t,
                completed: !!completionMap.get(t.id)
            }))

            activeDayTasksDone = completions.filter((c: any) => c.completed).length
        }
    }

    const nextMilestone = allMilestones.find((m: any) => !m.achievedAt)
    const unlockedCount = allMilestones.filter((m: any) => m.achievedAt).length
    const upcomingMilestones = allMilestones.filter((m: any) => !m.achievedAt).slice(0, 5)

    return {
        hasProgram: true,
        programTitle: program.title,
        day: activeDayNum,
        totalDays: 60,
        focus: currentDay?.focus || "Maintain trajectory. Finalize previous mandates.",
        dayTitle: currentDay?.title,
        disciplineScore: discipline ? parseInt(discipline.disciplineScore) : 0,
        streak,
        hoursLogged: dailyProgress ? parseFloat(dailyProgress.hoursLogged) : 0,
        hoursTarget: 8,
        tasksDone: tasksDoneToday, // For "Live" feel, show what was done TODAY
        tasksTotal: activeDayTasksTodo,
        totalTasksDone, // NEW: Lifetime stat
        coinsBalance: wallet?.coinsBalance ?? 0,
        tasks: activeDayTasks,
        message: discipline?.motivationMessage || "The forge is cold. Start a task to ignite it.",
        unlockedCount,
        totalMilestones: allMilestones.length,
        upcomingMilestones,
        nextMilestone: nextMilestone ? {
            title: nextMilestone.title,
            reward: nextMilestone.reward,
            icon: nextMilestone.icon,
            criteriaType: nextMilestone.criteriaType,
            criteriaValue: nextMilestone.criteriaValue
        } : null,
        isReviewDay: activeDayNum % 7 === 0,
        ...behavioralDiagnostics(wallet?.coinsBalance ?? 0, activeDayTasks)
    }
}

function behavioralDiagnostics(coins: number, tasks: any[]) {
    // Check if it's late and nothing started
    const currentHour = new Date().getHours()
    // For demo purposes, we can lower the hour or just check if any tasks are done
    const tasksDoneCount = tasks.filter(t => t.completed).length
    const isLateStart = currentHour >= 11 && tasksDoneCount === 0

    let recommendedAction: 'QuickWin' | 'DeepWork' | 'Momentum' = 'DeepWork'
    let shortDiagnostic = "System nominal. Optimal window for Deep Work."
    let topTask = tasks.find(t => !t.completed)?.title || "Review Core Logic"

    if (isLateStart) {
        recommendedAction = 'Momentum'
        shortDiagnostic = "Inertia detected. Initializing 2-minute 'starter' sequence to bypass resistance."
        const easyTask = tasks.find(t => !t.completed && t.taskType === 'study') || tasks.find(t => !t.completed)
        if (easyTask) topTask = `Starter: ${easyTask.title} (Just 2 mins)`
    } else if (tasksDoneCount > 0 && tasksDoneCount < tasks.length / 2) {
        recommendedAction = 'QuickWin'
        shortDiagnostic = "Momentum is building. Tackle a tactical win to secure the streak."
    }

    return {
        recommendedAction,
        shortDiagnostic,
        isLateStart,
        topTask
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
