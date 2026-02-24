'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, desc, not, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { requireUser } from '../auth-utils'

export async function listRoadmaps() {
    const user = await requireUser()
    return await db
        .select()
        .from(schema.roadmapPrograms)
        .where(and(
            eq(schema.roadmapPrograms.userId, user.id),
            isNull(schema.roadmapPrograms.deletedAt)
        ))
        .orderBy(desc(schema.roadmapPrograms.createdAt))
}

export async function setActiveRoadmap(id: string) {
    const user = await requireUser()
    return await db.transaction(async (tx: any) => {
        const today = new Date().toISOString().split('T')[0]

        // Set all to false for THIS user
        await tx.update(schema.roadmapPrograms)
            .set({ isActive: false })
            .where(eq(schema.roadmapPrograms.userId, user.id))

        // Set target to true for THIS user and reset start date to today (Ignition)
        await tx.update(schema.roadmapPrograms)
            .set({
                isActive: true,
                startDate: today
            })
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

    // Soft Delete: Set deletedAt instead of actual deletion to protect data
    await db.update(schema.roadmapPrograms)
        .set({
            deletedAt: new Date(),
            isActive: false // Also deactivate it if it was active
        })
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
