'use server'

import { db } from './db'
import * as schema from './supabase/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { calculateCurrentStreak } from './discipline'
import { requireUser } from './auth-utils'

export async function checkAndUnlockMilestones(userId?: string) {
    const user = userId ? { id: userId } : await requireUser()
    const targetUserId = user.id

    const unlockedNow: any[] = []

    // 1. Get all locked milestones for this user
    const locked = await db
        .select()
        .from(schema.milestones)
        .where(and(
            isNull(schema.milestones.achievedAt),
            eq(schema.milestones.userId, targetUserId)
        ))

    if (locked.length === 0) return []

    // 2. Fetch required stats for check
    const [streak, totalCompletedDays, blogsResult, scores] = await Promise.all([
        calculateCurrentStreak(targetUserId),
        db.select({ count: sql`count(*)` })
            .from(schema.dailyProgress)
            .where(and(
                eq(schema.dailyProgress.status, 'complete'),
                eq(schema.dailyProgress.userId, targetUserId)
            )),
        db.select({ count: sql<number>`count(*)::int` })
            .from(schema.blogPosts)
            .where(eq(schema.blogPosts.userId, targetUserId)),
        db.select({ maxScore: sql`max(cast(${schema.disciplineScores.disciplineScore} as float))` })
            .from(schema.disciplineScores)
            .where(eq(schema.disciplineScores.userId, targetUserId))
    ])

    const completedCount = parseInt((totalCompletedDays[0] as any).count || '0')
    const blogCount = blogsResult[0]?.count || 0
    const maxScore = parseFloat((scores[0] as any).maxScore || '0')

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
                if (maxScore >= m.criteriaValue) achieved = true
                break
            case 'blog_posts':
                if (blogCount >= m.criteriaValue) achieved = true
                break
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

export async function getAllMilestones(userId?: string) {
    const user = userId ? { id: userId } : await requireUser()
    const targetUserId = user.id

    return await db
        .select()
        .from(schema.milestones)
        .where(eq(schema.milestones.userId, targetUserId))
        .orderBy(schema.milestones.criteriaType, schema.milestones.criteriaValue)
}
