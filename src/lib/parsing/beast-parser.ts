
import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq } from 'drizzle-orm'

export interface BeastRoadmapJson {
    meta: {
        id: string;
        title: string;
        subtitle: string;
        author: string;
        generated_at: string;
        total_days: number;
        total_weeks: number;
        dsa_language: string;
        specialization: string;
        target_roles: string[];
        target_salary_range_lpa: {
            min: number;
            max: number;
        };
        daily_hours_commitment: number;
        daily_schedule: {
            time: string;
            activity: string;
        }[];
    };
    resume_analysis: {
        section_id: string;
        title: string;
        strengths: string[];
        roasts: string[];
        dsa_language_decision: {
            verdict: string;
            reasons: string[];
            warning: string;
            tip: string;
        };
        specialization_decision: {
            verdict: string;
            reasoning: string;
            goal: string;
            comparison: { [key: string]: string }[];
        };
    };
    phases: {
        phase_id: string;
        phase_number: number;
        weeks: string;
        days: string;
        title: string;
        description: string;
        theme: string;
    }[];
    weeks: {
        week_id: string;
        week_number: number;
        title: string;
        theme: string;
        phase_ref: string;
        color_theme: string;
        project?: {
            name: string;
            description: string;
            features: string[];
            frontend_stack: string[];
            backend_stack: string[];
            devops: string[];
        };
    }[];
    days: {
        day_id: string;
        day_number: number;
        week_ref: string;
        phase_ref: string;
        title: string;
        category: string;
        tags: string[];
        is_dsa_focus: boolean;
        is_project_day: boolean;
        is_review_day: boolean;
        afternoon_task?: string;
        tip?: string;
        roast?: string;
        context?: string;
        topics: {
            topic_id: string;
            title: string;
            context?: string;
            subtopics: string[];
        }[];
        leetcode_problems?: {
            id: string;
            title: string;
            difficulty: string;
            pattern: string;
            url: string;
        }[];
        knowledge_check: {
            total: number;
            questions: string[];
        };
        completion_status: string;
    }[];
}

export function isBeastRoadmap(json: any): json is BeastRoadmapJson {
    return json && json.meta && Array.isArray(json.phases) && Array.isArray(json.weeks) && Array.isArray(json.days);
}

