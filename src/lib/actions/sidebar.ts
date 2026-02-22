'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { desc, eq, sql } from 'drizzle-orm'

export async function getSidebarStats() {
    const [latestScore] = await db
        .select()
        .from(schema.disciplineScores)
        .orderBy(desc(schema.disciplineScores.date))
        .limit(1)

    const [currentDay] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.dailyProgress)
        .where(eq(schema.dailyProgress.status, 'complete'))

    return {
        streak: latestScore?.streakDays || 0,
        day: Number(currentDay?.count || 0) + 1 // +1 for the today
    }
}
