'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, and, or, ilike, desc, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth-utils'

export type QnASourceType = 'gpt' | 'blog' | 'youtube' | 'other'

export interface QnAEntry {
    id: string
    userId: string
    dayId: string
    topicId: string | null
    subtopicId: string | null
    question: string
    answerText: string | null
    sourceType: QnASourceType
    sourceUrl: string | null
    tags: string[]
    createdAt: Date
    updatedAt: Date
}

// ── Add a new Q&A entry ─────────────────────────────────────────────────────

export async function addQnA(data: {
    dayId: string
    topicId?: string | null
    subtopicId?: string | null
    question: string
    answerText?: string
    sourceType: QnASourceType
    sourceUrl?: string
    tags?: string[]
}): Promise<{ success: boolean; qna?: QnAEntry; error?: string }> {
    try {
        const user = await requireUser()

        // Verify the day is completed before allowing Q&A
        const [dayProgress] = await db
            .select()
            .from(schema.dailyProgress)
            .where(and(
                eq(schema.dailyProgress.dayId, data.dayId),
                eq(schema.dailyProgress.userId, user.id)
            ))

        if (!dayProgress || dayProgress.status !== 'complete') {
            return { success: false, error: 'Q&A is only available after completing the day.' }
        }

        const [qna] = await db
            .insert(schema.topicQnA)
            .values({
                userId: user.id,
                dayId: data.dayId,
                topicId: data.topicId || null,
                subtopicId: data.subtopicId || null,
                question: data.question.trim(),
                answerText: data.answerText?.trim() || null,
                sourceType: data.sourceType,
                sourceUrl: data.sourceUrl?.trim() || null,
                tags: data.tags || [],
            })
            .returning()

        revalidatePath('/tracker')
        return { success: true, qna: qna as QnAEntry }
    } catch (err) {
        console.error('[addQnA]', err)
        return { success: false, error: 'Failed to save Q&A.' }
    }
}

// ── Update an existing Q&A ───────────────────────────────────────────────────

export async function updateQnA(
    qnaId: string,
    data: {
        question?: string
        answerText?: string
        sourceType?: QnASourceType
        sourceUrl?: string
        tags?: string[]
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await requireUser()

        await db
            .update(schema.topicQnA)
            .set({
                ...(data.question && { question: data.question.trim() }),
                ...(data.answerText !== undefined && { answerText: data.answerText?.trim() || null }),
                ...(data.sourceType && { sourceType: data.sourceType }),
                ...(data.sourceUrl !== undefined && { sourceUrl: data.sourceUrl?.trim() || null }),
                ...(data.tags && { tags: data.tags }),
                updatedAt: new Date(),
            })
            .where(and(eq(schema.topicQnA.id, qnaId), eq(schema.topicQnA.userId, user.id)))

        revalidatePath('/tracker')
        return { success: true }
    } catch (err) {
        console.error('[updateQnA]', err)
        return { success: false, error: 'Failed to update Q&A.' }
    }
}

// ── Delete a Q&A ─────────────────────────────────────────────────────────────

export async function deleteQnA(qnaId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await requireUser()

        await db
            .delete(schema.topicQnA)
            .where(and(eq(schema.topicQnA.id, qnaId), eq(schema.topicQnA.userId, user.id)))

        revalidatePath('/tracker')
        return { success: true }
    } catch (err) {
        console.error('[deleteQnA]', err)
        return { success: false, error: 'Failed to delete Q&A.' }
    }
}

// ── Fetch Q&As for a specific day ─────────────────────────────────────────────

export async function getQnAsForDay(dayId: string): Promise<QnAEntry[]> {
    try {
        const user = await requireUser()

        const results = await db
            .select()
            .from(schema.topicQnA)
            .where(and(eq(schema.topicQnA.dayId, dayId), eq(schema.topicQnA.userId, user.id)))
            .orderBy(desc(schema.topicQnA.createdAt))

        return results as QnAEntry[]
    } catch (err) {
        console.error('[getQnAsForDay]', err)
        return []
    }
}

// ── Fetch Q&As for a specific topic ──────────────────────────────────────────

export async function getQnAsForTopic(topicId: string): Promise<QnAEntry[]> {
    try {
        const user = await requireUser()

        const results = await db
            .select()
            .from(schema.topicQnA)
            .where(and(eq(schema.topicQnA.topicId, topicId), eq(schema.topicQnA.userId, user.id)))
            .orderBy(desc(schema.topicQnA.createdAt))

        return results as QnAEntry[]
    } catch (err) {
        console.error('[getQnAsForTopic]', err)
        return []
    }
}

// ── Global Q&A search ─────────────────────────────────────────────────────────

export async function searchQnAs(query: string): Promise<(QnAEntry & { dayNumber?: string; topicTitle?: string })[]> {
    try {
        const user = await requireUser()

        if (!query.trim()) return []

        const term = `%${query.trim()}%`

        const results = await db
            .select({
                qna: schema.topicQnA,
                dayNumber: schema.roadmapDays.dayNumber,
                topicTitle: schema.roadmapTopics.title,
            })
            .from(schema.topicQnA)
            .leftJoin(schema.roadmapDays, eq(schema.topicQnA.dayId, schema.roadmapDays.id))
            .leftJoin(schema.roadmapTopics, eq(schema.topicQnA.topicId, schema.roadmapTopics.id))
            .where(
                and(
                    eq(schema.topicQnA.userId, user.id),
                    or(
                        ilike(schema.topicQnA.question, term),
                        ilike(schema.topicQnA.answerText, term)
                    )
                )
            )
            .orderBy(desc(schema.topicQnA.createdAt))
            .limit(50)

        return results.map((r) => ({
            ...(r.qna as QnAEntry),
            dayNumber: r.dayNumber ?? undefined,
            topicTitle: r.topicTitle ?? undefined,
        }))
    } catch (err) {
        console.error('[searchQnAs]', err)
        return []
    }
}