export async function saveBeastRoadmapToDb(userId: string, json: BeastRoadmapJson) {
    try {
        return await db.transaction(async (tx: any) => {
            // 1. Deactivate existing programs
            await tx.update(schema.roadmapPrograms).set({ isActive: false }).where(eq(schema.roadmapPrograms.userId, userId));

            // 2. Create Program
            const [program] = await tx.insert(schema.roadmapPrograms).values({
                userId,
                title: json.meta.title,
                description: json.meta.subtitle,
                totalDays: json.meta.total_days,
                startDate: new Date().toISOString().split('T')[0],
                rawContent: JSON.stringify(json),
                isActive: true
            }).returning();

            console.log('Inserting roadmapMetadata...')
            const [meta] = await tx.insert(schema.roadmapMetadata).values({
                programId: program.id,
                subtitle: json.meta.subtitle,
                author: json.meta.author,
                totalDays: json.meta.total_days,
                dsaLanguage: json.meta.dsa_language,
                specialization: json.meta.specialization,
                targetRoles: json.meta.target_roles,
                targetSalaryMin: json.meta.target_salary_range_lpa?.min || 0,
                targetSalaryMax: json.meta.target_salary_range_lpa?.max || 0,
                dailySchedule: json.meta.daily_schedule,
                roasts: json.resume_analysis.roasts,
                dsaLanguageDecision: json.resume_analysis.dsa_language_decision,
                specializationDecision: json.resume_analysis.specialization_decision,
            }).returning();

            // Save strengths
            if (json.resume_analysis.strengths.length > 0) {
                await tx.insert(schema.resumeStrengths).values(
                    json.resume_analysis.strengths.map(s => ({
                        metadataId: meta.id,
                        content: s,
                    }))
                );
            }

            console.log(`Inserting ${json.phases.length} phases...`)
            const phaseMap = new Map<string, string>(); // phase_id -> db_id
            for (const p of json.phases) {
                const [phase] = await tx.insert(schema.roadmapPhases).values({
                    programId: program.id,
                    phaseNumber: p.phase_number,
                    title: p.title,
                    description: p.description,
                    theme: p.theme,
                    sortOrder: p.phase_number
                }).returning();
                phaseMap.set(p.phase_id, phase.id);
            }

            console.log(`Inserting ${json.weeks.length} weeks...`)
            const weekMap = new Map<string, string>(); // week_id -> db_id
            for (const w of json.weeks) {
                const [week] = await tx.insert(schema.roadmapWeeks).values({
                    phaseId: phaseMap.get(w.phase_ref),
                    weekNumber: w.week_number,
                    title: w.title,
                    theme: w.theme,
                    colorTheme: w.color_theme,
                    projectMeta: w.project,
                    sortOrder: w.week_number
                }).returning();
                weekMap.set(w.week_id, week.id);
            }

            console.log(`Inserting ${json.days.length} days and their sub-items...`)
            for (const d of json.days) {
                const weekId = weekMap.get(d.week_ref);
                if (!weekId) {
                    console.warn(`Day ${d.day_number} has invalid week_ref: ${d.week_ref}`);
                    continue;
                }

                const [day] = await tx.insert(schema.roadmapDays).values({
                    weekId: weekId,
                    dayNumber: d.day_number.toString(),
                    dayOfWeek: (d.day_number - 1) % 7 + 1,
                    title: d.title,
                    focus: d.context || d.afternoon_task || d.tip || "",
                    sortOrder: d.day_number
                }).returning();

                // 6a. Create Tasks (mapping afternoon_task and categories)
                const tasks = [];
                if (d.afternoon_task) {
                    tasks.push({
                        dayId: day.id,
                        title: d.afternoon_task,
                        taskType: d.is_project_day ? 'build' : 'study',
                        sortOrder: 0
                    });
                }

                if (d.category === 'dsa') {
                    tasks.push({
                        dayId: day.id,
                        title: "DSA High Performance Session",
                        taskType: 'study',
                        sortOrder: 1
                    });
                }

                if (tasks.length > 0) {
                    await tx.insert(schema.roadmapTasks).values(tasks);
                }

                // 6b. Create Topics & Subtopics
                if (d.topics && d.topics.length > 0) {
                    for (let i = 0; i < d.topics.length; i++) {
                        const t = d.topics[i];
                        const [topic] = await tx.insert(schema.roadmapTopics).values({
                            dayId: day.id,
                            topicNumber: t.topic_id,
                            title: t.title,
                            sortOrder: i
                        }).returning();

                        if (t.subtopics && t.subtopics.length > 0) {
                            await tx.insert(schema.roadmapSubtopics).values(
                                t.subtopics.map((s, sIdx) => ({
                                    topicId: topic.id,
                                    content: s,
                                    sortOrder: sIdx
                                }))
                            );
                        }
                    }
                }

                // 6c. Create Knowledge Checks
                if (d.knowledge_check?.questions?.length > 0) {
                    await tx.insert(schema.knowledgeChecks).values(
                        d.knowledge_check.questions.map((q, qIdx) => ({
                            dayId: day.id,
                            questionNumber: qIdx + 1,
                            questionText: q,
                            sortOrder: qIdx
                        }))
                    );
                }

                // 6d. Create LeetCode Problems
                if (d.leetcode_problems && d.leetcode_problems.length > 0) {
                    await tx.insert(schema.leetcodeProblems).values(
                        d.leetcode_problems.map((p, pIdx) => ({
                            dayId: day.id,
                            leetcodeId: p.id,
                            title: p.title,
                            difficulty: p.difficulty,
                            pattern: p.pattern,
                            url: p.url,
                            sortOrder: pIdx
                        }))
                    );
                }
            }

            return program;
        });
    } catch (error) {
        console.error("Database Transaction Error (Beast Mode):", error);
        throw error;
    }
}
