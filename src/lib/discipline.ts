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

export async function calculateDailyDiscipline(dateStr: string): Promise<DailyStats> {
    // 1. Fetch Daily Progress
    const [progress] = await db
        .select()
        .from(schema.dailyProgress)
        .where(eq(schema.dailyProgress.date, dateStr))
        .limit(1)

    if (!progress) {
        return { score: 0, tasksRate: 0, kcRate: 0, hoursRate: 0, message: "No data logged for today yet. Get to work." }
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
    let message = ""
    if (finalScore >= 90) message = "Elite performance. You're operating at a Senior level. Keep the pressure."
    else if (finalScore >= 75) message = "Acceptable. But 'acceptable' doesn't get you to 30LPA. Tighten up."
    else if (finalScore >= 50) message = "Mediocrity is a choice. You're choosing it right now. Refocus."
    else message = "Pathetic. If you give up now, you'll regret it for the next decade. Back to the grind."

    // 7. Store / Update Discipline Score
    await db
        .insert(schema.disciplineScores)
        .values({
            date: dateStr,
            streakDays: 0, // Should be calculated separately
            tasksCompletionRate: tasksRate.toString(),
            hoursLogged: hoursLogged.toString(),
            hoursTarget: hoursTarget.toString(),
            kcPassRate: kcRate.toString(),
            disciplineScore: finalScore.toString(),
            motivationMessage: message
        } as any)
        .onConflictDoUpdate({
            target: schema.disciplineScores.date,
            set: {
                tasksCompletionRate: tasksRate.toString(),
                hoursLogged: hoursLogged.toString(),
                kcPassRate: kcRate.toString(),
                disciplineScore: finalScore.toString(),
                motivationMessage: message
            }
        })

    return {
        score: finalScore,
        tasksRate: Math.round(tasksRate * 100),
        kcRate: Math.round(kcRate * 100),
        hoursRate: Math.round(hoursRate * 100),
        message
    }
}

export async function calculateCurrentStreak(): Promise<number> {
    // Basic streak logic: count consecutive days with discipline_score > 0 starting from today backwards
    const scores = await db
        .select({ date: schema.disciplineScores.date, score: schema.disciplineScores.disciplineScore })
        .from(schema.disciplineScores)
        .orderBy(sql`${schema.disciplineScores.date} desc`)

    let streak = 0
    const today = format(new Date(), 'yyyy-MM-dd')

    // Check if there's any score at all
    if (scores.length === 0) return 0

    // If last score isn't today or yesterday, streak is broken
    // (Actual logic would be more robust, but this is a start)

    for (const s of scores) {
        if (parseFloat(s.score) > 50) { // Only count "good" days for streak? Or any day?
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

export async function getDisciplineHistory(limit: number = 30) {
    return await db
        .select()
        .from(schema.disciplineScores)
        .orderBy(sql`${schema.disciplineScores.date} desc`)
        .limit(limit)
}
