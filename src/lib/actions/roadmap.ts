'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, desc, and, sql, inArray, isNull, or, asc } from 'drizzle-orm'
import { format, addDays, parseISO, isBefore, startOfDay } from 'date-fns'
import { calculateDailyDiscipline, calculateCurrentStreak } from '@/lib/discipline'
import { requireUser } from '@/lib/auth-utils'
import { getRoadmapSchedule } from './scheduling'

export async function getDashboardData(clientDate?: string) {
    const user = await requireUser()
    const today = clientDate || format(new Date(), 'yyyy-MM-dd')

    // 1. Get current (active) program
    let program;
    try {
        console.log(`[getDashboardData] Looking for active program for user: ${user.id}`)
        const programs = await db
            .select()
            .from(schema.roadmapPrograms)
            .where(and(
                eq(schema.roadmapPrograms.isActive, true),
                eq(schema.roadmapPrograms.userId, user.id),
                isNull(schema.roadmapPrograms.deletedAt)
            ))
            .orderBy(desc(schema.roadmapPrograms.createdAt))
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
            .where(and(
                eq(schema.roadmapPrograms.userId, user.id),
                isNull(schema.roadmapPrograms.deletedAt)
            ))
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

    // 1b. Get rich metadata
    const [metadata] = await db
        .select()
        .from(schema.roadmapMetadata)
        .where(eq(schema.roadmapMetadata.programId, program.id))
        .limit(1)

    // 2. Identify the Active Roadmap Day
    // Instead of just relying on startDate + diff, find the latest day with any activity
    const [latestProgress] = await db
        .select({ dayId: schema.dailyProgress.dayId })
        .from(schema.dailyProgress)
        .innerJoin(schema.roadmapDays, eq(schema.dailyProgress.dayId, schema.roadmapDays.id))
        .innerJoin(schema.roadmapWeeks, eq(schema.roadmapDays.weekId, schema.roadmapWeeks.id))
        .leftJoin(schema.roadmapMonths, eq(schema.roadmapWeeks.monthId, schema.roadmapMonths.id))
        .leftJoin(schema.roadmapPhases, eq(schema.roadmapWeeks.phaseId, schema.roadmapPhases.id))
        .where(and(
            eq(schema.dailyProgress.userId, user.id),
            or(
                eq(schema.roadmapMonths.programId, program.id),
                eq(schema.roadmapPhases.programId, program.id)
            )
        ))
        .orderBy(desc(schema.dailyProgress.date))
        .limit(1)

    // 3. Parallelize independent queries
    const [
        dailyProgressArr,
        disciplineArr,
        streak,
        fetchedMilestones,
        totalTasksDoneArr,
        tasksDoneTodayArr,
        wallet,
        strengthsArr,
        gapsArr,
        adjustments
    ] = await Promise.all([
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
        db.select().from(schema.milestones).where(and(eq(schema.milestones.userId, user.id), sql`${schema.milestones.achievedAt} IS NOT NULL`)).orderBy(desc(schema.milestones.achievedAt)).limit(3),
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
        db.select().from(schema.rewardsWallet).where(eq(schema.rewardsWallet.userId, user.id)).limit(1).then(res => res[0]),
        db.select()
            .from(schema.resumeStrengths)
            .where(metadata ? eq(schema.resumeStrengths.metadataId, metadata.id) : sql`1=0`),
        db.select()
            .from(schema.resumeGaps)
            .where(metadata ? eq(schema.resumeGaps.metadataId, metadata.id) : sql`1=0`),
        db.select()
            .from(schema.roadmapAdjustments)
            .where(and(
                eq(schema.roadmapAdjustments.userId, user.id),
                eq(schema.roadmapAdjustments.programId, program.id)
            ))
    ])

    let allMilestones = fetchedMilestones
    if (allMilestones.length === 0) {
        const { initializeUserMilestones } = await import('@/lib/actions/milestones')
        await initializeUserMilestones()
        allMilestones = await db.select().from(schema.milestones).where(and(eq(schema.milestones.userId, user.id), sql`${schema.milestones.achievedAt} IS NOT NULL`)).orderBy(desc(schema.milestones.achievedAt)).limit(3)
    }

    // 4. Fetch the full schedule
    const { schedule, lastDate } = await getRoadmapSchedule(program.id)

    const dailyProgress = dailyProgressArr[0]
    const discipline = disciplineArr[0]
    const totalTasksDone = totalTasksDoneArr[0]?.count ?? 0
    const tasksDoneToday = tasksDoneTodayArr[0]?.count ?? 0
    const strengths = strengthsArr || []
    const gaps = gapsArr || []

    // 4. Get active day details
    const [completedDaysRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.dailyProgress)
        .where(and(
            eq(schema.dailyProgress.userId, user.id),
            eq(schema.dailyProgress.status, 'complete')
        ))

    const completedDaysCount = completedDaysRes?.count ?? 0

    // Fetch program days for mapping
    const daysMeta = await db
        .select({ id: schema.roadmapDays.id, dayNumber: schema.roadmapDays.dayNumber })
        .from(schema.roadmapDays)
        .innerJoin(schema.roadmapWeeks, eq(schema.roadmapDays.weekId, schema.roadmapWeeks.id))
        .leftJoin(schema.roadmapMonths, eq(schema.roadmapWeeks.monthId, schema.roadmapMonths.id))
        .leftJoin(schema.roadmapPhases, eq(schema.roadmapWeeks.phaseId, schema.roadmapPhases.id))
        .where(or(
            eq(schema.roadmapMonths.programId, program.id),
            eq(schema.roadmapPhases.programId, program.id)
        ))

    // Linear Logic: The active day is the FIRST day that is NOT complete
    const userProgress = await db
        .select({
            dayId: schema.dailyProgress.dayId,
            status: schema.dailyProgress.status,
            date: schema.dailyProgress.date
        })
        .from(schema.dailyProgress)
        .where(eq(schema.dailyProgress.userId, user.id))

    const statusMap = new Map(userProgress.map(p => [p.dayId, p.status]))

    // Sort daysMeta numerically
    const sortedDays = [...daysMeta].sort((a, b) => parseInt(a.dayNumber) - parseInt(b.dayNumber))

    const firstIncomplete = sortedDays.find(d => statusMap.get(d.id) !== 'complete')

    // activeDayNum is for logic, calendarDayNum is for display context
    // The user wants to see "Day 1" even if it's the 26th
    let calendarDayNum = firstIncomplete ? parseInt(firstIncomplete.dayNumber) : sortedDays.length

    // Verify if today has an override (e.g. they explicitly worked on something else)
    const todayProgress = userProgress.find(p => (p as any).date === today) // Note: date field check
    // Actually, we'll stick to the first incomplete for the primary "Active Card"

    // Estimate Completion Date
    const estimatedCompletionDate = lastDate ? parseISO(lastDate) : null

    // Use latestProgress.dayId if available to track "active" context
    const [currentDay] = await db
        .select({
            id: schema.roadmapDays.id,
            title: schema.roadmapDays.title,
            focus: schema.roadmapDays.focus,
            dayNumber: schema.roadmapDays.dayNumber,
            weekTitle: schema.roadmapWeeks.title,
            weekId: schema.roadmapWeeks.id,
            monthTitle: schema.roadmapMonths.title,
            phaseTitle: schema.roadmapPhases.title
        })
        .from(schema.roadmapDays)
        .innerJoin(schema.roadmapWeeks, eq(schema.roadmapDays.weekId, schema.roadmapWeeks.id))
        .leftJoin(schema.roadmapMonths, eq(schema.roadmapWeeks.monthId, schema.roadmapMonths.id))
        .leftJoin(schema.roadmapPhases, eq(schema.roadmapWeeks.phaseId, schema.roadmapPhases.id))
        .where(
            latestProgress?.dayId
                ? eq(schema.roadmapDays.id, latestProgress.dayId)
                : and(
                    eq(schema.roadmapDays.dayNumber, calendarDayNum.toString()),
                    or(
                        eq(schema.roadmapMonths.programId, program.id),
                        eq(schema.roadmapPhases.programId, program.id)
                    )
                )
        )
        .orderBy(asc(sql`CAST(${schema.roadmapDays.dayNumber} AS INTEGER)`))
        .limit(1)

    const activeDayNum = currentDay ? parseInt(currentDay.dayNumber) : calendarDayNum

    // Check if the scheduled date for this active day is in the past
    const scheduledDates = currentDay ? schedule[currentDay.id] : []
    const scheduledDate = scheduledDates && scheduledDates.length > 0 ? scheduledDates[0] : null
    const isPastDue = scheduledDate ? isBefore(parseISO(scheduledDate), startOfDay(parseISO(today))) : false

    // 5. Tasks for the Active Day
    let activeDayTasks: any[] = []
    let activeDayTasksTodo = 0
    let activeDayProgressId = null

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
            activeDayProgressId = activeDayProgress.id
            const completions = await db
                .select()
                .from(schema.taskCompletions)
                .where(eq(schema.taskCompletions.dailyProgressId, activeDayProgress.id))

            const completionMap = new Map(completions.map((c: any) => [c.taskId, c.completed]))
            activeDayTasks = activeDayTasks.map(t => ({
                ...t,
                completed: !!completionMap.get(t.id)
            }))
        }
    }

    // 5b. LeetCode Problems for the Active Day
    let leetcodeProblems: any[] = []
    if (currentDay) {
        leetcodeProblems = await db
            .select()
            .from(schema.leetcodeProblems)
            .where(eq(schema.leetcodeProblems.dayId, currentDay.id))
            .orderBy(schema.leetcodeProblems.sortOrder)
    }

    // 5c. Week Info
    const weekInfo = currentDay ? await db.select().from(schema.roadmapWeeks).where(eq(schema.roadmapWeeks.id, currentDay.weekId)).limit(1).then(res => res[0]) : null

    const nextMilestone = allMilestones.find((m: any) => !m.achievedAt)
    const unlockedCount = allMilestones.filter((m: any) => m.achievedAt).length
    const upcomingMilestones = allMilestones.filter((m: any) => !m.achievedAt).slice(0, 5)

    return {
        hasProgram: true,
        programId: program.id,
        programTitle: program.title,
        day: activeDayNum,
        totalDays: program.totalDays || 60,
        currentPhase: currentDay?.phaseTitle || currentDay?.monthTitle || "Phase 1",
        currentWeek: currentDay?.weekTitle || "Week 1",
        focus: currentDay?.focus || "Maintain trajectory. Finalize previous mandates.",
        dayTitle: currentDay?.title,
        disciplineScore: discipline ? parseInt(discipline.disciplineScore) : 0,
        streak,
        hoursLogged: dailyProgress ? parseFloat(dailyProgress.hoursLogged) : 0,
        hoursTarget: metadata?.dailyCommitment ? (parseInt(metadata.dailyCommitment) || 8) : 8,
        tasksDone: tasksDoneToday, // For "Live" feel, show what was done TODAY
        tasksTotal: activeDayTasksTodo,
        totalTasksDone, // NEW: Lifetime stat
        coinsBalance: wallet?.coinsBalance ?? 0,
        tasks: activeDayTasks,
        leetcodeProblems,
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
        metadata: {
            ...metadata,
            strengths,
            gaps
        },
        weekInfo,
        ...behavioralDiagnostics(wallet?.coinsBalance ?? 0, activeDayTasks),
        activeTimer: await getActiveTimer(user.id),
        estimatedCompletionDate,
        activeDayProgressId,
        schedule,
        isPastDue,
        scheduledDate,
        adjustments
    }
}

