import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'

// Types for parsing results
export interface ParsedRoadmapJson {
    title: string;
    subtitle?: string;
    target_package?: string;
    daily_commitment?: string;
    total_days?: number;
    resume_analysis?: {
        blunt_truth: string;
        gaps: [string, string, string][];
        strengths: string[];
    };
    execution_plan?: {
        daily_blocks: { block: string; focus: string }[];
    };
    months: {
        month: number;
        title: string;
        objective: string;
        weeks: {
            week: number;
            title: string;
            overview: string;
            days?: {
                day: string | number;
                title: string;
                why_it_matters: string;
                topics?: { id: string; title: string; points: string[] }[];
                knowledge_check?: string[];
                tasks?: string[];
            }[];
            weekly_schedule?: {
                day: string;
                focus: string;
                tasks: string[];
                hours: string;
            }[];
            topics?: { id: string; title: string; points: string[] }[];
            knowledge_check?: string[];
        }[];
    }[];
    end_goals?: {
        skills: { skill: string; outcome: string }[];
        closing_message?: string;
    };
}

export interface ParsedRoadmap {
    title: string
    description: string
    months: ParsedMonth[]
}

export interface ParsedMonth {
    title: string
    monthNumber: number | string
    objective: string
    outcome: string
    weeks: ParsedWeek[]
}

export interface ParsedWeek {
    weekNumber: number | string
    title: string
    goal: string
    overview?: string
    days: ParsedDay[]
}

export interface ParsedDay {
    dayNumber: string | number
    dayOfWeek: number
    title: string
    focus: string
    tasks: string[]
    topics: ParsedTopic[]
    knowledgeChecks: string[]
}

export interface ParsedTopic {
    topicNumber: string
    title: string
    subtopics: string[]
}

