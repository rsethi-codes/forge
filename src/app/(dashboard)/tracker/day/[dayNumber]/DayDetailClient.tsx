'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { toast } from 'react-hot-toast'
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    BookOpen,
    HelpCircle,
    MessageSquare,
    Save,
    Loader2,
    Search,
    MessageCircleQuestion,
    Timer,
    Zap,
    ExternalLink,
    Code2,
    Activity
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toggleTaskCompletion, updateDayProgress, updateKCResult, toggleTopicCompletion, updateTaskDetail, updateTopicDetail } from '@/lib/actions/day'
import QnADrawer, { type DrawerTopic } from '@/components/QnADrawer'
import QnASearchModal from '@/components/QnASearchModal'
import TopicTimer, { type TimerResult, type TimerHandle } from '@/components/TopicTimer'
import type { QnAEntry } from '@/lib/actions/qna'

interface DayDetailClientProps {
    initialData: any
    dayNumber: string | number
    initialQnAs?: Record<string, QnAEntry[]>   // topicId -> qnas, '' key = day-level
}

export default function DayDetailClient({ initialData, dayNumber, initialQnAs = {} }: DayDetailClientProps) {
    const router = useRouter()
    const [data, setData] = useState<any>(initialData)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
    const [aiCheckingIds, setAiCheckingIds] = useState<Set<string>>(new Set())

    // Ref map: itemType_id -> TimerHandle
    const timerRefs = useRef<Map<string, TimerHandle>>(new Map())

    // Q&A drawer state
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [drawerDefaultTopicId, setDrawerDefaultTopicId] = useState<string | null>(null)

    // Search modal state
    const [searchOpen, setSearchOpen] = useState(false)

    // ── Helper: mark day as in_progress (silently, no toast) ─────────────────
    const markInProgress = async (currentStatus: string) => {
        if (currentStatus === 'not_started') {
            const updated = { ...data, progress: { ...data.progress, status: 'in_progress' } }
            setData(updated)
            try {
                await updateDayProgress(data.progress.id, {
                    hours: data.progress.hoursLogged?.toString() ?? '0',
                    notes: data.progress.sessionNotes ?? '',
                    status: 'in_progress'
                })
            } catch { /* non-critical */ }
        }
    }

    const celebrateMilestones = (milestones: any[]) => {
        if (!milestones || milestones.length === 0) return
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff3131', '#ffffff', '#00d68f']
        })
        milestones.forEach(m => {
            toast.success(
                (t: any) => (
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-primary">Milestone Unlocked: {m.title}</span>
                        <span className="text-sm">Reward: {m.reward}</span>
                    </div>
                ),
                { duration: 5000, icon: '🏆' }
            )
        })
    }

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
        if (togglingIds.has(id)) return  // prevent double-click

        // Stop any running timer for this item first
        if (!currentStatus) {
            const timerKey = `${type}_${id}`
            const timerHandle = timerRefs.current.get(timerKey)
            if (timerHandle && timerHandle.getState() !== 'idle') {
                timerHandle.stopNow()
                await new Promise(r => setTimeout(r, 150))
            }
        }

        // Optimistic UI update
        setTogglingIds(prev => new Set(prev).add(id))
        if (type === 'task') {
            setData((d: any) => ({ ...d, tasks: d.tasks.map((t: any) => t.id === id ? { ...t, completed: !currentStatus } : t) }))
        } else {
            setData((d: any) => ({ ...d, topics: d.topics.map((t: any) => t.id === id ? { ...t, completed: !currentStatus } : t) }))
        }

        try {
            // Auto bump day status when first item is started
            await markInProgress(data.progress.status)

            let response
            if (type === 'task') {
                response = await toggleTaskCompletion(id, data.progress.id, !currentStatus)
            } else {
                response = await toggleTopicCompletion(id, data.progress.id, !currentStatus)
            }

            if (response?.unlockedMilestones) {
                celebrateMilestones(response.unlockedMilestones)
            }

            // If all done → auto-mark complete
            const updatedTasks = type === 'task'
                ? data.tasks.map((t: any) => t.id === id ? { ...t, completed: !currentStatus } : t)
                : data.tasks
            const updatedTopics = type === 'topic'
                ? data.topics.map((t: any) => t.id === id ? { ...t, completed: !currentStatus } : t)
                : data.topics
            const allDone = updatedTasks.every((t: any) => t.completed) && updatedTopics.every((t: any) => t.completed)
            if (allDone && updatedTasks.length + updatedTopics.length > 0) {
                setData((d: any) => ({ ...d, progress: { ...d.progress, status: 'complete' } }))
                try {
                    await updateDayProgress(data.progress.id, {
                        hours: data.progress.hoursLogged?.toString() ?? '0',
                        notes: data.progress.sessionNotes ?? '',
                        status: 'complete'
                    })
                } catch { /* non-critical */ }
            }
        } finally {
            setTogglingIds(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
        }
    }

    const handleTimerStop = async (type: 'task' | 'topic', id: string, result: TimerResult) => {
        if (!data) return
        if (type === 'task') {
            const existing = data.tasks.find((t: any) => t.id === id)
            const prevGross = existing?.timeSpent ?? 0
            const prevNet = existing?.timeSpentNet ?? 0
            const newGross = prevGross + result.grossSeconds
            const newNet = prevNet + result.netSeconds
            setData((d: any) => ({
                ...d,
                tasks: d.tasks.map((t: any) =>
                    t.id === id ? { ...t, timeSpent: newGross, timeSpentNet: newNet } : t
                ),
                progress: { ...d.progress, hoursLogged: +((newNet / 3600)).toFixed(2) }
            }))
            await updateTaskDetail(id, data.progress.id, {
                timeSpent: newGross,
                timeSpentNet: newNet,
                startedAt: result.startedAt,
                timerSessions: result.sessions,
            })
        } else {
            const existing = data.topics.find((t: any) => t.id === id)
            const prevGross = existing?.timeSpent ?? 0
            const prevNet = existing?.timeSpentNet ?? 0
            const newGross = prevGross + result.grossSeconds
            const newNet = prevNet + result.netSeconds
            setData((d: any) => ({
                ...d,
                topics: d.topics.map((t: any) =>
                    t.id === id ? { ...t, timeSpent: newGross, timeSpentNet: newNet } : t
                ),
                progress: { ...d.progress, hoursLogged: +((newNet / 3600)).toFixed(2) }
            }))
            await updateTopicDetail(id, data.progress.id, {
                timeSpent: newGross,
                timeSpentNet: newNet,
                startedAt: result.startedAt,
                timerSessions: result.sessions,
            })
        }
    }

    const [aiFeedback, setAiFeedback] = useState<Record<string, any>>({})

    const handleAICheck = async (kcId: string) => {
        if (!data) return
        const result = kcAnswers[kcId]
        if (!result?.notes) {
            toast.error("Write your answer first!")
            return
        }

        setAiCheckingIds(prev => new Set(prev).add(kcId))
        try {
            const kcResp = await updateKCResult(kcId, data.progress.id, result.passed, result.notes, result.notes)
            if (kcResp?.feedback) {
                setAiFeedback(prev => ({ ...prev, [kcId]: kcResp.feedback }))
                toast.success("AI Evaluation Complete")
            }
            if (kcResp?.unlockedMilestones) {
                celebrateMilestones(kcResp.unlockedMilestones)
            }
            router.refresh()
        } catch (err) {
            toast.error("AI Evaluation failed. The forge is busy.")
        } finally {
            setAiCheckingIds(prev => {
                const next = new Set(prev)
                next.delete(kcId)
                return next
            })
        }
    }

    const handleSaveProgress = async () => {
        if (!data) return
        setSaving(true)
        try {
            const resp = await updateDayProgress(data.progress.id, {
                hours: data.progress.hoursLogged.toString(),
                notes: data.progress.sessionNotes,
                reflection: data.progress.reflection,
                status: data.progress.status
            })
            if (resp?.unlockedMilestones) {
                celebrateMilestones(resp.unlockedMilestones)
            }

            for (const [kcId, result] of Object.entries(kcAnswers)) {
                const kcResp = await updateKCResult(kcId, data.progress.id, (result as any).passed, (result as any).notes)
                if (kcResp?.unlockedMilestones) {
                    celebrateMilestones((kcResp as any).unlockedMilestones)
                }
            }
            router.refresh()
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } finally {
            setSaving(false)
        }
    }

    // Derived counts
    const tasksDone = data.tasks.filter((t: any) => t.completed).length
    const topicsDone = data.topics.filter((t: any) => t.completed).length
    const totalDone = tasksDone + topicsDone
    const totalItems = data.tasks.length + data.topics.length
    const allTasksDone = data.tasks.length === 0 || tasksDone === data.tasks.length

    // Live status derived from data (not editable select)
    const liveStatus: string = (() => {
        if (data.progress.status === 'complete') return 'complete'
        if (data.progress.status === 'skipped') return 'skipped'
        if (data.progress.status === 'in_progress') return 'in_progress'
        return 'not_started'
    })()

    const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
        not_started: { label: 'Not Started', color: 'text-text-secondary border-border-subtle bg-[#0c0c0c]', dot: 'bg-text-secondary/40' },
        in_progress: { label: 'In Progress', color: 'text-amber-400 border-amber-500/30 bg-amber-500/5', dot: 'bg-amber-400 animate-pulse' },
        complete: { label: 'Complete', color: 'text-success border-success/30 bg-success/5', dot: 'bg-success' },
        skipped: { label: 'Skipped', color: 'text-text-secondary/50 border-border-subtle bg-[#0c0c0c]', dot: 'bg-text-secondary/30' },
    }
    const sc = statusConfig[liveStatus] ?? statusConfig.not_started

    // Total net time
    const totalNetSeconds = [
        ...data.tasks.map((t: any) => t.timeSpentNet ?? 0),
        ...data.topics.map((t: any) => t.timeSpentNet ?? 0)
    ].reduce((a: number, b: number) => a + b, 0)
    const displayHours = Math.floor(totalNetSeconds / 3600)
    const displayMins = Math.floor((totalNetSeconds % 3600) / 60)
    const hoursLabel = displayHours > 0
        ? `${displayHours}h ${displayMins}m`
        : displayMins > 0 ? `${displayMins}m` : '0m'

    // Build drawer topics list
    const drawerTopics: DrawerTopic[] = [
        ...data.topics.map((topic: any): DrawerTopic => ({
            id: topic.id,
            title: topic.title,
            topicNumber: topic.topicNumber,
            qnas: initialQnAs[topic.id] ?? [],
        })),
        {
            id: null,
            title: 'General',
            qnas: initialQnAs[''] ?? [],
        }
    ]

    const totalQnAs = Object.values(initialQnAs).flat().length

    const openDrawerForTopic = (topicId: string | null) => {
        setDrawerDefaultTopicId(topicId)
        setDrawerOpen(true)
    }

    return (
        <>
            {/* Q&A Drawer */}
            <QnADrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                dayId={data.day.id}
                dayTitle={data.day.title}
                dayNumber={dayNumber}
                topics={drawerTopics}
                defaultTopicId={drawerDefaultTopicId}
            />

            {/* Search Modal */}
            <QnASearchModal
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
                onSelect={(result) => {
                    const resultDay = (result as any).dayNumber
                    if (resultDay && String(resultDay) !== String(dayNumber)) {
                        router.push(`/tracker/day/${resultDay}`)
                    } else {
                        openDrawerForTopic((result as any).topicId ?? null)
                    }
                }}
            />

            <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">

                {/* Top nav row */}
                <div className="flex items-center justify-between">
                    <Link href="/tracker" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold uppercase tracking-widest text-xs">Back to Timeline</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 text-text-secondary hover:text-text-primary text-xs font-bold uppercase tracking-widest transition-all"
                        >
                            <Search className="w-3.5 h-3.5" />
                            Search Q&amp;As
                        </button>
                        <button
                            onClick={() => { setDrawerDefaultTopicId(drawerTopics[0]?.id ?? null); setDrawerOpen(true) }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/25 hover:border-violet-500/50 text-violet-400 text-xs font-bold uppercase tracking-widest transition-all"
                        >
                            <MessageCircleQuestion className="w-3.5 h-3.5" />
                            Mind Q&amp;As
                            {totalQnAs > 0 && (
                                <span className="bg-violet-500/30 text-violet-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{totalQnAs}</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Day header */}
                <section className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <span className="text-primary font-bold uppercase tracking-widest text-sm">Day {dayNumber} / 60</span>
                            <h1 className="text-4xl md:text-5xl font-syne font-bold tracking-tighter mt-2">
                                {data.day.title}
                            </h1>
                        </motion.div>
                        <div className="flex items-center gap-3">
                            {/* Active time */}
                            <div className="bg-surface border border-border-subtle px-4 py-3 rounded-2xl flex items-center gap-3">
                                <Timer className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="font-mono font-black text-lg text-emerald-400 leading-none">{hoursLabel}</span>
                                    <span className="text-[9px] font-bold text-text-secondary/50 uppercase tracking-widest">active time</span>
                                </div>
                            </div>
                            {/* Smart Live Status Badge (replaces select) */}
                            <div className={cn(
                                "flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all",
                                sc.color
                            )}>
                                <Activity className="w-4 h-4" />
                                <div className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                                {sc.label}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <p className="text-lg text-text-secondary max-w-2xl font-lora">
                            {data.day.focus}
                        </p>
                        <a
                            href={`${(data.metadata?.docsBaseUrl || 'https://rsethi-codes.github.io/skill-up-docs-26/full-stack-plan').replace(/\/$/, '')}/day-${dayNumber}-plan.html`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0 active:scale-95"
                        >
                            <BookOpen className="w-4 h-4" />
                            Master Reference
                        </a>
                    </div>
                </section>

                {/* ── Topics overview strip ── */}
                {data.topics.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/60">Curated Topics</h3>
                            <button
                                onClick={() => { setDrawerDefaultTopicId(drawerTopics[0]?.id ?? null); setDrawerOpen(true) }}
                                className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-wider flex items-center gap-1"
                            >
                                <MessageCircleQuestion className="w-3 h-3" />
                                Manage Q&amp;As →
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {data.topics.map((topic: any) => {
                                const topicQnACount = (initialQnAs[topic.id] ?? []).length
                                return (
                                    <div
                                        key={topic.id}
                                        className="bg-surface border border-border-subtle rounded-2xl p-4 space-y-2 hover:border-primary/20 transition-all"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                                <span className="text-sm font-bold truncate">Topic {topic.topicNumber?.split('_t')[1] ?? topic.topicNumber ?? ''}: {topic.title}</span>
                                            </div>
                                            <button
                                                onClick={() => openDrawerForTopic(topic.id)}
                                                className={cn(
                                                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex-shrink-0',
                                                    topicQnACount > 0
                                                        ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25 hover:border-violet-500/50'
                                                        : 'bg-white/5 text-text-secondary border border-transparent hover:border-white/10 hover:text-text-primary'
                                                )}
                                            >
                                                <MessageCircleQuestion className="w-3 h-3" />
                                                {topicQnACount > 0 ? `${topicQnACount} Q&As` : 'Add Q&A'}
                                            </button>
                                        </div>
                                        {topic.subtopics.length > 0 && (
                                            <ul className="pl-4 space-y-1.5">
                                                {topic.subtopics.map((sub: any) => (
                                                    <li key={sub.id} className="text-[11px] text-text-secondary flex gap-2">
                                                        <span className="text-primary mt-0.5">•</span>
                                                        <span>{sub.content}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* ── Main 2-col grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left col: Action Items + KC */}
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
                                ].map((item: any) => {
                                    const isToggling = togglingIds.has(item.id)
                                    return (
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
                                                    disabled={isToggling}
                                                    className="flex-shrink-0 transition-transform active:scale-90 disabled:cursor-not-allowed"
                                                    title={item.completed ? 'Mark incomplete' : 'Mark complete'}
                                                >
                                                    {isToggling ? (
                                                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                                    ) : item.completed ? (
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
                                                        {item.completed && (item.timeSpentNet ?? 0) > 0 && (
                                                            <span className="text-[9px] font-bold text-emerald-400/70 flex items-center gap-1">
                                                                ✓ {Math.floor((item.timeSpentNet ?? 0) / 60)}m active
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={cn("font-bold text-sm truncate", item.completed && "line-through opacity-50")}>
                                                        {item.itemType === 'topic' ? `Topic ${item.topicNumber?.split('_t')[1] ?? item.topicNumber ?? ''}: ${item.title}` : `Task ${item.taskNumber?.split('_t')[1] ?? item.taskNumber ?? ''}: ${item.title}`}
                                                    </p>
                                                </div>

                                                {!item.completed && (
                                                    <TopicTimer
                                                        ref={(handle) => {
                                                            const key = `${item.itemType}_${item.id}`
                                                            if (handle) timerRefs.current.set(key, handle)
                                                            else timerRefs.current.delete(key)
                                                        }}
                                                        id={item.id}
                                                        type={item.itemType}
                                                        progressId={data.progress.id}
                                                        initialStatus={item.timerStatus}
                                                        initialSessions={item.timerSessions}
                                                        initialStartedAt={item.startedAt}
                                                        compact
                                                        storedGross={item.timeSpent ?? 0}
                                                        storedNet={item.timeSpentNet ?? 0}
                                                        onStart={() => markInProgress(data.progress.status)}
                                                        onStop={(result) => handleTimerStop(item.itemType, item.id, result)}
                                                    />
                                                )}
                                                {item.completed && (item.timeSpentNet ?? 0) > 0 && (
                                                    <div className="flex flex-col items-end text-right">
                                                        <span className="font-mono text-xs font-bold text-emerald-400">
                                                            {Math.floor((item.timeSpentNet) / 60)}m
                                                        </span>
                                                        <span className="text-[8px] text-text-secondary/40">active</span>
                                                    </div>
                                                )}
                                            </div>

                                            {item.itemType === 'topic' && item.subtopics?.length > 0 && (
                                                <div className="pl-9 space-y-1.5 pb-1">
                                                    {item.subtopics.map((sub: any) => (
                                                        <div key={sub.id} className="text-[10px] text-text-secondary flex gap-2">
                                                            <span className="text-secondary opacity-50 mt-0.5 flex-shrink-0">•</span>
                                                            <span>{sub.content}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </section>

                        {data.kcs.length > 0 && (
                            <section className="bg-surface border border-border-subtle rounded-3xl p-8 space-y-6 relative overflow-hidden">
                                {data.progress.status === 'complete' ? (
                                    <>
                                        <h3 className="text-xl font-syne font-bold flex items-center gap-3 text-secondary">
                                        <HelpCircle className="w-6 h-6" />
                                        Knowledge Check
                                    </h3>
                                    <div className="space-y-6">
                                        {data.kcs.map((kc: any) => {
                                        const isAiChecking = aiCheckingIds.has(kc.id)
                                        return (
                                            <div key={kc.id} className="p-6 bg-[#0c0c0c] border border-border-subtle rounded-2xl space-y-4">
                                                <p className="font-bold text-text-primary underline decoration-primary/30 underline-offset-4 leading-relaxed">
                                                    Q{kc.questionNumber}: {kc.questionText}
                                                </p>
                                                <textarea
                                                    value={kcAnswers[kc.id]?.notes || ''}
                                                    onChange={(e) => setKcAnswers({ ...kcAnswers, [kc.id]: { ...kcAnswers[kc.id], notes: e.target.value } })}
                                                    placeholder="Explain in your own words..."
                                                    className="w-full bg-surface border border-border-subtle rounded-xl p-4 text-sm text-text-primary outline-none focus:border-secondary transition-all h-24 italic"
                                                />
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={() => setKcAnswers({ ...kcAnswers, [kc.id]: { ...kcAnswers[kc.id], passed: true } })}
                                                            className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95", kcAnswers[kc.id]?.passed ? "bg-success text-white shadow-md shadow-success/20" : "bg-white/5 text-text-secondary hover:bg-white/8")}
                                                        >
                                                            Passed
                                                        </button>
                                                        <button
                                                            onClick={() => setKcAnswers({ ...kcAnswers, [kc.id]: { ...kcAnswers[kc.id], passed: false } })}
                                                            className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95", !kcAnswers[kc.id]?.passed ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white/5 text-text-secondary hover:bg-white/8")}
                                                        >
                                                            Needs Review
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAICheck(kc.id)}
                                                        disabled={isAiChecking}
                                                        className="px-4 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-400 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                                                    >
                                                        {isAiChecking ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Zap className="w-3 h-3 group-hover:scale-125 transition-transform" />
                                                        )}
                                                        {isAiChecking ? 'Evaluating...' : 'AI Evaluate'}
                                                    </button>
                                                </div>

                                                {/* AI Feedback Display */}
                                                {(kc.result?.aiFeedback || aiFeedback[kc.id]) && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="mt-6 p-6 rounded-2xl bg-violet-500/5 border border-violet-500/10 space-y-4"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                                                                <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Forge AI Evaluation</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold text-text-secondary uppercase">Score:</span>
                                                                <span className={cn(
                                                                    "text-xl font-black font-syne",
                                                                    (kc.result?.aiScore || 0) >= 80 ? "text-success" : (kc.result?.aiScore || 0) >= 60 ? "text-secondary" : "text-primary"
                                                                )}>
                                                                    {kc.result?.aiScore || 0}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div className="space-y-3">
                                                                <h5 className="text-[10px] font-bold text-text-primary uppercase tracking-widest border-b border-border-subtle pb-1">Understanding Level</h5>
                                                                <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-violet-300">
                                                                    {kc.result?.understandingLevel || 'Analyzing...'}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <h5 className="text-[10px] font-bold text-text-primary uppercase tracking-widest border-b border-border-subtle pb-1">Missed Points</h5>
                                                                <ul className="space-y-1">
                                                                    {(kc.result?.missedPoints || []).map((point: string, i: number) => (
                                                                        <li key={i} className="text-[11px] text-primary/80 flex gap-2">
                                                                            <span>•</span>
                                                                            <span>{point}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <h5 className="text-[10px] font-bold text-text-primary uppercase tracking-widest border-b border-border-subtle pb-1">AI Mentor Feedback</h5>
                                                            <p className="text-sm text-text-secondary leading-relaxed italic font-lora whitespace-pre-wrap">
                                                                {kc.result?.aiFeedback || aiFeedback[kc.id]}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                </>
                            ) : (
                                <div className="p-8 bg-surface border border-border-subtle rounded-2xl text-center space-y-4">
                                    <HelpCircle className="w-12 h-12 text-text-secondary/40 mx-auto" />
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-syne font-bold uppercase tracking-tighter text-text-secondary/40">Knowledge Locked</h4>
                                        <p className="text-xs text-text-secondary/60 font-bold max-w-[220px] mx-auto uppercase tracking-widest leading-loose">
                                            Complete all build &amp; review tasks to unlock.
                                        </p>
                                    </div>
                                </div>
                             )}
                          
                    </section>
                        )}
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-8">
                        {/* LeetCode Problems */}
                        {data.leetcodeProblems && data.leetcodeProblems.length > 0 && (
                            <section className="bg-blue-500/5 border border-blue-500/15 rounded-3xl p-6 space-y-4">
                                <h3 className="font-syne font-bold uppercase tracking-widest text-xs text-blue-400 flex items-center gap-2">
                                    <Code2 className="w-4 h-4" />
                                    Strategic DSA Focus
                                </h3>
                                <div className="space-y-3">
                                    {data.leetcodeProblems.map((p: any) => (
                                        <a
                                            key={p.id}
                                            href={p.url || `https://leetcode.com/problems/${p.title.toLowerCase().replace(/\s+/g, '-')}/`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-4 rounded-2xl bg-[#0c0c0c] border border-white/5 hover:border-blue-500/30 group transition-all active:scale-[0.98]"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{p.leetcodeId || 'LeetCode'}</span>
                                                <span className={cn(
                                                    "text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                                                    p.difficulty?.toLowerCase() === 'easy' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                                        p.difficulty?.toLowerCase() === 'medium' ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                                                            "bg-red-500/10 text-red-400 border border-red-500/20"
                                                )}>
                                                    {p.difficulty || 'Medium'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold group-hover:text-blue-400 transition-colors">{p.title}</p>
                                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                                            </div>
                                            {p.pattern && (
                                                <span className="text-[10px] text-text-secondary/60 mt-1 block italic lowercase">{p.pattern}</span>
                                            )}
                                        </a>
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
                                onChange={(e) => setData({ ...data, progress: { ...data.progress, sessionNotes: e.target.value } })}
                                placeholder="Log any breakthroughs or struggles..."
                                className="w-full bg-[#0c0c0c] border border-border-subtle rounded-2xl p-4 text-sm min-h-[150px] outline-none focus:border-primary transition-all font-lora"
                            />

                            {/* Daily Reflection */}
                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <h3 className="font-syne font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 text-secondary">
                                    <Zap className="w-4 h-4" />
                                    Daily Reflection / Journal
                                </h3>
                                <textarea
                                    value={data.progress.reflection || ''}
                                    onChange={(e) => setData({ ...data, progress: { ...data.progress, reflection: e.target.value } })}
                                    placeholder="What did you learn about your process today? How can you optimize tomorrow?"
                                    className="w-full bg-[#0c0c0c] border border-border-subtle rounded-2xl p-4 text-xs min-h-[120px] outline-none focus:border-secondary transition-all font-lora italic"
                                />
                            </div>

                            <button
                                onClick={handleSaveProgress}
                                disabled={saving}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all group disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]",
                                    saved
                                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                                        : "bg-surface-elevated border border-border-subtle hover:border-primary text-text-primary"
                                )}
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                ) : saved ? (
                                    <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                                ) : (
                                    <><Save className="w-4 h-4 group-hover:scale-110 transition-transform" /> Commit Progress</>
                                )}
                            </button>
                        </section>

                        {/* Q&A summary card in sidebar */}
                        <section className="bg-violet-500/5 border border-violet-500/15 rounded-3xl p-6 space-y-4">
                            <h3 className="font-syne font-bold uppercase tracking-widest text-xs text-violet-400 flex items-center gap-2">
                                <MessageCircleQuestion className="w-4 h-4" />
                                Mind Q&amp;As
                            </h3>
                            <div className="space-y-2">
                                {data.topics.map((topic: any) => {
                                    const count = (initialQnAs[topic.id] ?? []).length
                                    return (
                                        <button
                                            key={topic.id}
                                            onClick={() => openDrawerForTopic(topic.id)}
                                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0c0c0c] border border-white/5 hover:border-violet-500/30 hover:text-violet-400 text-text-secondary transition-all group"
                                        >
                                            <span className="text-xs font-bold truncate">Topic {topic.topicNumber?.split('_t')[1] ?? topic.topicNumber ?? ''}: {topic.title}</span>
                                            <span className={cn('text-[9px] font-bold flex-shrink-0 ml-2',
                                                count > 0 ? 'text-violet-400' : 'text-text-secondary/40 group-hover:text-violet-400'
                                            )}>
                                                {count > 0 ? `${count} Q&As` : 'Open →'}
                                            </span>
                                        </button>
                                    )
                                })}
                                <button
                                    onClick={() => openDrawerForTopic(null)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0c0c0c] border border-white/5 hover:border-violet-500/30 hover:text-violet-400 text-text-secondary transition-all group"
                                >
                                    <span className="text-xs font-bold">General Q&amp;As</span>
                                    <span className={cn('text-[9px] font-bold flex-shrink-0',
                                        (initialQnAs[''] ?? []).length > 0 ? 'text-violet-400' : 'text-text-secondary/40 group-hover:text-violet-400'
                                    )}>
                                        {(initialQnAs[''] ?? []).length > 0 ? `${initialQnAs[''].length} Q&As` : 'Open →'}
                                    </span>
                                </button>
                            </div>
                            <button
                                onClick={() => { setDrawerDefaultTopicId(drawerTopics[0]?.id ?? null); setDrawerOpen(true) }}
                                className="w-full py-3 rounded-2xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/25 hover:border-violet-500/50 text-violet-400 text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
                            >
                                Open Q&amp;A Panel
                            </button>
                        </section>
                    </div>
                </div>
            </div>
        </>
    )
}
