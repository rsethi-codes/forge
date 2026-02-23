import { db } from '../src/lib/db'
import * as schema from '../src/lib/supabase/schema'
import { computeDailyBehavior } from '../src/lib/actions/behavior'
import { format } from 'date-fns'

async function main() {
    console.log('[Cron] Starting Daily Behavior Aggregation...')

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = format(yesterday, 'yyyy-MM-dd')

    // Get all active users
    const activeRaw = await db.select({ userId: schema.dailyProgress.userId })
        .from(schema.dailyProgress)
        .where(sql`date = ${dateStr}`)

    const userIds = [...new Set(activeRaw.map(r => r.userId))]

    for (const userId of userIds) {
        try {
            console.log(`[Cron] Processing user: ${userId}`)
            await computeDailyBehavior(userId, dateStr)
        } catch (err) {
            console.error(`[Cron] Error processing user ${userId}:`, err)
        }
    }

    console.log('[Cron] Aggregation Complete.')
    process.exit(0)
}

// Helper sql import for pure script
import { sql } from 'drizzle-orm'

main()