export function parseRoadmapText(text: string): ParsedRoadmap {
    const roadmap: ParsedRoadmap = {
        title: "60-Day Beast Mode Roadmap",
        description: "Intensive Senior React Engineer Roadmap designed for Raghav Sethi.",
        months: []
    }

    // 1. Identify Months
    const monthBlocks = text.split(/🗓\s*MONTH\s*(\d+)/gi).slice(1);

    for (let i = 0; i < monthBlocks.length; i += 2) {
        const monthNum = parseInt(monthBlocks[i]);
        const monthContent = monthBlocks[i + 1];

        // Extract Month Objective
        const objectiveMatch = monthContent.match(/MONTH\s*\d+\s*OBJECTIVE([\s\S]*?)(?=📅\s*WEEK|🗓\s*MONTH|$)/i);
        const monthObjective = objectiveMatch ? objectiveMatch[1].trim() : "";

        const month: ParsedMonth = {
            title: `Month ${monthNum}`,
            monthNumber: monthNum,
            objective: monthObjective,
            outcome: "High performance mastery",
            weeks: []
        };

        // 2. Identify Weeks within Month
        const weekBlocks = monthContent.split(/📅\s*WEEK\s*(\d+)/gi).slice(1);
        for (let j = 0; j < weekBlocks.length; j += 2) {
            const weekNum = parseInt(weekBlocks[j]);
            const weekContent = weekBlocks[j + 1];

            // Extract Week Goal (The text immediately after the header before first DAY or TOPIC)
            const weekGoalMatch = weekContent.match(/^([\s\S]*?)(?=DAY\s*\d+|TOPIC\s*\d+\.\d+|Day\s+Focus\s+Area|$)/i);
            const weekGoal = weekGoalMatch ? weekGoalMatch[1].trim() : "";

            const week: ParsedWeek = {
                weekNumber: weekNum,
                title: `Week ${weekNum}`,
                goal: weekGoal,
                days: []
            };

            // 3. Identify Days within Week
            // Check if it's a "standard" format (DAY X headers) or a "table" format (Mon-Sun)
            const hasDayHeaders = /(?:DAY|DAYS)\s*\d+/.test(weekContent);

            if (hasDayHeaders) {
                const dayBlocks = weekContent.split(/(?:DAY|DAYS)\s*(\d+(?:-\d+)?)\s*[:—\-]*/gi).slice(1);
                for (let k = 0; k < dayBlocks.length; k += 2) {
                    const dayLabel = dayBlocks[k];
                    const dayContent = dayBlocks[k + 1];

                    const dayNumbers = dayLabel.includes('-')
                        ? dayLabel.split('-').map(n => parseInt(n))
                        : [parseInt(dayLabel)];

                    for (const dNum of dayNumbers) {
                        const day: ParsedDay = {
                            dayNumber: dNum,
                            dayOfWeek: ((dNum - 1) % 7) + 1,
                            title: `Day ${dNum}`,
                            focus: "",
                            tasks: [],
                            topics: [],
                            knowledgeChecks: []
                        };

                        const focusMatch = dayContent.match(/Focus Area:?\s*(.*)/i);
                        day.focus = focusMatch ? focusMatch[1].trim() : "";

                        if (!day.focus) {
                            const firstLine = dayContent.trim().split('\n')[0].trim();
                            if (firstLine && !firstLine.includes('TOPIC') && !firstLine.includes('✅')) {
                                day.focus = firstLine.replace(/^[[:punct:]\s]+/, '');
                            }
                        }

                        // Topics - support "TOPIC 1.1" and "TOPIC:"
                        const topicBlocks = dayContent.split(/TOPIC\s*(?:(\d+(?:\.\d+)?)|:)\s*[:—\-]*\s*(.*)/gi).slice(1);
                        for (let l = 0; l < topicBlocks.length; l += 3) {
                            const tNum = topicBlocks[l] || `${dNum}.${day.topics.length + 1}`;
                            const tTitle = topicBlocks[l + 1].trim();
                            const tContent = topicBlocks[l + 2];

                            const subtopicLines = tContent.split('\n')
                                .map(line => line.trim())
                                .filter(line => line.length > 0 && !line.includes('✅ KNOWLEDGE CHECK') && !line.startsWith('TOPIC'));

                            const subtopics = subtopicLines.filter(line =>
                                line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || (line.length < 250 && line.length > 5)
                            ).map(s => s.replace(/^[•\-\*]\s*/, '').trim());

                            if (tTitle && !tTitle.toLowerCase().includes('breakdown')) {
                                day.topics.push({ topicNumber: tNum, title: tTitle, subtopics });
                            }
                        }

                        // Tasks
                        const taskMatch = dayContent.match(/(?:Daily Tasks|Tasks:)([\s\S]*?)(?=✅|TOPIC|$)/i);
                        if (taskMatch) {
                            day.tasks = taskMatch[1].split('\n')
                                .map(t => t.trim())
                                .filter(t => t.length > 5 && !t.includes('Hrs') && !t.toLowerCase().includes('focus area'))
                                .map(t => t.replace(/^[•\-\*\d\.\s]+/, '').trim());
                        }

                        // KCs
                        const kcMatch = dayContent.match(/✅\s*KNOWLEDGE CHECK([\s\S]*?)(?=DAY|WEEK|MONTH|$)/i);
                        if (kcMatch) {
                            day.knowledgeChecks = kcMatch[1].split(/Q\d+[:\.]?/i)
                                .slice(1)
                                .map(q => q.trim().split('\n')[0])
                                .filter(Boolean);
                        }
                        week.days.push(day);
                    }
                }
            } else {
                // FALLBACK: Table-style parsing (typically Mon-Sun)
                const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                const startDay = (weekNum - 1) * 7 + 1;

                // Extract broad Topics and KCs for the whole week to share across days
                const weekTopics: ParsedTopic[] = [];
                const wTopicBlocks = weekContent.split(/TOPIC\s*[:—\-]*\s*(.*)/gi).slice(1);
                for (let l = 0; l < wTopicBlocks.length; l += 2) {
                    const tTitle = wTopicBlocks[l].trim();
                    const tContent = wTopicBlocks[l + 1].split(/(?=TOPIC|✅|Day\s+Focus\s+Area|$)/i)[0];
                    const subtopics = tContent.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0 && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')))
                        .map(s => s.replace(/^[•\-\*]\s*/, '').trim());
                    if (tTitle && !tTitle.includes('Breakdown')) {
                        weekTopics.push({ topicNumber: `${weekNum}.${weekTopics.length + 1}`, title: tTitle, subtopics });
                    }
                }

                const weekKCs: string[] = [];
                const wKcMatch = weekContent.match(/✅\s*KNOWLEDGE CHECK([\s\S]*?)(?=Day\s+Focus\s+Area|Hrs|$)/i);
                if (wKcMatch) {
                    weekKCs.push(...wKcMatch[1].split(/Q\d+[:\.]?/i)
                        .slice(1)
                        .map(q => q.trim().split('\n')[0])
                        .filter(Boolean));
                }

                for (let k = 0; k < 7; k++) {
                    const dNum = startDay + k;
                    const dName = daysOfWeek[k];

                    // Find the section for this day in the table
                    // We look for the day name and capture until the next day name or end
                    const dayRegex = new RegExp(`${dName}[\\s\\S]*?(?=${daysOfWeek[k + 1] || 'Hrs'}|$)`, 'i');
                    const dayMatch = weekContent.match(dayRegex);

                    if (dayMatch) {
                        const dayBlock = dayMatch[0];
                        const lines = dayBlock.split('\n').map(l => l.trim()).filter(Boolean).slice(1);

                        const focus = lines[0] || "";
                        const tasks = lines.slice(1).filter(l => l.length > 5 && !l.includes('8h') && !l.includes('16h'));

                        week.days.push({
                            dayNumber: dNum,
                            dayOfWeek: k + 1,
                            title: focus || `Day ${dNum}`,
                            focus: focus,
                            tasks: tasks,
                            topics: k === 0 ? weekTopics : [], // Assign topics to Mon
                            knowledgeChecks: k === 0 ? weekKCs : []  // Assign KCs to Mon or distribute? Mon is fine.
                        });
                    }
                }
            }
            month.weeks.push(week);
        }
        roadmap.months.push(month);
    }

    return roadmap;
}


