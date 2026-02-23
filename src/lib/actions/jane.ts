'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requireUser } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export async function getJaneApplications() {
    const user = await requireUser()

    return await db.query.janeApplications.findMany({
        where: eq(schema.janeApplications.userId, user.id),
        with: {
            company: true
        },
        orderBy: desc(schema.janeApplications.createdAt)
    })
}

export async function getJaneCompanies() {
    const user = await requireUser()
    return await db.select().from(schema.janeCompanies).where(eq(schema.janeCompanies.userId, user.id))
}

export async function addJaneCompany(data: { name: string, website?: string, industry?: string, notes?: string }) {
    const user = await requireUser()

    const [company] = await db
        .insert(schema.janeCompanies)
        .values({
            ...data,
            userId: user.id
        })
        .returning()

    revalidatePath('/jane')
    return company
}

export async function addJaneApplication(data: {
    companyId: string,
    roleTitle: string,
    jobUrl?: string,
    salaryRange?: string,
    status?: any
}) {
    const user = await requireUser()

    const [app] = await db
        .insert(schema.janeApplications)
        .values({
            ...data,
            userId: user.id
        })
        .returning()

    revalidatePath('/jane')
    return app
}

export async function getApplicationDetails(appId: string) {
    const user = await requireUser()

    const app = await db.query.janeApplications.findFirst({
        where: and(
            eq(schema.janeApplications.id, appId),
            eq(schema.janeApplications.userId, user.id)
        ),
        with: {
            company: true,
            interviews: true
        }
    })

    return app
}

export async function addJaneInterview(data: {
    applicationId: string,
    roundName: string,
    scheduledAt: Date,
    prepMaterial?: string,
    linkedRoadmapDay?: string
}) {
    await requireUser()

    const [interview] = await db
        .insert(schema.janeInterviews)
        .values({
            ...data
        })
        .returning()

    revalidatePath('/jane')
    return interview
}

export async function updateApplicationStatus(appId: string, status: any) {
    const user = await requireUser()

    await db
        .update(schema.janeApplications)
        .set({ status })
        .where(and(
            eq(schema.janeApplications.id, appId),
            eq(schema.janeApplications.userId, user.id)
        ))

    revalidatePath('/jane')
}
