
'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, and, asc, gte, sql, or, desc } from 'drizzle-orm'
import { requireUser } from '../auth-utils'
import { revalidatePath } from 'next/cache'
import { addDays, format, parseISO, differenceInDays } from 'date-fns'

export async function getRoadmapSchedule(programId: string, userId?: string) {
    const effectiveUserId = userId || (await requireUser()).id

    // 1. Get the program
    const [program] = await db
        .select()
        .from(schema.roadmapPrograms)
        .where(eq(schema.roadmapPrograms.id, programId))
        .limit(1)

    if (!program) throw new Error('Program not found')

    // 2. Get all adjustments
    const adjustments = await db
        .select()
        .from(schema.roadmapAdjustments)
        .where(eq(schema.roadmapAdjustments.programId, programId))
        .orderBy(asc(schema.roadmapAdjustments.date))

    // 3. Get all days
    const days = await db
        .select({
            id: schema.roadmapDays.id,
            dayNumber: schema.roadmapDays.dayNumber,
        })
        .from(schema.roadmapDays)
        .leftJoin(schema.roadmapWeeks, eq(schema.roadmapDays.weekId, schema.roadmapWeeks.id))
        .leftJoin(schema.roadmapMonths, eq(schema.roadmapWeeks.monthId, schema.roadmapMonths.id))
        .leftJoin(schema.roadmapPhases, eq(schema.roadmapWeeks.phaseId, schema.roadmapPhases.id))
        .where(or(
            eq(schema.roadmapMonths.programId, programId),
            eq(schema.roadmapPhases.programId, programId)
        ))
        .orderBy(asc(sql`CAST(${schema.roadmapDays.dayNumber} AS INTEGER)`))

    const startDate = parseISO(program.startDate)
    const schedule: Record<string, string[]> = {} // dayId -> [dates]
    let lastDate = program.startDate

    // Complex logic: A day can have multiple dates
    // Basic schedule: 1 day per date
    let currentShift = 0
    const dayOffDates = adjustments
        .filter(a => a.adjustmentType === 'day_off')
        .map(a => a.date)

    days.forEach((day, index) => {
        let targetDate = addDays(startDate, index + currentShift)

        // If this date is a day off, we shift
        while (dayOffDates.includes(format(targetDate, 'yyyy-MM-dd'))) {
            currentShift++
            targetDate = addDays(startDate, index + currentShift)
        }

        schedule[day.id] = [format(targetDate, 'yyyy-MM-dd')]
        if (index === days.length - 1) {
            lastDate = format(targetDate, 'yyyy-MM-dd')
        }
    })

    return { schedule, lastDate }
}

export async function setDayOff(programId: string, date: string, isDayOff: boolean, reason?: string, userId?: string) {
    const effectiveUserId = userId || (await requireUser()).id

    if (isDayOff) {
        let aiAnalysis = null

        if (reason) {
            try {
                // Fetch recent adjustments for frequency analysis
                const prevAdjustments = await db
                    .select()
                    .from(schema.roadmapAdjustments)
                    .where(eq(schema.roadmapAdjustments.userId, effectiveUserId))
                    .orderBy(desc(schema.roadmapAdjustments.createdAt))
                    .limit(10)

                const frequency = prevAdjustments.length

                const { generateText } = await import('ai')
                const { groq } = await import('@ai-sdk/groq')

                const { text } = await generateText({
                    model: groq('llama-3.3-70b-versatile'),
                    system: `You are Forge Discipline AI. Analyze the user's reason for a day off. 
                    User has taken ${frequency} breaks recently.
                    If the reason feels fake or repetitive, provide a "Discipline Reminder" (one sentence, soft but firm).
                    If the reason is legitimate (illness, emergency), be supportive but remind them of the roadmap goal.
                    Return ONLY the analysis/reminder text.`,
                    prompt: `User reason: "${reason}"`
                })
                aiAnalysis = text
            } catch (error) {
                console.error('AI Analysis failed:', error)
            }
        }

        await db.insert(schema.roadmapAdjustments)
            .values({
                userId: effectiveUserId,
                programId,
                date,
                adjustmentType: 'day_off',
                reason,
                aiAnalysis
            })
            .onConflictDoUpdate({
                target: [schema.roadmapAdjustments.userId, schema.roadmapAdjustments.date],
                set: { reason, aiAnalysis }
            })
    } else {
        await db.delete(schema.roadmapAdjustments)
            .where(and(
                eq(schema.roadmapAdjustments.userId, effectiveUserId),
                eq(schema.roadmapAdjustments.programId, programId),
                eq(schema.roadmapAdjustments.date, date)
            ))
    }

    revalidatePath('/dashboard')
    revalidatePath('/tracker')
    return { success: true }
}

export async function getTodaysScheduleStatus() {
    const user = await requireUser()
    const todayStr = format(new Date(), 'yyyy-MM-dd')

    // Check if today is marked as day off
    const [adjustment] = await db
        .select()
        .from(schema.roadmapAdjustments)
        .where(and(
            eq(schema.roadmapAdjustments.userId, user.id),
            eq(schema.roadmapAdjustments.date, todayStr)
        ))
        .limit(1)

    return {
        isDayOff: !!adjustment && adjustment.adjustmentType === 'day_off',
        date: todayStr
    }
}
