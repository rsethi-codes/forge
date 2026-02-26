import { groq } from '@ai-sdk/groq'
import { streamText } from 'ai'
import { requireUser } from '@/lib/auth-utils'
import { getDashboardData } from '@/lib/actions/roadmap'
import { format } from 'date-fns'

// Allow streaming responses up to 60 seconds
export const maxDuration = 60

export async function POST(req: Request) {
    const user = await requireUser()
    const { messages, context } = await req.json()

    // Fetch live user roadmap context to enrich the AI's awareness
    let userContext = ''
    try {
        const today = format(new Date(), 'yyyy-MM-dd')
        const dashData = await getDashboardData(today) as any

        if (dashData?.hasProgram) {
            const pendingTasks = dashData.tasks?.filter((t: any) => !t.completed) ?? []
            const doneTasks = dashData.tasks?.filter((t: any) => t.completed) ?? []

            userContext = `
--- LIVE USER CONTEXT (as of ${today}) ---
Program: ${dashData.programTitle || 'N/A'}
Current Day: Day ${dashData.day} of ${dashData.totalDays || 60}
Today's Focus: ${dashData.focus || 'N/A'}
Day Title: ${dashData.dayTitle || 'N/A'}
Phase: ${dashData.currentPhase || 'N/A'} | Week: ${dashData.currentWeek || 'N/A'}
Discipline Score (current): ${dashData.disciplineScore ?? 'N/A'}%
Streak: ${dashData.streak ?? 0} days
Hours Logged Today: ${dashData.hoursLogged ?? 0}h / ${dashData.hoursTarget ?? 0}h target
Tasks Done Today: ${dashData.tasksDone ?? 0} / ${dashData.tasksTotal ?? 0}
Pending Tasks: ${pendingTasks.map((t: any) => `"${t.title}" (${t.type}, ${t.duration})`).join(', ') || 'None'}
Completed Tasks: ${doneTasks.map((t: any) => `"${t.title}"`).join(', ') || 'None'}
Top Priority Task: ${dashData.topTask || 'N/A'}
Recommended Action: ${dashData.recommendedAction || 'N/A'}
Is Past Due: ${dashData.isPastDue ? 'YES - BEHIND SCHEDULE' : 'On track'}
Coins Balance: ${dashData.coinsBalance ?? 0}
Program Strengths: ${dashData.metadata?.strengths?.map((s: any) => s.content).join(', ') || 'N/A'}
Target Package: ${dashData.metadata?.targetPackage ? `${dashData.metadata.targetPackage} LPA` : 'N/A'}
Specialization: ${dashData.metadata?.specialization || 'N/A'}
Current Page: ${context?.pathname || 'Unknown'}
--- END USER CONTEXT ---`
        }
    } catch (e) {
        // Context injection failed silently — mentor still works without it
    }

    const result = await streamText({
        model: groq('llama-3.3-70b-versatile'),
        system: `You are Forge Intelligence, an elite Senior Architect Mentor embedded directly in the user's personal war room.
Your primary purpose is to help them execute their roadmap, sharpen their engineering depth, and accelerate their career to a 35 LPA role.
Your tone: blunt, direct, technical, high-agency. Zero fluff. Zero corporate speak.

You have LIVE access to the user's roadmap data. When answering, always factor in:
- What day they're on and what they should be building
- Their current discipline score and streak
- What tasks are pending vs done today
- Their specialization focus and target package
- Their strengths and known gaps

When asked general technical questions, if it relates to their roadmap context, connect the answer to their specific situation.
When asked about code, review for performance, scale, and production-readiness — the standard of a Senior Engineer.
When asked about progress, be honest about gaps. Don't be encouraging for no reason.

${userContext}

User: ${user.email}`,
        messages: messages.map((m: any) => ({
            role: m.role,
            content: m.content || m.parts?.map((p: any) => p.text).join('\n') || ''
        })),
    })

    return result.toUIMessageStreamResponse()
}
