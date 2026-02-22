import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { and, gt, sql } from 'drizzle-orm'

export async function GET() {
    // Find milestones unlocked in the last 60 seconds
    const recent = await db
        .select()
        .from(schema.milestones)
        .where(gt(schema.milestones.achievedAt, new Date(Date.now() - 60000)))

    return NextResponse.json(recent)
}
