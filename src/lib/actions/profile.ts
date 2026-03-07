'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { requireUser } from '@/lib/auth-utils'

/** Fetch public profile data by handle */
export async function getPublicProfile(handle: string) {
    const profile = await db.query.profiles.findFirst({
        where: and(
            eq(schema.profiles.vanityHandle, handle),
            eq(schema.profiles.isPublic, true)
        )
    })

    if (!profile) return null

    // Fetch comprehensive data for the "Wow" portfolio
    const [discipline, programs, recentPosts, activityLogs, topTasks] = await Promise.all([
        db.select()
            .from(schema.disciplineScores)
            .where(eq(schema.disciplineScores.userId, profile.id))
            .orderBy(desc(schema.disciplineScores.date))
            .limit(1)
            .then(res => res[0]),
        db.select({ title: schema.roadmapPrograms.title })
            .from(schema.roadmapPrograms)
            .where(and(
                eq(schema.roadmapPrograms.userId, profile.id),
                eq(schema.roadmapPrograms.isActive, true)
            ))
            .limit(1)
            .then(res => res[0]),
        db.select()
            .from(schema.blogPosts)
            .where(and(
                eq(schema.blogPosts.userId, profile.id),
                eq(schema.blogPosts.visibility, 'public')
            ))
            .orderBy(desc(schema.blogPosts.publishedAt))
            .limit(3),
        db.select()
            .from(schema.appEvents)
            .where(and(
                eq(schema.appEvents.userId, profile.id),
                sql`${schema.appEvents.eventType} LIKE 'docs_%'`
            ))
            .orderBy(desc(schema.appEvents.createdAt))
            .limit(50),
        db.select({
            title: schema.roadmapTasks.title,
            description: schema.roadmapTasks.description,
            isCompleted: schema.taskCompletions.completed,
            type: schema.roadmapTasks.taskType,
            updatedAt: schema.taskCompletions.completedAt
        })
            .from(schema.taskCompletions)
            .innerJoin(schema.roadmapTasks, eq(schema.taskCompletions.taskId, schema.roadmapTasks.id))
            .innerJoin(schema.dailyProgress, eq(schema.taskCompletions.dailyProgressId, schema.dailyProgress.id))
            .where(and(
                eq(schema.dailyProgress.userId, profile.id),
                eq(schema.taskCompletions.completed, true)
            ))
            .orderBy(desc(schema.taskCompletions.completedAt))
            .limit(10)
    ])

    return {
        profile,
        stats: {
            streak: Number(discipline?.streakDays ?? 0),
            disciplineScore: Number(discipline?.disciplineScore ?? 0),
            activeProgram: programs?.title ?? 'The Forge candidate',
            recentActivity: activityLogs,
            recentPosts,
            topTasks: topTasks.filter(t => t.type === 'build' || t.type === 'study' || t.type === 'review')
        }
    }
}

/** Update the user's live activity for the public beacon */
export async function updateProfileActivity(userId: string, activity: { type: string, label: string, dayNumber?: string }) {
    await db.update(schema.profiles)
        .set({
            updatedAt: new Date(),
            // We'll store this in the bio or a dedicated field if we had one, 
            // but for now let's just use analytics and fetch the latest event for the public page.
        })
        .where(eq(schema.profiles.id, userId))
}