export function parseRoadmapJson(json: ParsedRoadmapJson): ParsedRoadmap {
    const roadmap: ParsedRoadmap = {
        title: json.title,
        description: json.subtitle || "",
        months: []
    };

    json.months.forEach(m => {
        const month: ParsedMonth = {
            monthNumber: m.month,
            title: m.title,
            objective: m.objective,
            outcome: "", // Optional in JSON
            weeks: []
        };

        m.weeks.forEach(w => {
            const week: ParsedWeek = {
                weekNumber: w.week,
                title: w.title,
                goal: w.overview || "",
                overview: w.overview,
                days: []
            };

            // Days - from 'days' array
            if (w.days) {
                w.days.forEach(d => {
                    week.days.push({
                        dayNumber: d.day.toString(),
                        dayOfWeek: (parseInt(d.day.toString()) - 1) % 7 + 1,
                        title: d.title,
                        focus: d.why_it_matters,
                        tasks: d.tasks || [],
                        topics: d.topics?.map(t => ({
                            topicNumber: t.id,
                            title: t.title,
                            subtopics: t.points
                        })) || [],
                        knowledgeChecks: d.knowledge_check || []
                    });
                });
            }

            // Sync with weekly_schedule if present
            if (w.weekly_schedule) {
                const dayMap = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                w.weekly_schedule.forEach(s => {
                    const dayOfWeekIdx = dayMap.indexOf(s.day);
                    const dayOfWeek = dayOfWeekIdx === -1 ? 1 : dayOfWeekIdx + 1;

                    const mNum = parseInt(m.month.toString());
                    const wNum = parseInt(w.week.toString());
                    const dayNum = isNaN(mNum) || isNaN(wNum) ? 1 : (mNum - 1) * 28 + (wNum - 1) * 7 + dayOfWeek;

                    let existingDay = week.days.find(d => d.dayNumber.toString() === dayNum.toString());

                    if (!existingDay) {
                        existingDay = {
                            dayNumber: dayNum.toString(),
                            dayOfWeek,
                            title: s.focus,
                            focus: s.focus,
                            tasks: s.tasks,
                            topics: [],
                            knowledgeChecks: []
                        };
                        week.days.push(existingDay);
                    } else {
                        // Merge tasks, avoiding duplicates
                        const combinedTasks = [...new Set([...existingDay.tasks, ...s.tasks])];
                        existingDay.tasks = combinedTasks;
                    }
                });
            }

            // Week-level topics/KCs (apply to Day 1 of the week if days were empty or missing them)
            if (week.days.length > 0) {
                const firstDay = [...week.days].sort((a, b) => parseInt(a.dayNumber.toString()) - parseInt(b.dayNumber.toString()))[0];
                if (w.topics && (firstDay.topics?.length === 0)) {
                    firstDay.topics = w.topics.map(t => ({
                        topicNumber: t.id,
                        title: t.title,
                        subtopics: t.points
                    }));
                }
                if (w.knowledge_check && (firstDay.knowledgeChecks?.length === 0)) {
                    firstDay.knowledgeChecks = w.knowledge_check;
                }
            }

            month.weeks.push(week);
        });

        roadmap.months.push(month);
    });

    return roadmap;
}

