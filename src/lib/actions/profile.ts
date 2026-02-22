'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, desc, sql, gte } from 'drizzle-orm'
import { getAnalyticsData } from './analytics'

export async function getPublicProfileData() {
    // Basic program info
    const [program] = await db
        .select()
        .from(schema.roadmapPrograms)
        .limit(1)

    if (!program) return null

    // Get stats from analytics (since it's already computed)
    const stats = await getAnalyticsData()

    // Get recent blog posts
    const publicPosts = await db
        .select()
        .from(schema.blogPosts)
        .where(eq(schema.blogPosts.visibility, 'public'))
        .orderBy(desc(schema.blogPosts.publishedAt))
        .limit(3)

    // Get milestones
    const achievements = await db
        .select()
        .from(schema.milestones)
        .where(sql`${schema.milestones.achievedAt} IS NOT NULL`)
        .orderBy(desc(schema.milestones.achievedAt))

    return {
        program,
        stats,
        publicPosts,
        achievements
    }
}
