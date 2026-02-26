'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, desc, sql, gte, and } from 'drizzle-orm'
import { getAnalyticsData } from './analytics'

export async function getPublicProfile(handle: string) {
    const [profile] = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.vanityHandle, handle))
        .limit(1)

    if (!profile || !profile.isPublic) return null

    const userId = profile.id

    // 1. Get Active Roadmap Effort
    const [program] = await db
        .select()
        .from(schema.roadmapPrograms)
        .where(and(
            eq(schema.roadmapPrograms.userId, userId),
            eq(schema.roadmapPrograms.isActive, true)
        ))
        .limit(1)

    // 2. Discipline & Effort Audit
    const analytics = await getAnalyticsData(userId)

    // 3. High-Impact Writing (Public Blogs)
    const publicPosts = await db
        .select()
        .from(schema.blogPosts)
        .where(and(
            eq(schema.blogPosts.userId, userId),
            eq(schema.blogPosts.visibility, 'public')
        ))
        .orderBy(desc(schema.blogPosts.publishedAt))
        .limit(5)

    // 4. Evidence of Grind (Milestones)
    const achievements = await db
        .select()
        .from(schema.milestones)
        .where(and(
            eq(schema.milestones.userId, userId),
            sql`${schema.milestones.achievedAt} IS NOT NULL`
        ))
        .orderBy(desc(schema.milestones.achievedAt))

    return {
        profile,
        program,
        analytics,
        publicPosts,
        achievements
    }
}

export async function getPublicProfileData() {
    // Legacy support or fallback
    return getPublicProfile('default') // placeholder
}
