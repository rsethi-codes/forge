import { groq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { requireUser } from '@/lib/auth-utils'
import { getDashboardData } from '@/lib/actions/roadmap'
import { format } from 'date-fns'

export const maxDuration = 30

export async function POST(req: Request) {
    const user = await requireUser()
    const { query, context } = await req.json()

    const input = (query ?? '').toString().slice(0, 240)
    if (!input.trim()) {
        return Response.json({ suggestions: [] })
    }

    let userContext = ''
    try {
        const today = format(new Date(), 'yyyy-MM-dd')
        const dashData = await getDashboardData(today) as any

        if (dashData?.hasProgram) {
            const pendingTasks = dashData.tasks?.filter((t: any) => !t.completed) ?? []

            userContext = `
--- LIVE USER CONTEXT (as of ${today}) ---
Program: ${dashData.programTitle || 'N/A'}
Current Day: Day ${dashData.day} of ${dashData.totalDays || 60}
Today's Focus: ${dashData.focus || 'N/A'}
Day Title: ${dashData.dayTitle || 'N/A'}
Phase: ${dashData.currentPhase || 'N/A'} | Week: ${dashData.currentWeek || 'N/A'}
Streak: ${dashData.streak ?? 0} days
Pending Tasks: ${pendingTasks.map((t: any) => `"${t.title}"`).join(', ') || 'None'}
Coins Balance: ${dashData.coinsBalance ?? 0}
Specialization: ${dashData.metadata?.specialization || 'N/A'}
Current Page: ${context?.pathname || 'Unknown'}
--- END USER CONTEXT ---`
        }
    } catch {
    }

    const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: `You are Forge Intelligence. Generate short, high-signal autocomplete suggestions for the user's chat input.
Rules:
- Return exactly 5 suggestions.
- Each suggestion must be a single line.
- No numbering, no quotes, no markdown.
- Keep each suggestion under 90 characters.
- Suggestions must be directly relevant to the user's roadmap context.
- Prefer command-style ("Show me...", "How do I...", "Explain...") or concise questions ("What is...", "Should I...").

${userContext}

User: ${user.email}`,
        prompt: `User is typing: "${input}"
Generate 5 completions or rewrites that turn this into sharper, more actionable questions or commands.`
    })

    const suggestions = text
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/^[-*\d.\s]+/, '').trim())
        .filter(Boolean)
        .slice(0, 5)

    return Response.json({ suggestions })
}
