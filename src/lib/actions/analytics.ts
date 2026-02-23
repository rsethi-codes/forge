'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, desc, sql, and, gte } from 'drizzle-orm'
import { format, subDays } from 'date-fns'
import { calculateTier } from '@/lib/discipline'
import { requireUser } from '../auth-utils'

export async function getAnalyticsData(userId?: string) {
    const user = userId ? { id: userId } : await requireUser()
    const targetUserId = user.id

    const last7Days = Array.from({ length: 7 }, (_, i) =>
        format(subDays(new Date(), i), 'yyyy-MM-dd')
    ).reverse()

    // 1. Discipline Velocity (Last 7 days)
    const disciplineScores = await db
        .select()
        .from(schema.disciplineScores)
        .where(and(
            gte(schema.disciplineScores.date, last7Days[0]),
            eq(schema.disciplineScores.userId, targetUserId)
        ))
        .orderBy(schema.disciplineScores.date)

    const disciplineTrend = last7Days.map(date => {
        const score: any = disciplineScores.find((s: any) => s.date === date)
        return {
            day: format(new Date(date), 'EEE'),
            score: score ? parseFloat(score.disciplineScore) : 0
        }
    })

    // 2. Effort Audit (Hours)
    const progressEntries = await db
        .select()
        .from(schema.dailyProgress)
        .where(and(
            gte(schema.dailyProgress.date, last7Days[0]),
            eq(schema.dailyProgress.userId, targetUserId)
        ))
        .orderBy(schema.dailyProgress.date)

    const hoursData = last7Days.map(date => {
        const p: any = progressEntries.find((entry: any) => entry.date === date)
        return {
            day: format(new Date(date), 'd'),
            hours: p ? parseFloat(p.hoursLogged) : 0
        }
    })

    // 3. Knowledge Retention (By Topic)
    const kcResults = await db
        .select({
            topic: schema.roadmapTopics.title,
            passed: schema.knowledgeCheckResults.passed
        })
        .from(schema.knowledgeCheckResults)
        .innerJoin(schema.knowledgeChecks, eq(schema.knowledgeCheckResults.knowledgeCheckId, schema.knowledgeChecks.id))
        .innerJoin(schema.roadmapTopics, eq(schema.knowledgeChecks.dayId, schema.roadmapTopics.dayId))
        .innerJoin(schema.dailyProgress, eq(schema.knowledgeCheckResults.dailyProgressId, schema.dailyProgress.id))
        .where(eq(schema.dailyProgress.userId, targetUserId))
        .limit(100)

    const topicRetention: Record<string, { total: number, passed: number }> = {}
    kcResults.forEach((r: any) => {
        if (!topicRetention[r.topic]) topicRetention[r.topic] = { total: 0, passed: 0 }
        topicRetention[r.topic].total++
        if (r.passed) topicRetention[r.topic].passed++
    })

    const kcPerformance = Object.entries(topicRetention).map(([topic, stats]) => ({
        topic: topic.split(' ')[0], // Short name
        score: Math.round((stats.passed / stats.total) * 100)
    })).slice(0, 5)

    // 4. Blog Content Metrics
    const blogPosts = await db
        .select({
            id: schema.blogPosts.id,
            title: schema.blogPosts.title,
            views: schema.blogPosts.viewCount,
            publishedAt: schema.blogPosts.publishedAt
        })
        .from(schema.blogPosts)
        .where(and(
            eq(schema.blogPosts.visibility, 'public'),
            eq(schema.blogPosts.userId, targetUserId)
        ))
        .orderBy(desc(schema.blogPosts.viewCount))
        .limit(5)

    const [blogCountRes] = await db
        .select({ count: sql`count(*)` })
        .from(schema.blogPosts)
        .where(eq(schema.blogPosts.userId, targetUserId))

    const blogCount = parseInt((blogCountRes as any).count || '0')

    // 5. Activity Heatmap (All program days)
    const allProgress = await db
        .select({
            dayNumber: schema.roadmapDays.dayNumber,
            status: schema.dailyProgress.status
        })
        .from(schema.dailyProgress)
        .innerJoin(schema.roadmapDays, eq(schema.dailyProgress.dayId, schema.roadmapDays.id))
        .where(eq(schema.dailyProgress.userId, targetUserId))
        .orderBy(schema.roadmapDays.dayNumber)

    const heatmapData = Array.from({ length: 60 }, (_, i) => {
        const dayNum = i + 1
        const p: any = allProgress.find((ap: any) => ap.dayNumber === (dayNum as any))
        return {
            day: dayNum,
            status: p?.status || 'not_started'
        }
    })

    // 6. Overall Stats
    const avgDiscipline = disciplineScores.length > 0
        ? Math.round(disciplineScores.reduce((acc: number, s: any) => acc + parseFloat(s.disciplineScore), 0) / disciplineScores.length)
        : 0

    const latestScore = disciplineScores[disciplineScores.length - 1]
    const currentTier = calculateTier(latestScore ? parseFloat(latestScore.disciplineScore) : 0)

    // 7. Tasks Distribution Metrics (Fixed Syntax)
    const taskDistribution = await db
        .select({
            type: schema.roadmapTasks.taskType,
            count: sql`count(*)`,
        })
        .from(schema.roadmapTasks)
        .groupBy(schema.roadmapTasks.taskType)

    const completedTasksList = await db
        .select({
            type: schema.roadmapTasks.taskType,
            count: sql`count(*)`,
        })
        .from(schema.taskCompletions)
        .innerJoin(schema.roadmapTasks, eq(schema.taskCompletions.taskId, schema.roadmapTasks.id))
        .where(eq(schema.taskCompletions.completed, true))
        .groupBy(schema.roadmapTasks.taskType)

    const taskStats = taskDistribution.map((td: any) => {
        const completed: any = completedTasksList.find((ct: any) => ct.type === td.type)
        return {
            type: td.type,
            total: parseInt(td.count || '0'),
            completed: parseInt(completed?.count || '0'),
            percentage: Math.round((parseInt(completed?.count || '0') / parseInt(td.count || '1')) * 100)
        }
    })

    // 8. Pomodoro Integration
    const pomodoros = await db
        .select()
        .from(schema.pomodoroSessions)
        .where(and(
            gte(schema.pomodoroSessions.startedAt, subDays(new Date(), 30)),
            eq(schema.pomodoroSessions.userId, targetUserId)
        ))
        .orderBy(desc(schema.pomodoroSessions.startedAt))

    const totalFocusMinutes = pomodoros
        .filter((p: any) => p.completed && p.type === 'work')
        .reduce((acc: number, p: any) => acc + p.durationMinutes, 0)

    // 9. Weekly Summary
    const weeklyDiscipline = Math.round(disciplineTrend.reduce((acc, d) => acc + d.score, 0) / 7)
    const weeklyHours = hoursData.reduce((acc, h) => acc + h.hours, 0)
    const weeklyFocus = kcPerformance[0]?.topic || "General Systems"

    return {
        disciplineTrend,
        hoursData,
        kcPerformance,
        avgDiscipline,
        currentTier,
        blogCount,
        streak: latestScore?.streakDays || 0,
        heatmapData,
        blogStats: blogPosts,
        taskStats,
        focusStats: {
            totalMinutes: totalFocusMinutes,
            sessionCount: pomodoros.filter((p: any) => p.completed).length,
            recentSessions: pomodoros.slice(0, 10).map((p: any) => ({
                id: p.id,
                type: p.type,
                time: format(new Date(p.startedAt), 'MMM d, HH:mm'),
                status: p.completed ? 'Success' : 'Aborted'
            }))
        },
        weeklySummary: {
            avgDiscipline: weeklyDiscipline,
            totalHours: weeklyHours,
            topTopic: weeklyFocus
        }
    }
}
