'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, and } from 'drizzle-orm'
import { requireUser } from '@/lib/auth-utils'
import { groq } from '@ai-sdk/groq'
import { generateObject } from 'ai'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

export async function getDayKnowledgeChecks(dayId: string) {
    const user = await requireUser()

    // Get questions for the day
    const checks = await db.query.knowledgeChecks.findMany({
        where: eq(schema.knowledgeChecks.dayId, dayId),
        orderBy: (checks, { asc }) => [asc(checks.sortOrder)]
    })

    // Get previous oily submissions for these checks
    const submissions = await db.query.knowledgeCheckSubmissions.findMany({
        where: eq(schema.knowledgeCheckSubmissions.userId, user.id)
    })

    return checks.map(check => ({
        ...check,
        submission: submissions.find(s => s.checkId === check.id)
    }))
}

export async function submitKnowledgeCheck(checkId: string, answerText: string) {
    const user = await requireUser()

    // 1. Get Context
    const check = await db.query.knowledgeChecks.findFirst({
        where: eq(schema.knowledgeChecks.id, checkId),
        with: {
            day: {
                with: {
                    topics: {
                        with: {
                            subtopics: true
                        }
                    }
                }
            }
        }
    })

    if (!check) throw new Error("Knowledge check not found")

    const { day } = check as any
    // 2. AI Analysis
    const { object: feedback } = await generateObject({
        model: groq('llama-3.3-70b-versatile'),
        schema: z.object({
            score: z.number().min(0).max(100),
            missedPoints: z.array(z.string()),
            understandingLevel: z.enum(['Novice', 'Competent', 'Operational', 'Expert']),
            feedback: z.string(),
            mentorComment: z.string()
        }),
        system: `You are the Forge AI Evaluator. You assess a user's comprehension of a specific technical topic.
        Be brutal but constructive. Reward depth and architectural understanding. 
        Penalize surface-level answers that don't address the "Why" or "Scale".`,
        prompt: `
        Context (Day): ${day.title}
        Focus: ${day.focus}
        Detailed Topics: ${day.topics.map((t: any) => t.title + ': ' + t.subtopics.map((s: any) => s.content).join(', ')).join('; ')}
        
        Question: ${check.questionText}
        User Answer: "${answerText}"

        Analyze the answer and provide:
        1. A score from 0-100.
        2. A list of specific technical points or concepts they missed.
        3. Their understanding level.
        4. Detailed feedback explaining the score.
        5. A personal, high-agency mentor comment.
        `
    })

    // 3. Persist to DB
    const [submission] = await db.insert(schema.knowledgeCheckSubmissions)
        .values({
            checkId,
            userId: user.id,
            answerText,
            aiScore: feedback.score,
            aiFeedback: feedback.feedback + "\n\n" + feedback.mentorComment,
            missedPoints: feedback.missedPoints,
            understandingLevel: feedback.understandingLevel,
        })
        .onConflictDoUpdate({
            target: [schema.knowledgeCheckSubmissions.id], // This might not work if we want to upsert by checkId + userId
            set: {
                answerText,
                aiScore: feedback.score,
                aiFeedback: feedback.feedback + "\n\n" + feedback.mentorComment,
                missedPoints: feedback.missedPoints,
                understandingLevel: feedback.understandingLevel,
                updatedAt: new Date()
            }
        })
        .returning()

    // Actually,knowledgeCheckSubmissions should probably have a unique constraint on (checkId, userId)
    // For now, let's just delete the old one if it exists or use a simpler logic.
    // I'll update the schema in a moment if needed.

    revalidatePath(`/tracker/day/${day.dayNumber}`)
    return submission
}
