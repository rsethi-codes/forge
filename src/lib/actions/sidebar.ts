'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { and, desc, eq, sql, isNull, or, inArray } from 'drizzle-orm'
import { requireUser } from '../auth-utils'

export async function getSidebarStats() {
    try {
        const user = await requireUser()

        const [latestScore] = await db
            .select()
            .from(schema.disciplineScores)
            .where(eq(schema.disciplineScores.userId, user.id))
            .orderBy(desc(schema.disciplineScores.date))
            .limit(1)

        const [profile] = await db
            .select({ vanityHandle: schema.profiles.vanityHandle })
            .from(schema.profiles)
            .where(eq(schema.profiles.id, user.id))
            .limit(1)

        const [activeProgram] = await db
            .select({ id: schema.roadmapPrograms.id })
            .from(schema.roadmapPrograms)
            .where(and(
                eq(schema.roadmapPrograms.userId, user.id),
                eq(schema.roadmapPrograms.isActive, true),
                isNull(schema.roadmapPrograms.deletedAt)
            ))
            .limit(1)

        let totalDays = 60
        if (activeProgram) {
            const [daysCount] = await db
                .select({ count: sql<number>`count(*)` })
                .from(schema.roadmapDays)
                .leftJoin(schema.roadmapWeeks, eq(schema.roadmapDays.weekId, schema.roadmapWeeks.id))
                .leftJoin(schema.roadmapMonths, eq(schema.roadmapWeeks.monthId, schema.roadmapMonths.id))
                .leftJoin(schema.roadmapPhases, eq(schema.roadmapWeeks.phaseId, schema.roadmapPhases.id))
                .where(or(
                    eq(schema.roadmapMonths.programId, activeProgram.id),
                    eq(schema.roadmapPhases.programId, activeProgram.id)
                ))

            if (daysCount) totalDays = Number(daysCount.count)
        }

        const [currentDayProgress] = await db
            .select({ count: sql<number>`count(*)` })
            .from(schema.dailyProgress)
            .where(and(
                eq(schema.dailyProgress.userId, user.id),
                activeProgram ? inArray(
                    schema.dailyProgress.dayId,
                    db.select({ id: schema.roadmapDays.id })
                        .from(schema.roadmapDays)
                        .leftJoin(schema.roadmapWeeks, eq(schema.roadmapDays.weekId, schema.roadmapWeeks.id))
                        .leftJoin(schema.roadmapMonths, eq(schema.roadmapWeeks.monthId, schema.roadmapMonths.id))
                        .leftJoin(schema.roadmapPhases, eq(schema.roadmapWeeks.phaseId, schema.roadmapPhases.id))
                        .where(or(
                            eq(schema.roadmapMonths.programId, activeProgram.id),
                            eq(schema.roadmapPhases.programId, activeProgram.id)
                        ))
                ) : sql`true`
            ))

        return {
            streak: latestScore?.streakDays || 0,
            day: Math.min(Number(currentDayProgress?.count || 0) + 1, totalDays),
            totalDays,
            vanityHandle: profile?.vanityHandle
        }
    } catch (error) {
        console.error('[getSidebarStats] Failed to fetch stats:', error)
        // Return safe defaults so the shell still renders
        return { streak: 0, day: 1 }
    }
}
