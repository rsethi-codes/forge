
'use server'

import { saveBeastRoadmapToDb, type BeastRoadmapJson } from '@/lib/parsing/beast-parser'
import { requireUser } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export async function seedBeastRoadmap() {
    if (process.env.NODE_ENV !== 'development') {
        throw new Error('Forbidden: Dev-only action')
    }

    const user = await requireUser()

    const sampleBeast: BeastRoadmapJson = {
        meta: {
            id: "beast_test_1",
            title: "Beast Mode: Fullstack Dominance",
            subtitle: "A 60-day aggressive neural rewrite for elite engineering roles.",
            author: "Forge Core",
            generated_at: new Date().toISOString(),
            total_days: 60,
            total_weeks: 8,
            dsa_language: "TypeScript",
            specialization: "Next.js & Distributed Systems",
            target_roles: ["Senior Fullstack Engineer", "Product Engineer"],
            target_salary_range_lpa: { min: 24, max: 42 },
            daily_hours_commitment: 10,
            daily_schedule: [
                { time: "08:00", activity: "Deep DSA" },
                { time: "11:00", activity: "System Architecture" },
                { time: "14:00", activity: "Project Build Phase" }
            ]
        },
        resume_analysis: {
            section_id: "ra_1",
            title: "Resume Audit",
            strengths: ["Strong TypeScript base", "Open Source contributions"],
            roasts: [
                "Your resume looks like a 2014 WordPress template had a mid-life crisis.",
                "Mentioning 'HTML/CSS' as a core skill in 2026 is like bragging you can breathe.",
                "Zero evidence of scale. 'Built a Todo app' doesn't mean you're an engineer."
            ],
            dsa_language_decision: {
                verdict: "Stick with TypeScript",
                reasons: ["Market proximity", "Context switching reduction"],
                warning: "Don't ignore memory management patterns just because it's JS.",
                tip: "Focus on Typed Arrays for performance-heavy tasks."
            },
            specialization_decision: {
                verdict: "High-Scale Next.js",
                reasoning: "The world needs engineers who can build and scale, not just boot up a template.",
                goal: "Mastering ISR, Streaming, and Edge compute.",
                comparison: [{ "Next.js": "High Demand" }, { "Remix": "Growing" }]
            }
        },
        phases: [
            {
                phase_id: "p1",
                phase_number: 1,
                weeks: "1-4",
                days: "1-28",
                title: "The Awakening",
                description: "Breaking old habits and establishing elite baseline performance.",
                theme: "Neural Foundation"
            }
        ],
        weeks: [
            {
                week_id: "w1",
                week_number: 1,
                title: "Core Mechanics & DSA Blitz",
                theme: "Foundation",
                phase_ref: "p1",
                color_theme: "#ff3131",
                project: {
                    name: "Distributed Messenger",
                    description: "High-scale real-time chat with global state sync.",
                    features: ["E2E Encryption", "Zero-Latency sync"],
                    frontend_stack: ["Next.js", "Tailwind"],
                    backend_stack: ["Redis", "WebSockets"],
                    devops: ["Docker"]
                }
            }
        ],
        days: [
            {
                day_id: "d1",
                day_number: 1,
                week_ref: "w1",
                phase_ref: "p1",
                title: "Array Mastery & Pointers",
                category: "dsa",
                tags: ["Arrays", "Optimization"],
                is_dsa_focus: true,
                is_project_day: false,
                is_review_day: false,
                afternoon_task: "Implement a custom circular buffer in TS.",
                tip: "Use Uint8Array for raw byte manipulation.",
                roast: "Don't just use .push() - understand what happened in memory, you amateur.",
                topics: [
                    {
                        topic_id: "t1.1",
                        title: "Memory Layout of Arrays",
                        subtopics: ["Contiguous allocation", "Cache locality", "Dynamic resizing"]
                    }
                ],
                leetcode_problems: [
                    {
                        id: "LC_1",
                        title: "Two Sum",
                        difficulty: "Easy",
                        pattern: "Hash Map",
                        url: "https://leetcode.com/problems/two-sum/"
                    }
                ],
                knowledge_check: {
                    total: 1,
                    questions: ["Why is cache locality important for array iteration?"]
                },
                completion_status: "not_started"
            },
            {
                day_id: "d2",
                day_number: 2,
                week_ref: "w1",
                phase_ref: "p1",
                title: "Advanced String Manipulation",
                category: "dsa",
                tags: ["Strings", "Hashing"],
                is_dsa_focus: true,
                is_project_day: false,
                is_review_day: false,
                afternoon_task: "Build a custom Robin-Karp search implementation.",
                topics: [
                    {
                        topic_id: "t2.1",
                        title: "Rolling Hashes",
                        subtopics: ["Collisions", "Window sliding"]
                    }
                ],
                leetcode_problems: [
                    {
                        id: "LC_3",
                        title: "Longest Substring Without Repeating Characters",
                        difficulty: "Medium",
                        pattern: "Sliding Window",
                        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/"
                    }
                ],
                knowledge_check: {
                    total: 1,
                    questions: ["What's the O complexity of Robin-Karp in worst case?"]
                },
                completion_status: "not_started"
            }
        ]
    }

    const program = await saveBeastRoadmapToDb(user.id, sampleBeast, "https://rsethi-codes.github.io/skill-up-docs-26/full-stack-plan")
    revalidatePath('/')
    return program
}
