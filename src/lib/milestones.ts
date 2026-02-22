'use server'

import { db } from './db'
import * as schema from './supabase/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { calculateCurrentStreak } from './discipline'

export async function checkAndUnlockMilestones() {
    const unlockedNow: any[] = []

    // 1. Get all locked milestones
    const locked = await db
        .select()
        .from(schema.milestones)
        .where(isNull(schema.milestones.achievedAt))

    if (locked.length === 0) return []

    // 2. Fetch required stats for check
    const streak = await calculateCurrentStreak()
    const [totalCompletedDays] = await db
        .select({ count: sql`count(*)` })
        .from(schema.dailyProgress)
        .where(eq(schema.dailyProgress.status, 'complete'))

    const completedCount = parseInt((totalCompletedDays as any).count || '0')

    const [scores] = await db
        .select({ maxScore: sql`max(cast(${schema.disciplineScores.disciplineScore} as float))` })
        .from(schema.disciplineScores)

    const maxScore = parseFloat((scores as any).maxScore || '0')

    // 3. Evaluate each locked milestone
    for (const m of locked) {
        let achieved = false

        switch (m.criteriaType) {
            case 'streak':
                if (streak >= m.criteriaValue) achieved = true
                break
            case 'days_complete':
                if (completedCount >= m.criteriaValue) achieved = true
                break
            case 'kc_score':
                // If we have a milestone for high discipline score
                if (maxScore >= m.criteriaValue) achieved = true
                break
            // Add more cases as needed
        }

        if (achieved) {
            await db
                .update(schema.milestones)
                .set({ achievedAt: new Date() })
                .where(eq(schema.milestones.id, m.id))

            unlockedNow.push(m)
        }
    }

    return unlockedNow
}

export async function getAllMilestones() {
    return await db
        .select()
        .from(schema.milestones)
        .orderBy(schema.milestones.criteriaType, schema.milestones.criteriaValue)
}
