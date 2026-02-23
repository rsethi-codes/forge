'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth-utils'

const DEFAULT_MILESTONES = [
    {
        title: 'Genesis Ignite',
        description: 'Upload your first roadmap to start the forge.',
        criteriaType: 'manual',
        criteriaValue: 1,
        icon: 'Zap',
        reward: 'Access to the Exclusive "Senior Engineer" Community'
    },
    {
        title: '3-Day Flash',
        description: 'Maintain a 3-day training streak.',
        criteriaType: 'streak',
        criteriaValue: 3,
        icon: 'Flame',
        reward: 'Premium Technical Subscription (1 Month)'
    },
    {
        title: 'Weekly Warrior',
        description: 'Complete 7 days of the roadmap.',
        criteriaType: 'days_complete',
        criteriaValue: 7,
        icon: 'Shield',
        reward: 'Buy an Advanced Architecture Course ($200+ value)'
    },
    {
        title: 'Intelligence Briefing',
        description: 'Publish your first blog post.',
        criteriaType: 'blog_posts',
        criteriaValue: 1,
        icon: 'BookOpen',
        reward: 'Professional Personal Brand Audit'
    },
    {
        title: 'Fortress of Discipline',
        description: 'Reach a 10-day training streak.',
        criteriaType: 'streak',
        criteriaValue: 10,
        icon: 'Trophy',
        reward: 'High-End Mechanical Keyboard / Workstation Upgrade'
    },
    {
        title: '21 Days of Habit',
        description: 'Complete 21 cumulative days of roadmap.',
        criteriaType: 'days_complete',
        criteriaValue: 21,
        icon: 'Compass',
        reward: 'Book a 1:1 Mentorship Session with a Staff Engineer'
    },
    {
        title: 'Elite Scribe',
        description: 'Publish 5 intelligence briefings (blog posts).',
        criteriaType: 'blog_posts',
        criteriaValue: 5,
        icon: 'PenTool',
        reward: 'Featured Industry Spotlight Interview'
    },
    {
        title: 'Forge Master',
        description: 'Complete the entire 60-day protocol.',
        criteriaType: 'days_complete',
        criteriaValue: 60,
        icon: 'Crown',
        reward: 'The 30LPA Promotion Celebration Trip (Fully Funded)'
    }
]

export async function initializeUserMilestones() {
    const user = await getCurrentUser()
    if (!user) return

    // Check if user already has milestones
    const existing = await db
        .select()
        .from(schema.milestones)
        .where(eq(schema.milestones.userId, user.id))
        .limit(1)

    if (existing.length > 0) return

    // Insert default milestones
    await db.insert(schema.milestones).values(
        DEFAULT_MILESTONES.map(m => ({
            ...m,
            userId: user.id as any,
            criteriaType: m.criteriaType as any
        }))
    )
}

import { sql } from 'drizzle-orm'

export async function checkMilestones(userId: string) {
    // 1. Get user stats
    const [[streakResult], [daysResult], [blogsResult]] = await Promise.all([
        db.select({ val: schema.disciplineScores.streakDays })
            .from(schema.disciplineScores)
            .where(eq(schema.disciplineScores.userId, userId))
            .orderBy(sql`${schema.disciplineScores.date} desc`)
            .limit(1),
        db.select({ count: sql<number>`count(*)::int` })
            .from(schema.dailyProgress)
            .where(and(
                eq(schema.dailyProgress.userId, userId),
                eq(schema.dailyProgress.status, 'complete')
            )),
        db.select({ count: sql<number>`count(*)::int` })
            .from(schema.blogPosts)
            .where(eq(schema.blogPosts.userId, userId))
    ])

    const stats = {
        streak: streakResult?.val ?? 0,
        days_complete: daysResult?.count ?? 0,
        blog_posts: blogsResult?.count ?? 0
    }

    // 2. Find unachieved milestones that meet criteria
    const unachieved = await db
        .select()
        .from(schema.milestones)
        .where(and(
            eq(schema.milestones.userId, userId),
            sql`${schema.milestones.achievedAt} IS NULL`
        ))

    const newlyAchieved = []

    for (const m of unachieved) {
        let reached = false
        const type = m.criteriaType as keyof typeof stats
        if (stats[type] !== undefined) {
            reached = stats[type] >= m.criteriaValue
        }

        if (reached) {
            await db
                .update(schema.milestones)
                .set({ achievedAt: new Date() })
                .where(eq(schema.milestones.id, m.id))

            newlyAchieved.push(m)
            console.log(`[checkMilestones] Milestone achieved: ${m.title} for user ${userId}`)
        }
    }

    return newlyAchieved
}
