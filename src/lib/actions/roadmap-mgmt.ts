'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, desc, not } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function listRoadmaps() {
    return await db
        .select()
        .from(schema.roadmapPrograms)
        .orderBy(desc(schema.roadmapPrograms.createdAt))
}

export async function setActiveRoadmap(id: string) {
    return await db.transaction(async (tx: any) => {
        // Set all to false
        await tx.update(schema.roadmapPrograms)
            .set({ isActive: false })

        // Set target to true
        await tx.update(schema.roadmapPrograms)
            .set({ isActive: true })
            .where(eq(schema.roadmapPrograms.id, id))

        revalidatePath('/')
        revalidatePath('/dashboard')
        revalidatePath('/tracker')
        revalidatePath('/setup')
        return { success: true }
    })
}

export async function deleteRoadmap(id: string) {
    await db.delete(schema.roadmapPrograms)
        .where(eq(schema.roadmapPrograms.id, id))

    revalidatePath('/')
    revalidatePath('/dashboard')
    revalidatePath('/tracker')
    revalidatePath('/setup')
    return { success: true }
}

export async function updateRoadmapTitle(id: string, title: string) {
    await db.update(schema.roadmapPrograms)
        .set({ title })
        .where(eq(schema.roadmapPrograms.id, id))

    revalidatePath('/setup')
    return { success: true }
}