export async function saveParsedRoadmapToDb(userId: string, roadmap: ParsedRoadmap, rawText: string, fileUrl: string, jsonMetadata?: ParsedRoadmapJson) {
    try {
        return await db.transaction(async (tx: any) => {
            // 1. Create Program (Set all existing to inactive)
            await tx.update(schema.roadmapPrograms).set({ isActive: false });

            const [program] = await tx.insert(schema.roadmapPrograms).values({
                userId,
                title: roadmap.title,
                description: roadmap.description,
                totalDays: jsonMetadata?.total_days || 60,
                startDate: new Date().toISOString().split('T')[0],
                rawContent: rawText,
                fileUrl: fileUrl,
                isActive: true
            }).returning();

            // 1b. Save rich metadata if provided
            if (jsonMetadata) {
                const [meta] = await tx.insert(schema.roadmapMetadata).values({
                    programId: program.id,
                    subtitle: jsonMetadata.subtitle,
                    targetPackage: jsonMetadata.target_package,
                    dailyCommitment: jsonMetadata.daily_commitment,
                    totalDays: jsonMetadata.total_days,
                    bluntTruth: jsonMetadata.resume_analysis?.blunt_truth,
                }).returning();

                if (jsonMetadata.resume_analysis?.gaps) {
                    await tx.insert(schema.resumeGaps).values(
                        jsonMetadata.resume_analysis.gaps.map(g => ({
                            metadataId: meta.id,
                            area: g[0],
                            whatResumeShows: g[1],
                            brutalGap: g[2],
                        }))
                    );
                }

                if (jsonMetadata.resume_analysis?.strengths) {
                    await tx.insert(schema.resumeStrengths).values(
                        jsonMetadata.resume_analysis.strengths.map(s => ({
                            metadataId: meta.id,
                            content: s,
                        }))
                    );
                }

                if (jsonMetadata.execution_plan?.daily_blocks) {
                    await tx.insert(schema.executionBlocks).values(
                        jsonMetadata.execution_plan.daily_blocks.map(b => ({
                            metadataId: meta.id,
                            block: b.block,
                            focus: b.focus,
                        }))
                    );
                }

                if (jsonMetadata.end_goals?.skills) {
                    await tx.insert(schema.endGoals).values(
                        jsonMetadata.end_goals.skills.map(s => ({
                            metadataId: meta.id,
                            skill: s.skill,
                            outcome: s.outcome,
                        }))
                    );
                }
            }

            // Data buckets for bulk inserts
            const monthsToInsert: any[] = [];
            const weeksToInsert: any[] = [];
            const daysToInsert: any[] = [];

            // 2. Prepare Month data
            for (const m of roadmap.months) {
                monthsToInsert.push({
                    programId: program.id,
                    monthNumber: parseInt(m.monthNumber.toString()),
                    title: m.title,
                    objective: m.objective,
                    outcome: m.outcome,
                    sortOrder: parseInt(m.monthNumber.toString())
                });
            }

            const insertedMonths = await tx.insert(schema.roadmapMonths).values(monthsToInsert).returning();

            // 3. Prepare Week data
            for (let i = 0; i < roadmap.months.length; i++) {
                const m = roadmap.months[i];
                const insertedMonth = insertedMonths[i];
                for (const w of m.weeks) {
                    weeksToInsert.push({
                        monthId: insertedMonth.id,
                        weekNumber: parseInt(w.weekNumber.toString()),
                        title: w.title,
                        goal: w.goal,
                        sortOrder: parseInt(w.weekNumber.toString()),
                        // Temporary reference to the ParsedWeek object to find days later
                        _parsedWeek: w
                    });
                }
            }

            const insertedWeeks = await tx.insert(schema.roadmapWeeks).values(
                weeksToInsert.map(({ _parsedWeek, ...w }) => w)
            ).returning();

            // 4. Prepare Day data
            for (let i = 0; i < weeksToInsert.length; i++) {
                const w = weeksToInsert[i]._parsedWeek;
                const insertedWeek = insertedWeeks[i];
                for (const d of w.days) {
                    daysToInsert.push({
                        weekId: insertedWeek.id,
                        dayNumber: d.dayNumber,
                        dayOfWeek: d.dayOfWeek,
                        title: d.focus || d.title,
                        focus: d.focus,
                        sortOrder: parseInt(d.dayNumber.toString()),
                        _parsedDay: d
                    });
                }
            }

            const insertedDays = await tx.insert(schema.roadmapDays).values(
                daysToInsert.map(({ _parsedDay, ...d }) => d)
            ).returning();

            // 5. Build level data (Tasks, Topics, Knowledge Checks)
            const tasksToInsert: any[] = [];
            const topicsToInsert: any[] = [];
            const checksToInsert: any[] = [];

            for (let i = 0; i < daysToInsert.length; i++) {
                const d = daysToInsert[i]._parsedDay;
                const insertedDay = insertedDays[i];

                // Tasks
                d.tasks.forEach((taskTitle: string, idx: number) => {
                    tasksToInsert.push({
                        dayId: insertedDay.id,
                        title: taskTitle,
                        sortOrder: idx,
                        taskType: taskTitle.toLowerCase().includes('build') ? 'build' : 'study'
                    });
                });

                // Topics
                d.topics.forEach((t: ParsedTopic, tIdx: number) => {
                    topicsToInsert.push({
                        dayId: insertedDay.id,
                        topicNumber: t.topicNumber,
                        title: t.title,
                        sortOrder: tIdx,
                        _parsedTopic: t
                    });
                });

                // Checks
                d.knowledgeChecks.forEach((qText: string, qIdx: number) => {
                    checksToInsert.push({
                        dayId: insertedDay.id,
                        questionNumber: qIdx + 1,
                        questionText: qText,
                        sortOrder: qIdx
                    });
                });
            }

            // Bulk Insert Tasks and Checks (No children)
            if (tasksToInsert.length > 0) await tx.insert(schema.roadmapTasks).values(tasksToInsert);
            if (checksToInsert.length > 0) await tx.insert(schema.knowledgeChecks).values(checksToInsert);

            // Bulk Insert Topics and then Subtopics
            if (topicsToInsert.length > 0) {
                const insertedTopics = await tx.insert(schema.roadmapTopics).values(
                    topicsToInsert.map(({ _parsedTopic, ...t }) => t)
                ).returning();

                const subtopicsToInsert: any[] = [];
                for (let i = 0; i < topicsToInsert.length; i++) {
                    const t = topicsToInsert[i]._parsedTopic;
                    const insertedTopic = insertedTopics[i];
                    t.subtopics.forEach((sContent: string, sIdx: number) => {
                        subtopicsToInsert.push({
                            topicId: insertedTopic.id,
                            content: sContent,
                            sortOrder: sIdx
                        });
                    });
                }
                if (subtopicsToInsert.length > 0) await tx.insert(schema.roadmapSubtopics).values(subtopicsToInsert);
            }

            return program;
        });
    } catch (error) {
        console.error("Database Transaction Error:", error);
        throw error;
    }
}
