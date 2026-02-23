'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
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

        const [currentDay] = await db
            .select({ count: sql<number>`count(*)` })
            .from(schema.dailyProgress)
            .where(and(
                eq(schema.dailyProgress.status, 'complete'),
                eq(schema.dailyProgress.userId, user.id)
            ))

        return {
            streak: latestScore?.streakDays || 0,
            day: Number(currentDay?.count || 0) + 1 // +1 for today
        }
    } catch (error) {
        console.error('[getSidebarStats] Failed to fetch stats:', error)
        // Return safe defaults so the shell still renders
        return { streak: 0, day: 1 }
    }
}
