import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthStatus } from '@/lib/actions/auth-status'
import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { updateDayProgress } from '@/lib/actions/day'

const EventSchema = z.object({
    type: z.string().min(1),
    at: z.string().optional(),
    meta: z.any().optional(),
    idempotencyKey: z.string().optional(),
})

const BulkSchema = z.object({
    sessionId: z.string().uuid().nullable().optional(),
    dayId: z.string().uuid(),
    docId: z.string().min(1),
    sentAt: z.string().optional(),
    clientVersion: z.string().optional(),
    idempotencyKey: z.string().optional(),
    events: z.array(EventSchema).min(1),
})

export async function POST(request: Request) {
    const auth = await getAuthStatus()
    if (!auth.isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return new NextResponse('Bad Request', { status: 400 })
    }

    const parsed = BulkSchema.safeParse(body)
    if (!parsed.success) {
        // Dead-letter malformed payload
        await db.insert(schema.appEvents).values({
            userId: auth.user!.id,
            sessionId: null,
            eventType: 'docs_dead_letter',
            eventMeta: { reason: 'schema', issues: parsed.error.issues }
        })
        return new NextResponse('Bad Request', { status: 400 })
    }

    const payload = parsed.data

    // Store each event as an app_event (namespaced by docs)
    // Idempotency rule:
    // - Prefer per-event `idempotencyKey`
    // - Else fall back to request-level idempotencyKey + index
    const results: Array<{ accepted: boolean; type: string; idempotencyKey: string }> = []

    for (let i = 0; i < payload.events.length; i++) {
        const e = payload.events[i]
        const eventKey =
            e.idempotencyKey ||
            (payload.idempotencyKey ? `${payload.idempotencyKey}:${i}` : `${payload.dayId}:${payload.docId}:${e.type}:${e.at || ''}:${i}`)

        const inserted = await db
            .insert(schema.docsEventDedup)
            .values({
                userId: auth.user!.id,
                idempotencyKey: eventKey,
            })
            .onConflictDoNothing()
            .returning({ id: schema.docsEventDedup.id })

        if (!inserted || inserted.length === 0) {
            results.push({ accepted: false, type: e.type, idempotencyKey: eventKey })
            continue
        }

        await db.insert(schema.appEvents).values({
            userId: auth.user!.id,
            sessionId: payload.sessionId ?? null,
            eventType: e.type.startsWith('docs_') ? e.type : `docs_${e.type}`,
            eventMeta: {
                ...(e.meta ?? {}),
                dayId: payload.dayId,
                docId: payload.docId,
                sentAt: payload.sentAt,
                clientVersion: payload.clientVersion,
            },
        })

        // Section -> task/topic mapping (bi-directional progress sync)
        // If DOC_META provides a mapping, the client sends docs_section_view with meta.taskId/meta.topicId.
        // We then upsert corresponding completion rows (idempotency is already guaranteed by docs_event_dedup).
        if (e.type === 'docs_section_view') {
            const sectionId = (e.meta as any)?.sectionId ? String((e.meta as any).sectionId) : null
            const sectionTitle = (e.meta as any)?.title ? String((e.meta as any).title) : null
            const taskId = (e.meta as any)?.taskId ? String((e.meta as any).taskId) : null
            const topicId = (e.meta as any)?.topicId ? String((e.meta as any).topicId) : null

            if (sectionId) {
                await db
                    .insert(schema.docsSectionRollup)
                    .values({
                        userId: auth.user!.id,
                        dayId: payload.dayId,
                        docId: payload.docId,
                        sectionId,
                        sectionTitle,
                        viewCount: 1,
                        lastSeenAt: new Date(),
                    })
                    .onConflictDoUpdate({
                        target: [schema.docsSectionRollup.userId, schema.docsSectionRollup.dayId, schema.docsSectionRollup.docId, schema.docsSectionRollup.sectionId],
                        set: {
                            viewCount: sql`${schema.docsSectionRollup.viewCount} + 1`,
                            lastSeenAt: new Date(),
                            sectionTitle: sectionTitle ? sectionTitle : schema.docsSectionRollup.sectionTitle,
                        }
                    })
            }

            if (taskId || topicId) {
                const [prog] = await db
                    .select({ id: schema.dailyProgress.id })
                    .from(schema.dailyProgress)
                    .where(and(
                        eq(schema.dailyProgress.userId, auth.user!.id),
                        eq(schema.dailyProgress.dayId, payload.dayId)
                    ))
                    .orderBy(desc(schema.dailyProgress.date))
                    .limit(1)

                if (prog) {
                    if (taskId) {
                        await db
                            .insert(schema.taskCompletions)
                            .values({
                                taskId,
                                dailyProgressId: prog.id,
                                completed: true,
                                completedAt: new Date(),
                                startedAt: new Date(),
                                timeSpent: 0,
                            })
                            .onConflictDoUpdate({
                                target: [schema.taskCompletions.taskId, schema.taskCompletions.dailyProgressId],
                                set: {
                                    completed: true,
                                    completedAt: new Date(),
                                    // Preserve existing startedAt if already present
                                    startedAt: schema.taskCompletions.startedAt,
                                }
                            })
                    }

                    if (topicId) {
                        await db
                            .insert(schema.topicCompletions)
                            .values({
                                topicId,
                                dailyProgressId: prog.id,
                                completed: true,
                                completedAt: new Date(),
                                startedAt: new Date(),
                                timeSpent: 0,
                            })
                            .onConflictDoUpdate({
                                target: [schema.topicCompletions.topicId, schema.topicCompletions.dailyProgressId],
                                set: {
                                    completed: true,
                                    completedAt: new Date(),
                                    startedAt: schema.topicCompletions.startedAt,
                                }
                            })
                    }
                }
            }
        }

        // Minimal bi-directional progress sync (safe + idempotent due to dedup table)
        // - docs_open => mark in_progress if day was not_started (handled inside client for tasks; here we do day-level only)
        // - docs_done => mark complete
        // - docs_undone => set in_progress (does not delete completions; just day status)
        if (e.type === 'docs_open') {
            const [prog] = await db
                .select({ id: schema.dailyProgress.id, status: schema.dailyProgress.status })
                .from(schema.dailyProgress)
                .where(and(
                    eq(schema.dailyProgress.userId, auth.user!.id),
                    eq(schema.dailyProgress.dayId, payload.dayId)
                ))
                .orderBy(desc(schema.dailyProgress.date))
                .limit(1)
            if (prog && prog.status === 'not_started') {
                await updateDayProgress(prog.id, { status: 'in_progress' })
            }
        }

        if (e.type === 'docs_done') {
            const [prog] = await db
                .select({ id: schema.dailyProgress.id })
                .from(schema.dailyProgress)
                .where(and(
                    eq(schema.dailyProgress.userId, auth.user!.id),
                    eq(schema.dailyProgress.dayId, payload.dayId)
                ))
                .orderBy(desc(schema.dailyProgress.date))
                .limit(1)
            if (prog) {
                await updateDayProgress(prog.id, { status: 'complete' })

                // AUTOMATIC SHOWING: Post to LinkedIn if completion policy met
                const { postToLinkedIn } = await import('@/lib/integrations/linkedin')
                const [day] = await db.select().from(schema.roadmapDays).where(eq(schema.roadmapDays.id, payload.dayId)).limit(1)
                if (day) {
                    const content = `🚀 Milestone Reached: Just wrapped up Day ${day.dayNumber} of THE FORGE Roadmap. \n\nFocus: ${day.focus}\n\nArchitecture building, deep work, and automated tracking are the only ways to scale. Check my progress at forge-reader.vercel.app/p/${auth.user!.id.slice(0, 8)}`
                    await postToLinkedIn(auth.user!.id, content)
                }
            }
        }

        if (e.type === 'docs_undone') {
            const [prog] = await db
                .select({ id: schema.dailyProgress.id, status: schema.dailyProgress.status })
                .from(schema.dailyProgress)
                .where(and(
                    eq(schema.dailyProgress.userId, auth.user!.id),
                    eq(schema.dailyProgress.dayId, payload.dayId)
                ))
                .orderBy(desc(schema.dailyProgress.date))
                .limit(1)
            if (prog && prog.status === 'complete') {
                await updateDayProgress(prog.id, { status: 'in_progress' })
            }
        }

        if (e.type === 'docs_heartbeat') {
            await db.update(schema.profiles)
                .set({ updatedAt: new Date() })
                .where(eq(schema.profiles.id, auth.user!.id))
        }

        results.push({ accepted: true, type: e.type, idempotencyKey: eventKey })
    }

    const response = NextResponse.json({ success: true, ingested: results })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response
}
