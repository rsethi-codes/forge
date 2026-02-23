'use client'

import React from 'react'

export const dynamic = 'force-dynamic'
import { motion } from 'framer-motion'
import {
    Activity,
    Target,
    Zap,
    Clock,
    Flame,
    TrendingUp,
    Shield,
    ArrowRight,
    CheckCircle2,
    Calendar,
    Trophy
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

import { getDashboardData, logHours } from '@/lib/actions/roadmap'
import PageWrapper from '@/components/PageWrapper'

export default function DashboardPage() {
    const [stats, setStats] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        fetch('/api/stats/dashboard')
            .then(res => res.json())
            .then(data => {
                setStats(data)
                setLoading(false)
            })
            .catch(err => {
                console.error('[Dashboard] Data fetch failed:', err)
                setLoading(false)
            })
    }, [])

    if (loading) {
        return (
            <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-text-secondary font-bold tracking-widest uppercase text-xs">Synchronizing with the Forge...</p>
            </div>
        )
    }

    if (!stats?.hasProgram) {
        return (
            <PageWrapper>
                <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
                    <div className="w-20 h-20 bg-surface-elevated rounded-3xl flex items-center justify-center border border-border-subtle mb-4">
                        <Flame className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-syne font-bold">The Forge is Empty</h1>
                    <p className="text-text-secondary text-lg max-w-md mx-auto">You haven&apos;t uploaded a roadmap yet. To start your journey, you must first ignite the engine by providing your plan.</p>
                    <Link href="/setup" className="bg-primary hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-bold inline-flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
                        Upload Roadmap <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </PageWrapper>
        )
    }

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-primary'
        if (score >= 70) return 'text-success'
        if (score >= 50) return 'text-secondary'
        return 'text-text-secondary'
    }

    return (
        <PageWrapper>
            <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto">
                {/* Header Section */}
                <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-syne font-bold tracking-tighter mb-2">
                            The Grind: <span className="text-primary">Day {stats.day}</span>
                        </h1>
                        <p className="text-text-secondary text-lg flex items-center gap-2 font-medium">
                            <Target className="w-5 h-5 text-primary" />
                            Active Focus: <span className="text-text-primary font-bold">{stats.focus}</span>
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-surface border border-border-subtle p-4 rounded-2xl flex flex-col items-center w-28">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-1">Streak</span>
                            <div className="flex items-center gap-1.5 text-orange-500">
                                <Flame className="w-4 h-4 fill-current" />
                                <span className="text-2xl font-syne font-bold">{stats.streak}</span>
                            </div>
                        </div>
                        <div className="bg-surface border border-border-subtle p-4 rounded-2xl flex flex-col items-center w-28">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-1">Unlocked</span>
                            <div className="flex items-center gap-1.5 text-primary">
                                <Trophy className="w-4 h-4" />
                                <span className="text-2xl font-syne font-bold">{stats.unlockedCount}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Discipline Card */}
                    <motion.div whileHover={{ y: -5 }} className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] space-y-6 group cursor-default shadow-xl shadow-black/20">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-primary/20">Live Velocity</div>
                        </div>
                        <div>
                            <p className="text-5xl font-syne font-bold tracking-tighter mb-2 italic">
                                <span className={getScoreColor(stats.disciplineScore)}>{stats.disciplineScore}</span>
                                <span className="text-lg text-text-secondary not-italic ml-1">/100</span>
                            </p>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Discipline Index</h3>
                        </div>
                        <div className="h-1.5 w-full bg-border-subtle rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${stats.disciplineScore}%` }} className="h-full bg-primary" />
                        </div>
                    </motion.div>

                    {/* Hours Logged Card */}
                    <motion.div whileHover={{ y: -5 }} className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] space-y-6 group cursor-default shadow-xl shadow-black/20">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-blue-500/20">Engine Run Time</div>
                        </div>
                        <div>
                            <p className="text-5xl font-syne font-bold tracking-tighter mb-2 italic text-blue-500">
                                {stats.hoursLogged}
                                <span className="text-lg text-text-secondary not-italic ml-1">/ {stats.hoursTarget}H</span>
                            </p>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Hours Diverted</h3>
                        </div>
                        <div className="h-1.5 w-full bg-border-subtle rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.hoursLogged / stats.hoursTarget) * 100}%` }} className="h-full bg-blue-500" />
                        </div>
                    </motion.div>

                    {/* Task Progress Card */}
                    <motion.div whileHover={{ y: -5 }} className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] space-y-6 group cursor-default shadow-xl shadow-black/20">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center text-success">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="text-[10px] font-bold text-success bg-success/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-success/20">Milestone Sync</div>
                        </div>
                        <div>
                            <p className="text-5xl font-syne font-bold tracking-tighter mb-2 italic text-success">
                                {stats.tasksDone}
                                <span className="text-lg text-text-secondary not-italic ml-1">/ {stats.tasksTotal} DONE</span>
                            </p>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Daily Execution</h3>
                        </div>
                        <div className="h-1.5 w-full bg-border-subtle rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.tasksDone / (stats.tasksTotal || 1)) * 100}%` }} className="h-full bg-success" />
                        </div>
                    </motion.div>

                    {/* Motivation Message Card */}
                    <div className="bg-[#0c0c0c] border border-primary/20 p-8 rounded-[2.5rem] flex flex-col justify-center space-y-4">
                        <Zap className="w-8 h-8 text-primary fill-primary/20" />
                        <p className="text-md font-medium leading-relaxed italic text-text-primary font-lora">
                            &quot;{stats.message}&quot;
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Forge System AI</span>
                        </div>
                    </div>
                </div>

                {/* Secondary Layout: Task Drilldown & Upcoming Milestones */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <section className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                            <h2 className="text-2xl font-syne font-bold uppercase tracking-tighter flex items-center gap-3">
                                <Activity className="w-6 h-6 text-primary" />
                                Mission Parameters
                            </h2>
                            <button className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">View Roadmap</button>
                        </div>

                        <div className="bg-surface border border-border-subtle rounded-[2rem] overflow-hidden">
                            <div className="p-6 border-b border-border-subtle bg-surface-elevated flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary">{stats.dayTitle || `Protocol Day ${stats.day}`}</h3>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em]">{stats.programTitle}</p>
                                </div>
                                <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                                    <span className="text-[10px] font-bold text-primary uppercase">Active Channel</span>
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                {stats.tasks && stats.tasks.length > 0 ? (
                                    stats.tasks.map((task: any) => (
                                        <div
                                            key={task.id}
                                            className={cn(
                                                "p-5 rounded-2xl border transition-all flex items-center gap-4 group",
                                                task.completed
                                                    ? "bg-success/5 border-success/20 opacity-60"
                                                    : "bg-[#0a0a0a] border-border-subtle hover:border-primary/30"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                                                task.completed
                                                    ? "bg-success border-success text-white"
                                                    : "bg-surface border-border-subtle group-hover:border-primary/50"
                                            )}>
                                                {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-primary" />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={cn("text-sm font-bold tracking-tight", task.completed ? "line-through text-text-secondary" : "text-text-primary")}>
                                                    {task.title}
                                                </h4>
                                                <p className="text-xs text-text-secondary mt-0.5">{task.duration} Target</p>
                                            </div>
                                            <Link
                                                href="/tracker"
                                                className="opacity-0 group-hover:opacity-100 p-2 bg-surface-elevated rounded-lg hover:text-primary transition-all"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center space-y-4">
                                        <Calendar className="w-12 h-12 text-text-secondary mx-auto" />
                                        <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">No active tasks for this frequency.</p>
                                        <Link href="/tracker" className="px-6 py-2 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all inline-block">Calibrate Timeline</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                            <h2 className="text-2xl font-syne font-bold uppercase tracking-tighter flex items-center gap-3">
                                <Trophy className="w-6 h-6 text-primary" />
                                Achievements
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {stats.upcomingMilestones.map((m: any) => (
                                <div key={m.id} className="p-5 bg-surface border border-border-subtle rounded-2xl group hover:border-primary/30 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-sm font-bold uppercase tracking-tighter">{m.title}</h4>
                                        <div className="text-[10px] font-bold text-text-secondary">{m.criteriaValue} {m.criteriaType}</div>
                                    </div>
                                    <p className="text-xs text-text-secondary line-clamp-1 mb-3">{m.description}</p>
                                    <div className="w-full h-1 bg-border-subtle rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${Math.min(100, (stats.streak / m.criteriaValue) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link href="/milestones" className="w-full block py-4 bg-surface-elevated border border-border-subtle rounded-2xl text-center text-xs font-bold uppercase tracking-[0.2em] hover:border-primary transition-all">
                            View All Milestones
                        </Link>
                    </section>
                </div>
            </div>
        </PageWrapper>
    )
}
