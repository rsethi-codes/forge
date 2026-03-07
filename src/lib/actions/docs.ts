'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { requireUser } from '@/lib/auth-utils'
import { and, desc, eq, sql } from 'drizzle-orm'

export async function getDocsEngagementForDay(dayId: string) {
    const user = await requireUser()

    const rows = await db
        .select({
            eventType: schema.appEvents.eventType,
            eventMeta: schema.appEvents.eventMeta,
            createdAt: schema.appEvents.createdAt,
        })
        .from(schema.appEvents)
        .where(and(
            eq(schema.appEvents.userId, user.id),
            sql`${schema.appEvents.eventMeta} ->> 'dayId' = ${dayId}`,
            sql`${schema.appEvents.eventType} LIKE 'docs_%'`
        ))
        .orderBy(desc(schema.appEvents.createdAt))
        .limit(500)

    let opens = 0
    let closes = 0
    let maxScrollPct = 0
    let activeSeconds = 0
    const sectionIds = new Set<string>()

    for (const r of rows as any[]) {
        if (r.eventType === 'docs_open') opens++
        if (r.eventType === 'docs_close') {
            closes++
            // We rely on heartbeats for cumulative active time to avoid double counting
        }

        if (r.eventType === 'docs_heartbeat') {
            const inc = Number((r.eventMeta as any)?.increment) || 30
            activeSeconds += inc
        }

        if (r.eventType === 'docs_scroll_milestone') {
            const pct = Number((r.eventMeta as any)?.pct)
            if (Number.isFinite(pct)) maxScrollPct = Math.max(maxScrollPct, pct)
        }

        if (r.eventType === 'docs_section_view') {
            const id = (r.eventMeta as any)?.sectionId
            if (id) sectionIds.add(String(id))
        }
    }

    return {
        opens,
        closes,
        maxScrollPct,
        activeSeconds,
        sectionsSeen: sectionIds.size,
        recentEvents: rows.slice(0, 50),
    }
}

export async function getDocsSectionHeatmapForDay(dayId: string, docId?: string) {
    const user = await requireUser()

    try {
        const filters: any[] = [
            eq(schema.docsSectionRollup.userId, user.id),
            eq(schema.docsSectionRollup.dayId, dayId as any),
        ]
        if (docId) filters.push(eq(schema.docsSectionRollup.docId, docId))

        const rows = await db
            .select({
                sectionId: schema.docsSectionRollup.sectionId,
                title: schema.docsSectionRollup.sectionTitle,
                count: schema.docsSectionRollup.viewCount,
                lastSeenAt: schema.docsSectionRollup.lastSeenAt,
            })
            .from(schema.docsSectionRollup)
            .where(and(...filters))
            .orderBy(desc(schema.docsSectionRollup.viewCount))
            .limit(200)

        return (rows as any[]).map((r) => ({
            sectionId: String(r.sectionId),
            title: r.title ? String(r.title) : '',
            count: Number(r.count || 0),
            lastSeenAt: r.lastSeenAt,
        }))
    } catch (err: any) {
        const code = err?.code || err?.cause?.code
        // 42P01 = undefined_table (rollup not migrated yet)
        if (code !== '42P01') throw err

        const filters: any[] = [
            eq(schema.appEvents.userId, user.id),
            eq(schema.appEvents.eventType, 'docs_section_view'),
            sql`${schema.appEvents.eventMeta} ->> 'dayId' = ${dayId}`,
        ]
        if (docId) filters.push(sql`${schema.appEvents.eventMeta} ->> 'docId' = ${docId}`)

        const sectionIdSql = sql<string>`${schema.appEvents.eventMeta} ->> 'sectionId'`
        const titleSql = sql<string>`${schema.appEvents.eventMeta} ->> 'title'`

        const rows = await db
            .select({
                sectionId: sectionIdSql,
                title: titleSql,
                count: sql<number>`count(*)::int`,
                lastSeenAt: sql<Date>`max(${schema.appEvents.createdAt})`,
            })
            .from(schema.appEvents)
            .where(and(...filters))
            .groupBy(sectionIdSql, titleSql)
            .orderBy(desc(sql`count(*)`))
            .limit(200)

        return (rows as any[])
            .filter((r) => r.sectionId)
            .map((r) => ({
                sectionId: String(r.sectionId),
                title: r.title ? String(r.title) : '',
                count: Number(r.count || 0),
                lastSeenAt: r.lastSeenAt,
            }))
    }
}
