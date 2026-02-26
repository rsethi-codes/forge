'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, sql, desc, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireUser } from '../auth-utils'

export type RewardSource = 'task_complete' | 'pomodoro_complete' | 'kc_pass' | 'deep_session' | 'snooze' | 'unlock_theme' | 'purchase_reward'

const REWARD_VALUES: Record<RewardSource, number> = {
    'task_complete': 1,
    'pomodoro_complete': 2,
    'kc_pass': 5,
    'deep_session': 3,
    'snooze': -3,
    'unlock_theme': -50,
    'purchase_reward': 0 // Used for custom amounts
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
    revalidatePath('/rewards')
    return { success: true, amount }
}

export async function purchaseReward(rewardId: string, name: string, type: string, cost: number) {
    const user = await requireUser()
    const balance = await getCoinsBalance(user.id)

    if (balance < cost) {
        throw new Error('Insufficient coins')
    }

    return await db.transaction(async (tx) => {
        // 1. Deduct coins
        await tx.update(schema.rewardsWallet)
            .set({
                coinsBalance: sql`${schema.rewardsWallet.coinsBalance} - ${cost}`
            })
            .where(eq(schema.rewardsWallet.userId, user.id))

        // 2. Add to inventory
        await tx.insert(schema.rewardInventory)
            .values({
                userId: user.id,
                rewardId,
                rewardName: name,
                rewardType: type,
            })

        revalidatePath('/rewards')
        revalidatePath('/dashboard')
        return { success: true }
    })
}

export async function getRewardInventory() {
    const user = await requireUser()
    return await db.select()
        .from(schema.rewardInventory)
        .where(eq(schema.rewardInventory.userId, user.id))
        .orderBy(desc(schema.rewardInventory.purchasedAt))
}

export async function useReward(inventoryId: string) {
    const user = await requireUser()
    await db.update(schema.rewardInventory)
        .set({
            isUsed: true,
            usedAt: new Date()
        })
        .where(and(
            eq(schema.rewardInventory.id, inventoryId),
            eq(schema.rewardInventory.userId, user.id)
        ))

    revalidatePath('/rewards')
    return { success: true }
}

export async function getCoinsBalance(userId: string) {
    const [wallet] = await db.select()
        .from(schema.rewardsWallet)
        .where(eq(schema.rewardsWallet.userId, userId))
        .limit(1)

    return wallet?.coinsBalance ?? 0
}
