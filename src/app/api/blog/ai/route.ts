import { groq } from '@ai-sdk/groq'
import { streamText } from 'ai'
import { requireUser } from '@/lib/auth-utils'

export const maxDuration = 60

// Strip HTML tags to plain text so the LLM gets clean input
function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim()
}

export async function POST(req: Request) {
    try {
        await requireUser()
        const { action, title, content: rawContent } = await req.json()
        const content = stripHtml(rawContent || '')

        let systemPrompt = "You are Forge AI, a Senior Architect Technical Writing Assistant."
        let prompt = ""

        if (action === 'generate-title') {
            systemPrompt = "You are a Tier-1 Tech Blogger. Generate 5 high-impact, 'Senior Architect' level titles for the post content provided. Make them sound elite, technical, and authoritative. Return ONLY the 5 titles separated by newlines."
            prompt = `Content:\n${content.slice(0, 4000) || 'No content yet'}`
        } else if (action === 'polish') {
            systemPrompt = "You are a Senior Technical Writer. Rewrite the provided section to be more precise, technical, and high-agency. Remove all fluff. Keep the technical depth but improve the 'Senior Architect' tone. Return only the revised markdown content."
            prompt = `Section Content:\n${content.slice(0, 6000)}`
        } else if (action === 'summarize') {
            systemPrompt = "You are a Lead Engineer. Summarize the provided post into a 2-sentence punchy 'Executive Summary' that would hook a CTO. High impact, high technical relevance. Return only the summary."
            prompt = `Content:\n${content.slice(0, 4000)}`
        } else if (action === 'outline') {
            systemPrompt = "You are a Content Strategist for Developers. Based on the current title and sparse notes, provide a detailed technical outline for a 2000-word deep dive. Use nested bullet points. Return only the outline."
            prompt = `Title: ${title}\nNotes: ${content.slice(0, 2000)}`
        }

        const result = await streamText({
            model: groq('llama-3.3-70b-versatile'),
            system: systemPrompt,
            prompt: prompt,
        })

        return result.toTextStreamResponse()
    } catch (error) {
        return new Response('Unauthorized or Internal Error', { status: 500 })
    }
}
