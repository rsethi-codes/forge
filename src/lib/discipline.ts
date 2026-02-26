import { db } from '@/lib/db' // I need to create this db export
import * as schema from '@/lib/supabase/schema'
import { eq, and, sql } from 'drizzle-orm'
import { format } from 'date-fns'

export interface DailyStats {
    score: number
    tasksRate: number
    kcRate: number
    hoursRate: number
    message: string
}

export async function calculateDailyDiscipline(dateStr: string, userId: string): Promise<DailyStats> {
    // 1. Fetch Daily Progress
    const [progress] = await db
        .select()
        .from(schema.dailyProgress)
        .where(and(
            eq(schema.dailyProgress.date, dateStr),
            eq(schema.dailyProgress.userId, userId)
        ))
        .limit(1)

    const [profile] = await db
        .select({ hasStartedRoadmap: schema.profiles.hasStartedRoadmap })
        .from(schema.profiles)
        .where(eq(schema.profiles.id, userId))
        .limit(1)

    if (!progress || !profile?.hasStartedRoadmap) {
        return { score: 0, tasksRate: 0, kcRate: 0, hoursRate: 0, message: !profile?.hasStartedRoadmap ? "Ignite the forge by starting your first task. Strategy is nothing without execution." : "No data logged for today yet. Get to work." }
    }

    // 2. Fetch Tasks Completion
    const tasks = await db
        .select()
        .from(schema.taskCompletions)
        .where(eq(schema.taskCompletions.dailyProgressId, progress.id))

    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t: any) => t.completed).length
    const tasksRate = totalTasks > 0 ? (completedTasks / totalTasks) : 1 // 1 for days with no tasks? Or 0? Roadmap says % weight.

    // 3. Fetch KC Results
    const kcs = await db
        .select()
        .from(schema.knowledgeCheckResults)
        .where(eq(schema.knowledgeCheckResults.dailyProgressId, progress.id))

    const totalKcs = kcs.length
    const passedKcs = kcs.filter((k: any) => k.passed).length
    const kcRate = totalKcs > 0 ? (passedKcs / totalKcs) : 1

    // 4. Hours Rate
    const hoursTarget = 8
    const hoursLogged = parseFloat(progress.hoursLogged || '0')
    const hoursRate = Math.min(hoursLogged / hoursTarget, 1)

    // 5. Final Calculation
    // Tasks (60%), Retainment (20%), Effort (20%)
    const finalScore = Math.round(
        (tasksRate * 60) +
        (kcRate * 20) +
        (hoursRate * 20)
    )

    // 6. Motivation Message
    const getMessage = (score: number) => {
        if (score >= 95) {
            const msgs = [
                "Total dominance. You're not just moving, you're warping reality. Stay in this flow.",
                "Elite output. This is the frequency of 50LPA+ engineers. Don't touch the brakes.",
                "S-Tier performance achieved. You've transcended the grind. You are the Forge."
            ]
            return msgs[Math.floor(Math.random() * msgs.length)]
        }
        if (score >= 80) {
            const msgs = [
                "Strong momentum. You're clear of the pack, but the summit is still ahead.",
                "Impressive velocity. This consistency is your competitive advantage. Keep pushing.",
                "You're operating at a Senior level today. Maintain this and the rewards follow."
            ]
            return msgs[Math.floor(Math.random() * msgs.length)]
        }
        if (score >= 60) {
            const msgs = [
                "Acceptable. But 'acceptable' is a dangerous trap. Tighten the execution.",
                "You're in the game, but not winning it yet. Increase the intensity.",
                "Solid effort, but your potential is much higher. Find the next gear."
            ]
            return msgs[Math.floor(Math.random() * msgs.length)]
        }
        if (score >= 40) {
            const msgs = [
                "Mediocrity is a choice. You're dangerously close to choosing it. Refocus.",
                "Sluggish performance. The engine is stalling. Ignite the spark before it dies.",
                "Base level effort. This won't get you where you want to go. Snap out of it."
            ]
            return msgs[Math.floor(Math.random() * msgs.length)]
        }
        const msgs = [
            "Pathetic. If you give up now, you'll regret it for the next decade. Back to the grind.",
            "Zero momentum. The world is passing you by while you hesitate. Move.",
            "System failure. Your discipline is in the red. Rescue the day or accept defeat."
        ]
        return msgs[Math.floor(Math.random() * msgs.length)]
    }

    const message = getMessage(finalScore)

    // 7. Calculate Streak
    const [prevScore] = await db
        .select({ streakDays: schema.disciplineScores.streakDays })
        .from(schema.disciplineScores)
        .where(and(
            eq(schema.disciplineScores.userId, userId),
            sql`${schema.disciplineScores.date} < ${dateStr}`
        ))
        .orderBy(sql`${schema.disciplineScores.date} desc`)
        .limit(1)

    const prevStreak = prevScore?.streakDays ?? 0
    // Lenient streak: any activity (score > 0) keeps streak alive, 
    // but you need a "solid" day (score >= 20) to increment it.
    let currentStreak = prevStreak
    if (finalScore >= 20) {
        currentStreak = prevStreak + 1
    } else if (finalScore === 0) {
        currentStreak = 0 // Only reset if absolutely zero work done
    }

    // 8. Store / Update Discipline Score
    try {
        await db
            .insert(schema.disciplineScores)
            .values({
                userId,
                date: dateStr,
                streakDays: currentStreak,
                tasksCompletionRate: tasksRate.toString(),
                hoursLogged: hoursLogged.toString(),
                hoursTarget: hoursTarget.toString(),
                kcPassRate: kcRate.toString(),
                disciplineScore: finalScore.toString(),
                motivationMessage: message
            } as any)
            .onConflictDoUpdate({
                target: [schema.disciplineScores.userId, schema.disciplineScores.date],
                set: {
                    streakDays: currentStreak,
                    tasksCompletionRate: tasksRate.toString(),
                    hoursLogged: hoursLogged.toString(),
                    kcPassRate: kcRate.toString(),
                    disciplineScore: finalScore.toString(),
                    motivationMessage: message
                }
            })
    } catch (err) {
        console.error('Failed to update discipline score:', err)
        // We don't throw here to avoid crashing the main UI flow
    }

    return {
        score: finalScore,
        tasksRate: Math.round(tasksRate * 100),
        kcRate: Math.round(kcRate * 100),
        hoursRate: Math.round(hoursRate * 100),
        message
    }
}

