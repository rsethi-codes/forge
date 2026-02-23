import { groq } from '@ai-sdk/groq'
import { streamText } from 'ai'
import { requireUser } from '@/lib/auth-utils'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
    const user = await requireUser()
    const { messages, context } = await req.json()

    const result = await streamText({
        model: groq('llama-3.3-70b-versatile'),
        system: `You are Forge Intelligence, a Senior Architect Mentor for a high-performance developer preparing for a 35 LPA role.
        Your tone is blunt, technical, and high-agency. No fluff. 
        Context provided: ${JSON.stringify(context)}
        User: ${user.email} (Focusing on Senior Level Engineering).
        If the user asks for a code review, analyze their approach for:
        1. Performance/Scalability.
        2. Clean Architecture.
        3. Edge cases and production readiness.
        If they ask about roadmap topics, explain the 'Senior' perspective—why it matters in a large-scale system.`,
        messages,
    })

    return result.toDataStreamResponse()
}
