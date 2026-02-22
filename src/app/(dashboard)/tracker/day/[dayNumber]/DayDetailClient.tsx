'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    Clock,
    BookOpen,
    HelpCircle,
    PlayCircle,
    MessageSquare,
    Save,
    ChevronRight,
    Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toggleTaskCompletion, updateDayProgress, updateKCResult, toggleTopicCompletion, updateTaskDetail, updateTopicDetail } from '@/lib/actions/day'

interface DayDetailClientProps {
    initialData: any
    dayNumber: string | number
}

export default function DayDetailClient({ initialData, dayNumber }: DayDetailClientProps) {
    const router = useRouter()
    const [data, setData] = useState<any>(initialData)
    const [saving, setSaving] = useState(false)
    const [kcAnswers, setKcAnswers] = useState<Record<string, { passed: boolean, notes: string }>>(
        initialData.kcs.reduce((acc: any, k: any) => ({
            ...acc,
            [k.id]: {
                passed: k.result?.passed || false,
                notes: k.result?.notes || ''
            }
        }), {})
    )

    const handleToggleItem = async (type: 'task' | 'topic', id: string, currentStatus: boolean) => {
        if (!data) return

        // Optimistic update
        if (type === 'task') {
            const updatedTasks = data.tasks.map((t: any) =>
                t.id === id ? { ...t, completed: !currentStatus } : t
            )
            setData({ ...data, tasks: updatedTasks })
            await toggleTaskCompletion(id, data.progress.id, !currentStatus)
        } else {
            const updatedTopics = data.topics.map((t: any) =>
                t.id === id ? { ...t, completed: !currentStatus } : t
            )
            setData({ ...data, topics: updatedTopics })
            await toggleTopicCompletion(id, data.progress.id, !currentStatus)
        }
    }

    const handleUpdateTimeSpent = async (type: 'task' | 'topic', id: string, minutes: number) => {
        if (!data) return

        // Local state update only (fast)
        if (type === 'task') {
            const updatedTasks = data.tasks.map((t: any) =>
                t.id === id ? { ...t, timeSpent: minutes } : t
            )
            setData({ ...data, tasks: updatedTasks })
            // We could debounce this DB call
            await updateTaskDetail(id, data.progress.id, { timeSpent: minutes })
        } else {
            const updatedTopics = data.topics.map((t: any) =>
                t.id === id ? { ...t, timeSpent: minutes } : t
            )
            setData({ ...data, topics: updatedTopics })
            await updateTopicDetail(id, data.progress.id, { timeSpent: minutes })
        }
    }

    const handleSaveProgress = async () => {
        if (!data) return
        setSaving(true)
        try {
            await updateDayProgress(data.progress.id, {
                hours: data.progress.hoursLogged.toString(),
                notes: data.progress.sessionNotes,
                status: data.progress.status
            })

            for (const [kcId, result] of Object.entries(kcAnswers)) {
                await updateKCResult(kcId, data.progress.id, (result as any).passed, (result as any).notes)
            }
            router.refresh()
        } finally {
            setSaving(false)
        }
    }

    const tasksDone = data.tasks.filter((t: any) => t.completed).length
    const topicsDone = data.topics.filter((t: any) => t.completed).length
    const totalDone = tasksDone + topicsDone
    const totalItems = data.tasks.length + data.topics.length
    const allActionItemsDone = totalDone === totalItems

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">
            <Link href="/tracker" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold uppercase tracking-widest text-xs">Back to Timeline</span>
            </Link>

            <section className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <span className="text-primary font-bold uppercase tracking-widest text-sm">Day {dayNumber} / 60</span>
                        <h1 className="text-4xl md:text-5xl font-syne font-bold tracking-tighter mt-2">
                            {data.day.title}
                        </h1>
                    </motion.div>
                    <div className="flex items-center gap-3">
                        <div className="bg-surface border border-border-subtle p-3 rounded-2xl flex items-center gap-3">
                            <Clock className="w-5 h-5 text-text-secondary" />
                            <input
                                type="number"
                                value={data.progress.hoursLogged}
                                onChange={(e) => setData({
                                    ...data,
                                    progress: { ...data.progress, hoursLogged: e.target.value }
                                })}
                                className="bg-transparent w-12 text-center font-bold text-xl outline-none"
                            />
                            <span className="text-xs font-bold text-text-secondary uppercase">Hrs Total</span>
                        </div>
                        <select
                            value={data.progress.status}
                            onChange={(e) => setData({
                                ...data,
                                progress: { ...data.progress, status: e.target.value }
                            })}
                            className="bg-surface border border-border-subtle p-4 rounded-2xl font-bold text-xs uppercase tracking-widest outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="complete">Complete</option>
                            <option value="skipped">Skipped</option>
                        </select>
                    </div>
                </div>
                <p className="text-lg text-text-secondary max-w-2xl font-lora">
                    {data.day.focus}
                </p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <section className="bg-surface border border-border-subtle rounded-3xl p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-syne font-bold flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-primary" />
                                Action Items
                            </h3>
                            <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full border border-primary/20">
                                {totalDone}/{totalItems} DONE
                            </span>
                        </div>

                        <div className="space-y-4">
                            {[
                                ...data.topics.map((tp: any) => ({ ...tp, itemType: 'topic' })),
                                ...data.tasks.map((tk: any) => ({ ...tk, itemType: 'task' }))
                            ].map((item: any) => (
                                <div
                                    key={`${item.itemType}-${item.id}`}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all space-y-3",
                                        item.completed
                                            ? "bg-success/5 border-success/20 text-text-secondary"
                                            : "bg-[#0c0c0c] border-border-subtle hover:border-primary/10"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => handleToggleItem(item.itemType, item.id, item.completed)}
                                            className="flex-shrink-0"
                                        >
                                            {item.completed ? (
                                                <CheckCircle2 className="w-5 h-5 text-success" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-border-subtle hover:text-primary transition-colors" />
                                            )}
                                        </button>

                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn(
                                                    "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter",
                                                    item.itemType === 'task'
                                                        ? "border-primary/30 text-primary bg-primary/5"
                                                        : "border-secondary/30 text-secondary bg-secondary/5"
                                                )}>
                                                    {item.itemType === 'task' ? (item.taskType || 'build') : 'learn'}
                                                </span>
                                                {item.completed && (
                                                    <span className="text-[9px] font-bold text-success/70 flex items-center gap-1">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {item.itemType === 'task' ? item.timeSpent : '--'} min
                                                    </span>
                                                )}
                                            </div>
                                            <p className={cn("font-bold text-sm truncate", item.completed && "line-through opacity-50")}>
                                                {item.itemType === 'topic' ? `${item.topicNumber}: ${item.title}` : item.title}
                                            </p>
                                        </div>

                                        {!item.completed && (
                                            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                                                <Clock className="w-3 h-3 text-text-secondary" />
                                                <input
                                                    type="number"
                                                    value={item.timeSpent || 0}
                                                    onChange={(e) => handleUpdateTimeSpent(item.itemType, item.id, parseInt(e.target.value))}
                                                    placeholder="min"
                                                    className="bg-transparent w-8 text-center text-xs font-bold outline-none"
                                                />
                                                <span className="text-[10px] text-text-secondary font-bold">m</span>
                                            </div>
                                        )}
                                    </div>

                                    {item.itemType === 'topic' && item.subtopics?.length > 0 && (
                                        <div className="pl-9 space-y-1 pb-1">
                                            {item.subtopics.slice(0, 3).map((sub: any) => (
                                                <div key={sub.id} className="text-[10px] text-text-secondary flex gap-2">
                                                    <span className="text-secondary opacity-50">•</span>
                                                    <span className="truncate">{sub.content}</span>
                                                </div>
                                            ))}
                                            {item.subtopics.length > 3 && (
                                                <p className="text-[9px] text-text-secondary/50 italic">+ {item.subtopics.length - 3} more</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {data.kcs.length > 0 && (
                        <section className="bg-surface border border-border-subtle rounded-3xl p-8 space-y-6 relative overflow-hidden">
                            {!allActionItemsDone && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-8 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-surface border border-border-subtle flex items-center justify-center shadow-2xl">
                                        <Loader2 className="w-8 h-8 text-primary animate-pulse" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-syne font-bold uppercase tracking-tighter">Knowledge Locked</h4>
                                        <p className="text-xs text-text-secondary font-bold max-w-[200px] uppercase tracking-widest leading-loose">
                                            Finish all action items to unlock the daily check.
                                        </p>
                                    </div>
                                </div>
                            )}
                            <h3 className="text-xl font-syne font-bold flex items-center gap-3 text-secondary">
                                <HelpCircle className="w-6 h-6" />
                                Knowledge Check
                            </h3>
                            <div className="space-y-6">
                                {data.kcs.map((kc: any) => (
                                    <div key={kc.id} className="p-6 bg-[#0c0c0c] border border-border-subtle rounded-2xl space-y-4">
                                        <p className="font-bold text-text-primary underline decoration-primary/30 underline-offset-4 leading-relaxed">
                                            Q{kc.questionNumber}: {kc.questionText}
                                        </p>
                                        <textarea
                                            value={kcAnswers[kc.id]?.notes || ''}
                                            onChange={(e) => setKcAnswers({
                                                ...kcAnswers,
                                                [kc.id]: { ...kcAnswers[kc.id], notes: e.target.value }
                                            })}
                                            placeholder="Explain in your own words..."
                                            className="w-full bg-surface border border-border-subtle rounded-xl p-4 text-sm text-text-primary outline-none focus:border-secondary transition-all h-24 italic"
                                        />
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setKcAnswers({
                                                    ...kcAnswers,
                                                    [kc.id]: { ...kcAnswers[kc.id], passed: true }
                                                })}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all",
                                                    kcAnswers[kc.id]?.passed ? "bg-success text-white" : "bg-white/5 text-text-secondary"
                                                )}
                                            >
                                                Passed
                                            </button>
                                            <button
                                                onClick={() => setKcAnswers({
                                                    ...kcAnswers,
                                                    [kc.id]: { ...kcAnswers[kc.id], passed: false }
                                                })}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all",
                                                    !kcAnswers[kc.id]?.passed ? "bg-primary text-white" : "bg-white/5 text-text-secondary"
                                                )}
                                            >
                                                Needs Review
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <div className="space-y-8">
                    {data.topics.length > 0 && (
                        <section className="bg-surface border border-border-subtle rounded-3xl p-6 space-y-6">
                            <h3 className="font-syne font-bold uppercase tracking-widest text-xs">Curated Topics</h3>
                            <div className="space-y-3">
                                {data.topics.map((topic: any) => (
                                    <div key={topic.id} className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 bg-surface-elevated rounded-xl border border-border-subtle group hover:border-primary/30 transition-all">
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                            <span className="text-sm font-bold">{topic.topicNumber}: {topic.title}</span>
                                        </div>
                                        {topic.subtopics.length > 0 && (
                                            <ul className="pl-6 space-y-2">
                                                {topic.subtopics.map((sub: any) => (
                                                    <li key={sub.id} className="text-xs text-text-secondary flex gap-2">
                                                        <span className="text-primary">•</span>
                                                        <span>{sub.content}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="bg-surface border border-border-subtle rounded-3xl p-6 space-y-4">
                        <h3 className="font-syne font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            Session Notes
                        </h3>
                        <textarea
                            value={data.progress.sessionNotes || ''}
                            onChange={(e) => setData({
                                ...data,
                                progress: { ...data.progress, sessionNotes: e.target.value }
                            })}
                            placeholder="Log any breakthroughs or struggles..."
                            className="w-full bg-[#0c0c0c] border border-border-subtle rounded-2xl p-4 text-sm min-h-[200px] outline-none focus:border-primary transition-all font-lora"
                        />
                        <button
                            onClick={handleSaveProgress}
                            disabled={saving}
                            className="w-full bg-surface-elevated border border-border-subtle hover:border-primary text-text-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all group disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Commit Progress
                                </>
                            )}
                        </button>
                    </section>
                </div>
            </div>
        </div>
    )
}
