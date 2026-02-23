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
        icon: 'Zap'
    },
    {
        title: '3-Day Flash',
        description: 'Maintain a 3-day training streak.',
        criteriaType: 'streak',
        criteriaValue: 3,
        icon: 'Flame'
    },
    {
        title: 'Weekly Warrior',
        description: 'Complete 7 days of the roadmap.',
        criteriaType: 'days_complete',
        criteriaValue: 7,
        icon: 'Shield'
    },
    {
        title: 'Intelligence Briefing',
        description: 'Publish your first blog post.',
        criteriaType: 'blog_posts',
        criteriaValue: 1,
        icon: 'BookOpen'
    },
    {
        title: 'Fortress of Discipline',
        description: 'Reach a 10-day training streak.',
        criteriaType: 'streak',
        criteriaValue: 10,
        icon: 'Trophy'
    },
    {
        title: '21 Days of Habit',
        description: 'Complete 21 cumulative days of roadmap.',
        criteriaType: 'days_complete',
        criteriaValue: 21,
        icon: 'Compass'
    },
    {
        title: 'Elite Scribe',
        description: 'Publish 5 intelligence briefings (blog posts).',
        criteriaType: 'blog_posts',
        criteriaValue: 5,
        icon: 'PenTool'
    },
    {
        title: 'Forge Master',
        description: 'Complete the entire 60-day protocol.',
        criteriaType: 'days_complete',
        criteriaValue: 60,
        icon: 'Crown'
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

export async function checkMilestones(userId: string) {
    // This could be run after various actions to auto-achieve milestones
    // For now, it's a placeholder for logic that updates achievedAt
}
