'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export type RewardSource = 'task_complete' | 'pomodoro_complete' | 'kc_pass' | 'deep_session' | 'snooze' | 'unlock_theme'

const REWARD_VALUES: Record<RewardSource, number> = {
    'task_complete': 1,
    'pomodoro_complete': 2,
    'kc_pass': 5,
    'deep_session': 3,
    'snooze': -3,
    'unlock_theme': -50
}

export async function adjustCoins(userId: string, source: RewardSource) {
    const amount = REWARD_VALUES[source]

    // Upsert wallet
    await db.insert(schema.rewardsWallet)
        .values({
            userId,
            coinsBalance: amount > 0 ? amount : 0,
            lastEarnedAt: amount > 0 ? new Date() : null
        })
        .onConflictDoUpdate({
            target: [schema.rewardsWallet.userId],
            set: {
                coinsBalance: sql`${schema.rewardsWallet.coinsBalance} + ${amount}`,
                ...(amount > 0 ? { lastEarnedAt: new Date() } : {})
            }
        })

    revalidatePath('/dashboard')
    return { success: true, amount }
}

export async function getCoinsBalance(userId: string) {
    const [wallet] = await db.select()
        .from(schema.rewardsWallet)
        .where(eq(schema.rewardsWallet.userId, userId))
        .limit(1)

    return wallet?.coinsBalance ?? 0
}
