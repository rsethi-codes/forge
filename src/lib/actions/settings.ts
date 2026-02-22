'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getProfile(email: string) {
    let [profile] = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.email, email))
        .limit(1)

    if (!profile) {
        // Create initial profile if it doesn't exist
        const [newProfile] = await db
            .insert(schema.profiles)
            .values({
                email,
                fullName: email.split('@')[0],
                updatedAt: new Date()
            })
            .returning()
        profile = newProfile
    }

    return profile
}

export async function updateProfile(email: string, data: {
    fullName?: string
    bio?: string
    emailNotifications?: boolean
    morningDigestTime?: string
}) {
    await db
        .update(schema.profiles)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(schema.profiles.email, email))

    revalidatePath('/settings')
    return { success: true }
}
