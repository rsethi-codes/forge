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

export async function updateProfile(userId: string, data: {
    fullName?: string
    bio?: string
    headline?: string
    vanityHandle?: string
    githubUrl?: string
    linkedinUrl?: string
    twitterUrl?: string
    websiteUrl?: string
    isPublic?: boolean
    showRoadmap?: boolean
    showBlogs?: boolean
    roleInterested?: string
    skills?: string[]
    emailNotifications?: boolean
    morningDigestTime?: string
    reminderEmailTime?: string
}) {
    // Check vanity handle uniqueness if changing
    if (data.vanityHandle) {
        const [existing] = await db
            .select()
            .from(schema.profiles)
            .where(eq(schema.profiles.vanityHandle, data.vanityHandle))
            .limit(1)

        if (existing && existing.id !== userId) {
            throw new Error('Vanity handle already taken')
        }
    }

    await db
        .update(schema.profiles)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(schema.profiles.id, userId))

    revalidatePath('/settings')
    revalidatePath('/(dashboard)/profile', 'layout')
    return { success: true }
}