export async function calculateCurrentStreak(userId: string): Promise<number> {
    // Basic streak logic: count consecutive days with discipline_score > 0 starting from today backwards
    const scores = await db
        .select({ date: schema.disciplineScores.date, score: schema.disciplineScores.disciplineScore })
        .from(schema.disciplineScores)
        .where(eq(schema.disciplineScores.userId, userId))
        .orderBy(sql`${schema.disciplineScores.date} desc`)

    let streak = 0
    const today = format(new Date(), 'yyyy-MM-dd')

    // Check if there's any score at all
    if (scores.length === 0) return 0

    // If last score isn't today or yesterday, streak is broken
    // (Actual logic would be more robust, but this is a start)

    for (const s of scores) {
        if (parseFloat(s.score) > 0) {
            streak++
        } else {
            break
        }
    }

    return streak
}

export function calculateTier(score: number): { tier: string, color: string } {
    if (score >= 95) return { tier: 'S', color: '#ff3131' } // Crimson for S-tier
    if (score >= 85) return { tier: 'A', color: '#00d68f' }
    if (score >= 70) return { tier: 'B', color: '#f0b429' }
    if (score >= 50) return { tier: 'C', color: '#ff6b00' }
    return { tier: 'D', color: '#666666' }
}

export async function getDisciplineHistory(userId: string, limit: number = 30) {
    return await db
        .select()
        .from(schema.disciplineScores)
        .where(eq(schema.disciplineScores.userId, userId))
        .orderBy(sql`${schema.disciplineScores.date} desc`)
        .limit(limit)
}