async function getActiveTimer(userId: string) {
    // Look for any running or paused timers for this user
    const [taskTimer] = await db
        .select({
            id: schema.roadmapTasks.id,
            title: schema.roadmapTasks.title,
            status: schema.taskCompletions.timerStatus,
            dayNumber: schema.roadmapDays.dayNumber,
            type: sql<string>`'task'`
        })
        .from(schema.taskCompletions)
        .innerJoin(schema.roadmapTasks, eq(schema.taskCompletions.taskId, schema.roadmapTasks.id))
        .innerJoin(schema.roadmapDays, eq(schema.roadmapTasks.dayId, schema.roadmapDays.id))
        .innerJoin(schema.dailyProgress, eq(schema.taskCompletions.dailyProgressId, schema.dailyProgress.id))
        .where(and(
            eq(schema.dailyProgress.userId, userId),
            inArray(schema.taskCompletions.timerStatus, ['running', 'paused'])
        ))
        .limit(1)

    if (taskTimer) return taskTimer

    const [topicTimer] = await db
        .select({
            id: schema.roadmapTopics.id,
            title: schema.roadmapTopics.title,
            status: schema.topicCompletions.timerStatus,
            dayNumber: schema.roadmapDays.dayNumber,
            type: sql<string>`'topic'`
        })
        .from(schema.topicCompletions)
        .innerJoin(schema.roadmapTopics, eq(schema.topicCompletions.topicId, schema.roadmapTopics.id))
        .innerJoin(schema.roadmapDays, eq(schema.roadmapTopics.dayId, schema.roadmapDays.id))
        .innerJoin(schema.dailyProgress, eq(schema.topicCompletions.dailyProgressId, schema.dailyProgress.id))
        .where(and(
            eq(schema.dailyProgress.userId, userId),
            inArray(schema.topicCompletions.timerStatus, ['running', 'paused'])
        ))
        .limit(1)

    return topicTimer || null
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
            eq(schema.roadmapPrograms.userId, user.id),
            isNull(schema.roadmapPrograms.deletedAt)
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

export async function getTrackerData(month: number = 1, clientDate?: string) {
    const user = await requireUser()
    const todayStr = clientDate || format(new Date(), 'yyyy-MM-dd')
    let [program] = await db
        .select()
        .from(schema.roadmapPrograms)
        .where(and(
            eq(schema.roadmapPrograms.isActive, true),
            eq(schema.roadmapPrograms.userId, user.id),
            isNull(schema.roadmapPrograms.deletedAt)
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

    // Determine if it's month-based or phase-based
    const roadmapMonths = await db.select().from(schema.roadmapMonths).where(eq(schema.roadmapMonths.programId, program.id)).orderBy(schema.roadmapMonths.monthNumber)
    const roadmapPhases = await db.select().from(schema.roadmapPhases).where(eq(schema.roadmapPhases.programId, program.id)).orderBy(schema.roadmapPhases.phaseNumber)

    // month param can be treated as monthNumber or phaseNumber
    let containerData;
    let weeks;

    if (roadmapMonths.length > 0) {
        [containerData] = await db
            .select()
            .from(schema.roadmapMonths)
            .where(and(
                eq(schema.roadmapMonths.programId, program.id),
                eq(schema.roadmapMonths.monthNumber, month)
            ))
            .limit(1)

        if (containerData) {
            weeks = await db
                .select()
                .from(schema.roadmapWeeks)
                .where(eq(schema.roadmapWeeks.monthId, containerData.id))
                .orderBy(schema.roadmapWeeks.weekNumber)
        }
    } else if (roadmapPhases.length > 0) {
        // Map month 1 -> Phase 1 & 2, month 2 -> Phase 3 & 4 (optional logic)
        // Or just let 'month' param be phase directly if it's a phase view
        // For simplicity, let's just fetch all phases and filter by phaseNumber
        [containerData] = await db
            .select()
            .from(schema.roadmapPhases)
            .where(and(
                eq(schema.roadmapPhases.programId, program.id),
                eq(schema.roadmapPhases.phaseNumber, month)
            ))
            .limit(1)

        if (containerData) {
            weeks = await db
                .select()
                .from(schema.roadmapWeeks)
                .where(eq(schema.roadmapWeeks.phaseId, containerData.id))
                .orderBy(schema.roadmapWeeks.weekNumber)
        }
    }

    if (!containerData || !weeks) return { month: null, weeks: [] }

    const weekIds = weeks.map((w: any) => w.id)
    if (weekIds.length === 0) return { month: containerData, weeks: [] }

    // Fetch days and progress in parallel
    const days = await db
        .select()
        .from(schema.roadmapDays)
        .where(inArray(schema.roadmapDays.weekId, weekIds))
        .orderBy(asc(sql`CAST(${schema.roadmapDays.dayNumber} AS INTEGER)`))

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

    const { schedule, lastDate } = await getRoadmapSchedule(program.id)
    const estimatedCompletionDate = lastDate ? parseISO(lastDate) : null

    // Determine currentDayNum from schedule
    // Linear Logic: currentDayNum is the first day that is NOT complete
    const statusMap = new Map((progress as any[]).map(p => [p.dayId, p.status]))
    const sortedTrackerDays = [...days].sort((a, b) => parseInt(a.dayNumber) - parseInt(b.dayNumber))
    const firstIncompleteTracker = sortedTrackerDays.find(d => statusMap.get(d.id) !== 'complete')

    const currentDayNum = firstIncompleteTracker ? parseInt(firstIncompleteTracker.dayNumber) : sortedTrackerDays.length

    return {
        month: containerData,
        containerType: roadmapMonths.length > 0 ? 'Month' : 'Phase',
        containers: roadmapMonths.length > 0 ? roadmapMonths : roadmapPhases,
        currentDayNum,
        estimatedCompletionDate,
        schedule,
        weeks: weeks.map((w: any) => ({
            ...w,
            days: days
                .filter((d: any) => d.weekId === w.id)
                .map((d: any) => {
                    const dayNum = parseInt(d.dayNumber) || 0
                    const isComplete = progress.some((p: any) => p.dayId === d.id && p.status === 'complete')
                    const isCurrent = dayNum === currentDayNum
                    // A day is "past" if its number is behind the current day AND it's not complete (missed)
                    const isPast = dayNum < currentDayNum && !isComplete
                    const isFuture = dayNum > currentDayNum
                    return {
                        ...d,
                        isComplete,
                        completionRate: (() => {
                            const dayProg = progress.find((p: any) => p.dayId === d.id)
                            if (!dayProg) return 0
                            return dayProg.status === 'complete' ? 100 : 50
                        })(),
                        isCurrent,
                        isPast,
                        isFuture,
                    }
                })
        }))
    }
}
