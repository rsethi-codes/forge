'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, desc, not, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { requireUser } from '../auth-utils'

export async function listRoadmaps() {
    const user = await requireUser()
    return await db
        .select()
        .from(schema.roadmapPrograms)
        .where(eq(schema.roadmapPrograms.userId, user.id))
        .orderBy(desc(schema.roadmapPrograms.createdAt))
}

export async function setActiveRoadmap(id: string) {
    const user = await requireUser()
    return await db.transaction(async (tx: any) => {
        // Set all to false for THIS user
        await tx.update(schema.roadmapPrograms)
            .set({ isActive: false })
            .where(eq(schema.roadmapPrograms.userId, user.id))

        // Set target to true for THIS user
        await tx.update(schema.roadmapPrograms)
            .set({ isActive: true })
            .where(and(
                eq(schema.roadmapPrograms.id, id),
                eq(schema.roadmapPrograms.userId, user.id)
            ))

        revalidatePath('/')
        revalidatePath('/dashboard')
        revalidatePath('/tracker')
        revalidatePath('/setup')
        return { success: true }
    })
}

export async function deleteRoadmap(id: string) {
    const user = await requireUser()

    // Cascading delete should handle sub-items if set up in SQL, 
    // but Drizzle sometimes needs explicit deletes or cascading relations.
    // Fixed: Only delete for current user
    await db.delete(schema.roadmapPrograms)
        .where(and(
            eq(schema.roadmapPrograms.id, id),
            eq(schema.roadmapPrograms.userId, user.id)
        ))

    revalidatePath('/')
    revalidatePath('/dashboard')
    revalidatePath('/tracker')
    revalidatePath('/setup')
    return { success: true }
}

export async function updateRoadmapTitle(id: string, title: string) {
    const user = await requireUser()
    await db.update(schema.roadmapPrograms)
        .set({ title })
        .where(and(
            eq(schema.roadmapPrograms.id, id),
            eq(schema.roadmapPrograms.userId, user.id)
        ))

    revalidatePath('/setup')
    return { success: true }
}
