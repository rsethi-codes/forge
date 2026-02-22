'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function resetRoadmap() {
    // This is a destructive action. It deletes the current program and all related progress.
    const [latestProgram] = await db
        .select()
        .from(schema.roadmapPrograms)
        .orderBy(schema.roadmapPrograms.createdAt)
        .limit(1)

    if (latestProgram) {
        // Cascade delete should handle things if schema is set up, 
        // but let's be safe if it's not.
        // Drizzle schema shows cascading in some places, but let's just delete the program.
        await db.delete(schema.roadmapPrograms).where(eq(schema.roadmapPrograms.id, latestProgram.id))
    }

    // Also clear progress just in case orphans exist
    await db.delete(schema.dailyProgress)
    await db.delete(schema.disciplineScores)

    revalidatePath('/')
    revalidatePath('/dashboard')
    revalidatePath('/tracker')

    return { success: true }
}
