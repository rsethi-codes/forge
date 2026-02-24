'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, desc, isNotNull, sql, count, and } from 'drizzle-orm'
import { isAdmin } from '@/lib/auth-utils'

export async function getGlobalAnalytics() {
    if (!(await isAdmin())) throw new Error('Unauthorized Access Protocol Engaged.')

    const [userCount, programCount, totalSessions, totalCoins] = await Promise.all([
        db.select({ count: count() }).from(schema.profiles),
        db.select({ count: count() }).from(schema.roadmapPrograms),
        db.select({ count: count() }).from(schema.timeSessions),
        db.select({ sum: sql<number>`sum(coins_balance)::int` }).from(schema.rewardsWallet),
    ])

    const recentUsers = await db
        .select()
        .from(schema.profiles)
        .orderBy(desc(schema.profiles.updatedAt))
        .limit(10)

    const deletionStats = await db
        .select({ count: count() })
        .from(schema.roadmapPrograms)
        .where(isNotNull(schema.roadmapPrograms.deletedAt))

    return {
        stats: {
            users: userCount[0].count,
            programs: programCount[0].count,
            sessions: totalSessions[0].count,
            vaultBalance: totalCoins[0].sum || 0,
            deletedPrograms: deletionStats[0].count
        },
        recentUsers
    }
}

export async function getUserManagementData(userId: string) {
    if (!(await isAdmin())) throw new Error('Unauthorized.')

    const userProfile = await db.query.profiles.findFirst({
        where: eq(schema.profiles.id, userId)
    })

    const roadmaps = await db
        .select()
        .from(schema.roadmapPrograms)
        .where(eq(schema.roadmapPrograms.userId, userId))
        .orderBy(desc(schema.roadmapPrograms.createdAt))

    return {
        profile: userProfile,
        roadmaps
    }
}

export async function restoreRoadmap(id: string) {
    if (!(await isAdmin())) throw new Error('Unauthorized.')

    await db.update(schema.roadmapPrograms)
        .set({ deletedAt: null })
        .where(eq(schema.roadmapPrograms.id, id))

    return { success: true }
}

export async function getAllUsers() {
    if (!(await isAdmin())) throw new Error('Unauthorized.')
    return await db.select().from(schema.profiles).orderBy(desc(schema.profiles.updatedAt))
}

export async function getSecurityOverview() {
    if (!(await isAdmin())) throw new Error('Unauthorized.')

    const required = {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        DATABASE_URL: !!process.env.DATABASE_URL,
        ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
        ALLOWED_USER_EMAIL: !!process.env.ALLOWED_USER_EMAIL,
    }

    return {
        required,
        allowedUserEmail: process.env.ALLOWED_USER_EMAIL || null,
    }
}

export async function getSystemLogs(limit: number = 50) {
    if (!(await isAdmin())) throw new Error('Unauthorized.')

    const safeLimit = Math.min(Math.max(limit, 1), 200)

    const [appEvents, analyticsEvents, sessions] = await Promise.all([
        db.select()
            .from(schema.appEvents)
            .orderBy(desc(schema.appEvents.createdAt))
            .limit(safeLimit),
        db.select()
            .from(schema.analyticsEvents)
            .orderBy(desc(schema.analyticsEvents.timestamp))
            .limit(safeLimit),
        db.select()
            .from(schema.timeSessions)
            .orderBy(desc(schema.timeSessions.createdAt))
            .limit(Math.min(safeLimit, 50)),
    ])

    return {
        appEvents,
        analyticsEvents,
        sessions,
    }
}

export async function getDatabaseTrace() {
    if (!(await isAdmin())) throw new Error('Unauthorized.')

    const [
        users,
        programs,
        days,
        tasks,
        topics,
        progress,
        taskCompletions,
        topicCompletions,
        sessions,
        events,
        milestones,
        blogPosts,
    ] = await Promise.all([
        db.select({ count: count() }).from(schema.profiles),
        db.select({ count: count() }).from(schema.roadmapPrograms),
        db.select({ count: count() }).from(schema.roadmapDays),
        db.select({ count: count() }).from(schema.roadmapTasks),
        db.select({ count: count() }).from(schema.roadmapTopics),
        db.select({ count: count() }).from(schema.dailyProgress),
        db.select({ count: count() }).from(schema.taskCompletions),
        db.select({ count: count() }).from(schema.topicCompletions),
        db.select({ count: count() }).from(schema.timeSessions),
        db.select({ count: count() }).from(schema.appEvents),
        db.select({ count: count() }).from(schema.milestones),
        db.select({ count: count() }).from(schema.blogPosts),
    ])

    const [latestProgram] = await db
        .select({
            id: schema.roadmapPrograms.id,
            title: schema.roadmapPrograms.title,
            createdAt: schema.roadmapPrograms.createdAt,
            deletedAt: schema.roadmapPrograms.deletedAt,
        })
        .from(schema.roadmapPrograms)
        .orderBy(desc(schema.roadmapPrograms.createdAt))
        .limit(1)

    return {
        counts: {
            users: users[0].count,
            programs: programs[0].count,
            days: days[0].count,
            tasks: tasks[0].count,
            topics: topics[0].count,
            progress: progress[0].count,
            taskCompletions: taskCompletions[0].count,
            topicCompletions: topicCompletions[0].count,
            sessions: sessions[0].count,
            events: events[0].count,
            milestones: milestones[0].count,
            blogPosts: blogPosts[0].count,
        },
        latestProgram: latestProgram || null,
    }
}
