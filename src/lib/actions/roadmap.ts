'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, desc, and, sql, inArray } from 'drizzle-orm'
import { format } from 'date-fns'
import { calculateDailyDiscipline, calculateCurrentStreak } from '@/lib/discipline'

export async function getDashboardData() {
    const today = format(new Date(), 'yyyy-MM-dd')

    // 1. Get current (active) program
    let [program] = await db
        .select()
        .from(schema.roadmapPrograms)
        .where(eq(schema.roadmapPrograms.isActive, true))
        .limit(1)

    if (!program) {
        [program] = await db
            .select()
            .from(schema.roadmapPrograms)
            .orderBy(desc(schema.roadmapPrograms.createdAt))
            .limit(1)
    }

    if (!program) {
        return { hasProgram: false }
    }

    // Parallelize independent queries
    const [dailyProgressArr, disciplineArr, streak, allMilestones] = await Promise.all([
        db.select().from(schema.dailyProgress).where(eq(schema.dailyProgress.date, today)).limit(1),
        db.select().from(schema.disciplineScores).where(eq(schema.disciplineScores.date, today)).limit(1),
        calculateCurrentStreak(),
        db.select().from(schema.milestones).orderBy(schema.milestones.criteriaType, schema.milestones.criteriaValue)
    ])

    const dailyProgress = dailyProgressArr[0]
    const discipline = disciplineArr[0]

    // 4. Get active day (first day not complete or skipped)
    const start = new Date(program.startDate)
    const diffDays = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 3600 * 24))
    const currentDayNum = Math.min(Math.max(diffDays + 1, 1), 60)

    const [currentDay] = await db
        .select()
        .from(schema.roadmapDays)
        .where(eq(schema.roadmapDays.dayNumber, currentDayNum.toString()))
        .limit(1)

    // 5. Tasks for the day
    let tasksTodo = 0
    let tasksDone = 0
    if (currentDay) {
        const tasks = await db
            .select()
            .from(schema.roadmapTasks)
            .where(eq(schema.roadmapTasks.dayId, currentDay.id))

        tasksTodo = tasks.length

        if (dailyProgress) {
            const completions = await db
                .select()
                .from(schema.taskCompletions)
                .where(eq(schema.taskCompletions.dailyProgressId, dailyProgress.id))
            tasksDone = completions.filter((c: any) => c.completed).length
        }
    }

    const unlockedCount = allMilestones.filter((m: any) => m.achievedAt).length
    const upcomingMilestones = allMilestones.filter((m: any) => !m.achievedAt).slice(0, 5)

    return {
        hasProgram: true,
        day: currentDayNum,
        totalDays: 60,
        focus: currentDay?.focus || "Relax or catch up on missed foundations.",
        disciplineScore: discipline ? parseInt(discipline.disciplineScore) : 0,
        streak,
        hoursLogged: dailyProgress ? parseFloat(dailyProgress.hoursLogged) : 0,
        hoursTarget: 8,
        tasksDone,
        tasksTotal: tasksTodo,
        message: discipline?.motivationMessage || "The forge is cold. Start a task to ignite it.",
        unlockedCount,
        totalMilestones: allMilestones.length,
        upcomingMilestones,
        isReviewDay: currentDayNum % 7 === 0
    }
}

export async function logHours(hours: number) {
    const today = format(new Date(), 'yyyy-MM-dd')

    // Get active program for day reference
    let [program] = await db
        .select()
        .from(schema.roadmapPrograms)
        .where(eq(schema.roadmapPrograms.isActive, true))
        .limit(1)

    if (!program) {
        [program] = await db
            .select()
            .from(schema.roadmapPrograms)
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
            date: today,
            hoursLogged: hours.toString(),
            status: 'in_progress'
        })
        .onConflictDoUpdate({
            target: [schema.dailyProgress.dayId, schema.dailyProgress.date],
            set: { hoursLogged: hours.toString() }
        })

    // Re-calculate discipline score
    await calculateDailyDiscipline(today)

    return { success: true }
}

export async function getTrackerData(month: number = 1) {
    let [program] = await db
        .select()
        .from(schema.roadmapPrograms)
        .where(eq(schema.roadmapPrograms.isActive, true))
        .limit(1)

    if (!program) {
        [program] = await db
            .select()
            .from(schema.roadmapPrograms)
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
            .where(inArray(schema.dailyProgress.dayId, dayIds))
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
