'use client'

import React from 'react'
import Link from 'next/link'

// Data freshness is handled by React Query (staleTime 60s). No need to force-dynamic.
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
    Trophy,
    Database,
    Coins,
    AlertTriangle,
    Quote
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { getDashboardData, logHours } from '@/lib/actions/roadmap'
import PageWrapper from '@/components/PageWrapper'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import WhatToStartCard from '@/components/behavior/WhatToStartCard'
import ActiveFocusCard from '@/components/behavior/ActiveFocusCard'
import BeastAnalysis from '@/components/dashboard/BeastAnalysis'
import SessionHUD from '@/components/behavior/SessionHUD'
import EndOfDayModal from '@/components/behavior/EndOfDayModal'
import { startSession, endSession } from '@/lib/actions/behavior'
import { updateDayProgress } from '@/lib/actions/day'
import { setDayOff } from '@/lib/actions/scheduling'
import { toggleTaskCompletion } from '@/lib/actions/day'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { syncUserDailyLogin } from '@/lib/actions/login-sync'
import DailyBriefingModal from '@/components/dashboard/DailyBriefingModal'
import DayOffModal from '@/components/dashboard/DayOffModal'
import { AnimatePresence } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import PomodoroTimer from '@/components/PomodoroTimer'

export default function DashboardPage() {
    const queryClient = useQueryClient()
    const [activeSession, setActiveSession] = React.useState<{ id: string, title: string } | null>(null)
    const [showEndOfDay, setShowEndOfDay] = React.useState(false)
    const [showDailyBrief, setShowDailyBrief] = React.useState(false)
    const [isManualMomentum, setIsManualMomentum] = React.useState(false)
    const [isDismissedMomentum, setIsDismissedMomentum] = React.useState(false)
    const [dailyInsight, setDailyInsight] = React.useState('')
    const [showStartPomodoro, setShowStartPomodoro] = React.useState(false)
    const [showDayOffReason, setShowDayOffReason] = React.useState(false)
    const [dayOffReason, setDayOffReason] = React.useState('')
    const [togglingTaskId, setTogglingTaskId] = React.useState<string | null>(null)

    const INSIGHTS = React.useMemo(
        () => [
            "Seniority is measured by the complexity of problems you solve, not the years you've spent.",
            "Infrastructure is not a chore. It's the foundation of reliability.",
            "If you can't explain your architecture to a junior, you don't understand it yet.",
            "Shipping code is the only real measure of progress.",
            "Design for the next engineer, not for your ego."
        ],
        []
    )

    React.useEffect(() => {
        setDailyInsight(INSIGHTS[Math.floor(Math.random() * INSIGHTS.length)])
    }, [INSIGHTS])

    // Daily Sync and Briefing Check
    React.useEffect(() => {
        const handleSync = async () => {
            try {
                const todayStr = format(new Date(), 'yyyy-MM-dd')
                const result = await syncUserDailyLogin(todayStr)
                if (result.isFirstLoginToday) {
                    setShowDailyBrief(true)
                    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] })
                }
            } catch (error) {
                console.error('Failed to sync daily login:', error)
            }
        }
        handleSync()
    }, [queryClient])

    const { data: stats, isLoading: loading } = useQuery({
        queryKey: ['dashboard-data'],
        queryFn: async () => {
            const today = format(new Date(), 'yyyy-MM-dd')
            const response = await fetch(`/api/stats/dashboard?date=${today}`)
            if (!response.ok) throw new Error('Failed to fetch dashboard data')
            const baseStats = await response.json()

            // DEV ONLY: Test Mode
            if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
                const isMock = localStorage.getItem('forge_mock_beast') === 'true'
                if (isMock && baseStats.hasProgram && !baseStats.metadata) {
                    baseStats.metadata = {
                        bluntTruth: "You're a code monkey until you prove otherwise.",
                        roasts: ["Resume looks like a generic template.", "Zero evidence of scale."],
                        strengths: [{ content: "Elite TypeScript Mastery" }, { content: "Architectural Foresight" }],
                        dsaLanguage: "TypeScript",
                        specialization: "Next.js Performance Engineer",
                        targetPackage: "24-36",
                        specializationDecision: { reasoning: "Market depth and tech stack proximity." }
                    }
                }
            }

            return baseStats
        },
        staleTime: 60 * 1000, // 1 minute
    })

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

                    {/* DEV ONLY: Quick Seed for Demo */}
                    {process.env.NODE_ENV === 'development' && typeof document !== 'undefined' && document.cookie.includes('forge_test_mode=true') && (
                        <button
                            onClick={async () => {
                                const toastId = toast.loading('Igniting Beast Mode...')
                                try {
                                    const { seedBeastRoadmap } = await import('@/lib/actions/dev')
                                    await seedBeastRoadmap()
                                    toast.success('Beast Mode Ignited!', { id: toastId })
                                    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] })
                                } catch (e: any) {
                                    toast.error(e.message || 'Seeding failed', { id: toastId })
                                }
                            }}
                            className="text-text-secondary hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Seed Sample Beast Roadmap (Local Dev)
                        </button>
                    )}
                </div>
            </PageWrapper>
        )
    }

    // Derived stats for the Hero card
    const heroStats = (isManualMomentum || (stats?.recommendedAction === 'Momentum' && !isDismissedMomentum)) ? {
        ...stats,
        recommendedAction: 'Momentum',
        shortDiagnostic: isManualMomentum
            ? "Manual bypass engaged. Initializing 120-second 'micro-start' to override resistance."
            : stats.shortDiagnostic,
        topTask: isManualMomentum
            ? `Starter: ${stats.tasks?.find((t: any) => !t.completed)?.title || "Review Logic"} (Just 2 mins)`
            : stats.topTask
    } : {
        ...stats,
        // If it was Momentum but we dismissed it, show DeepWork (or whatever the fallback would be)
        recommendedAction: stats?.recommendedAction === 'Momentum' ? 'DeepWork' : stats?.recommendedAction
    }

    const handleStartSession = async () => {
        try {
            const sessionId = await startSession(undefined)
            setActiveSession({ id: sessionId, title: heroStats.topTask })
            setIsManualMomentum(false) // Reset after starting
            setIsDismissedMomentum(false)
            toast.success("Protocol Engaged. Focus Mode Active.")

            try {
                const shouldStartPomodoro = typeof window !== 'undefined'
                    ? window.localStorage.getItem('forge_start_with_pomodoro') !== 'false'
                    : false
                if (shouldStartPomodoro) setShowStartPomodoro(true)
            } catch {
                // ignore localStorage errors
            }
        } catch (error) {
            toast.error("Failed to ignite forge.")
        }
    }

    const handleEndSession = async (sessionStats: { interruptions: number, distractions: number }) => {
        if (!activeSession) return
        try {
            await endSession(activeSession.id, sessionStats)
            setActiveSession(null)
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] })
            toast.success("Session finalized. Data persisted.")

            // If all tasks done, maybe show end of day
            if (stats.tasksDone + 1 >= stats.tasksTotal) {
                setShowEndOfDay(true)
            }
        } catch (error) {
            toast.error("Failed to finalize session.")
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-primary'
        if (score >= 70) return 'text-success'
        if (score >= 50) return 'text-secondary'
        return 'text-text-secondary'
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const isDayOffToday = stats.adjustments?.some((a: any) => a.date === todayStr && a.adjustmentType === 'day_off')

    const toggleDayOffToday = async (reason?: string) => {
        if (!isDayOffToday && !reason) {
            setShowDayOffReason(true)
            return
        }

        const toastId = toast.loading(isDayOffToday ? 'Resuming Neural Sync...' : 'Recording Recalibration Day...')
        try {
            await setDayOff(stats.programId, todayStr, !isDayOffToday, reason)
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] })
            toast.success(isDayOffToday ? 'Back on the grid. Protocol restored.' : 'Schedule recalibrated.', { id: toastId })
            setShowDayOffReason(false)
            setDayOffReason('')
        } catch (e) {
            toast.error('Failed to adjust schedule', { id: toastId })
        }
    }

    return (
        <PageWrapper>
            <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto">
                {showStartPomodoro && (
                    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-[#0f0f0f] border border-primary/20 rounded-[2.5rem] p-6 shadow-[0_0_60px_rgba(255,49,49,0.15)]">
                            <div className="flex items-center justify-between pb-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Auto Focus</span>
                                    <h3 className="text-xl font-syne font-bold">Pomodoro Started</h3>
                                </div>
                                <button
                                    onClick={() => setShowStartPomodoro(false)}
                                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-white hover:border-primary/30 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                            <PomodoroTimer autoStartOnMount />
                        </div>
                    </div>
                )}

                {/* Hero Behavior Section */}
                {!activeSession && (
                    <motion.div
                        layout
                        className={cn(
                            "relative transition-all duration-700",
                            isManualMomentum ? "scale-[1.02] z-50" : ""
                        )}
                    >
                        {stats.activeTimer ? (
                            <ActiveFocusCard
                                id={stats.activeTimer.id}
                                title={stats.activeTimer.title}
                                status={stats.activeTimer.status}
                                dayNumber={stats.activeTimer.dayNumber}
                                type={stats.activeTimer.type as 'task' | 'topic'}
                            />
                        ) : (
                            <WhatToStartCard
                                dayNumber={stats.day}
                                dayTitle={stats.dayTitle}
                                recommendedAction={stats.recommendedAction}
                                topTask={stats.topTask}
                                shortDiagnostic={stats.shortDiagnostic}
                                coinsBalance={stats.coinsBalance}
                                onStart={handleStartSession}
                                isPastDue={stats.isPastDue}
                                scheduledDate={stats.scheduledDate}
                                onForceMomentum={() => {
                                    setIsManualMomentum(true)
                                    setIsDismissedMomentum(false)
                                }}
                            />
                        )}
                        {(isManualMomentum || (stats?.recommendedAction === 'Momentum' && !isDismissedMomentum)) && !stats.activeTimer && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => {
                                    setIsManualMomentum(false)
                                    setIsDismissedMomentum(true)
                                }}
                                className="absolute -top-4 -right-4 bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md z-[60]"
                            >
                                {isManualMomentum ? "Cancel Bypass" : "Strategic View"}
                            </motion.button>
                        )}
                    </motion.div>
                )}

                {/* Streak Break Guard Warning */}
                {stats.isLateStart && !activeSession && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-orange-500/10 border-2 border-orange-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(249,115,22,0.1)]"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/40 shrink-0 animate-pulse">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-syne font-black text-orange-500 uppercase tracking-tighter italic">STREAK BREAK GUARD ACTIVE</h3>
                                <p className="text-text-secondary text-sm font-medium">
                                    Inertia detected. You are trending towards a <span className="text-orange-500 font-bold">broken streak</span>. Execute any task now to lock in progress.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleStartSession}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-4 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 whitespace-nowrap uppercase tracking-widest text-[10px]"
                        >
                            <Zap className="w-4 h-4 fill-current" />
                            Lock in Progress
                        </button>
                    </motion.div>
                )}

                {/* Day Off Recalibration Widget */}
                {!activeSession && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            "p-6 rounded-[2.5rem] border-2 transition-all flex flex-col md:flex-row items-center justify-between gap-6",
                            isDayOffToday
                                ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]"
                                : "bg-surface border-white/5"
                        )}
                    >
                        <div className="flex items-center gap-5">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                                isDayOffToday ? "bg-blue-500 text-white shadow-lg shadow-blue-500/40" : "bg-white/5 text-text-secondary"
                            )}>
                                <Calendar className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h3 className={cn(
                                    "text-xl font-syne font-black uppercase tracking-tighter italic",
                                    isDayOffToday ? "text-blue-500" : "text-text-primary"
                                )}>
                                    {isDayOffToday ? 'RECALIBRATION IN PROGRESS' : 'OPERATIONAL WINDOW OPEN'}
                                </h3>
                                <p className="text-text-secondary text-sm font-medium">
                                    {isDayOffToday
                                        ? stats.adjustments?.find((a: any) => a.date === todayStr && a.adjustmentType === 'day_off')?.aiAnalysis || "Neural resting cycle active. Future schedule shifted +1 day. Resume today to override."
                                        : "Protocol active for today. Logging in secures the streak. Taking a day off shifts the timeline."}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleDayOffToday()}
                            className={cn(
                                "font-black px-10 py-5 rounded-3xl transition-all shadow-lg uppercase tracking-widest text-[10px]",
                                isDayOffToday
                                    ? "bg-white text-black hover:bg-white/90 shadow-white/10"
                                    : "bg-surface-elevated hover:bg-white/5 text-text-secondary border border-white/10"
                            )}
                        >
                            {isDayOffToday ? 'Override: Return to Grind' : 'Recalibrate: Today is Off'}
                        </button>
                    </motion.div>
                )}

                {/* Header Section */}
                <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">War Room Statistics</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-syne font-black tracking-tighter mb-2">
                            The Grind: <span className="text-primary">Day {stats.day}</span>
                        </h1>
                        {stats.estimatedCompletionDate && (
                            <div className="flex items-center gap-2 mb-4 opacity-80">
                                <Calendar className="w-3.5 h-3.5 text-success" />
                                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                                    Est. Completion: <span className="text-success">{new Date(stats.estimatedCompletionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                            <span className="bg-white/5 px-2 py-1 rounded border border-white/5">{stats.currentPhase}</span>
                            <span className="bg-white/5 px-2 py-1 rounded border border-white/5">{stats.currentWeek}</span>
                        </div>
                        <p className="text-text-secondary text-lg flex items-center gap-2 font-medium">
                            <Target className="w-5 h-5 text-primary" />
                            Active Focus: <span className="text-text-primary font-bold">{stats.focus}</span>
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {stats.coinsBalance !== undefined && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-[#111111] border border-success/30 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-xl shadow-success/10 group hover:border-success transition-all cursor-default"
                            >
                                <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                                    <Coins className="w-6 h-6 fill-current" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-success uppercase tracking-widest block mb-0.5">Forge Wallet</span>
                                    <p className="text-2xl font-syne font-bold text-text-primary italic">
                                        {stats.coinsBalance} <span className="text-xs text-text-secondary not-italic ml-1 tracking-widest uppercase">Coins</span>
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {stats.nextMilestone && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center gap-4 group hover:bg-primary/10 transition-all cursor-default"
                            >
                                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-0.5">Next Evolution</span>
                                    <h4 className="text-sm font-bold text-text-primary mb-0.5">{stats.nextMilestone.title}</h4>
                                    <p className="text-[11px] text-text-secondary font-medium leading-tight">
                                        Reward: <span className="text-success font-bold text-[12px]">{stats.nextMilestone.reward}</span>
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </section>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* Streak Card */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className={cn(
                            "bg-surface border border-border-subtle p-8 rounded-[2.5rem] space-y-6 group cursor-default shadow-xl",
                            stats.streak >= 3 ? "shadow-orange-500/10 border-orange-500/20" : "shadow-black/20"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                stats.streak >= 3 ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-orange-500/10 text-orange-500"
                            )}>
                                <Flame className={cn("w-6 h-6", stats.streak >= 3 && "fill-current animate-pulse")} />
                            </div>
                            <div className={cn(
                                "text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border",
                                stats.streak >= 7 ? "text-primary bg-primary/10 border-primary/20" : "text-orange-500 bg-orange-500/10 border-orange-500/20"
                            )}>
                                {stats.streak >= 7 ? 'Elite Streak' : stats.streak >= 3 ? 'On Fire' : 'Dormant'}
                            </div>
                        </div>
                        <div>
                            <p className="text-5xl font-syne font-bold tracking-tighter mb-2 italic text-orange-500">
                                {stats.streak}
                                <span className="text-lg text-text-secondary not-italic ml-1">Days</span>
                            </p>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Current Momentum</h3>
                        </div>
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-1 flex-1 rounded-full bg-border-subtle overflow-hidden",
                                        i <= stats.streak % 7 && "bg-orange-500"
                                    )}
                                />
                            ))}
                        </div>
                    </motion.div>

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

                    {/* Strategic Progress Card */}
                    <motion.div whileHover={{ y: -5 }} className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] space-y-6 group cursor-default shadow-xl shadow-black/20">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                                <Database className="w-6 h-6" />
                            </div>
                            <div className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-blue-500/20">Strategic Stack</div>
                        </div>
                        <div>
                            <p className="text-5xl font-syne font-bold tracking-tighter mb-2 italic text-blue-500">
                                {stats.totalTasksDone}
                                <span className="text-lg text-text-secondary not-italic ml-1">TOTAL</span>
                            </p>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Career Built tasks</h3>
                        </div>
                        <div className="h-1.5 w-full bg-border-subtle rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((stats.totalTasksDone / 300) * 100, 100)}%` }}
                                className="h-full bg-blue-500"
                            />
                        </div>
                    </motion.div>

                    {/* Task Progress Card */}
                    <motion.div whileHover={{ y: -5 }} className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] space-y-6 group cursor-default shadow-xl shadow-black/20">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center text-success">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="text-[10px] font-bold text-success bg-success/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-success/20">Flash Points</div>
                        </div>
                        <div>
                            <p className="text-5xl font-syne font-bold tracking-tighter mb-2 italic text-success">
                                {stats.tasksDone}
                                <span className="text-lg text-text-secondary not-italic ml-1">TODAY</span>
                            </p>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Execution Burst</h3>
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

                <div className="bg-[#0c0c0c] border border-primary/20 p-8 rounded-[2.5rem] space-y-4">
                            <div className="flex items-center gap-3">
                                <Quote className="w-6 h-6 text-primary" />
                                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Daily Intel</span>
                            </div>
                            <p className="text-md font-medium leading-relaxed italic text-text-primary font-lora">
                                &quot;{dailyInsight}&quot;
                            </p>
                        </div>

                {/* Secondary Layout: Task Drilldown & Upcoming Milestones */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <section className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                            <h2 className="text-2xl font-syne font-bold uppercase tracking-tighter flex items-center gap-3">
                                <Activity className="w-6 h-6 text-primary" />
                                Mission Parameters
                            </h2>
                            <Link href="/tracker" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">View Roadmap →</Link>
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
                                        <motion.div
                                            key={task.id}
                                            layout
                                            animate={{ opacity: task.completed ? 0.55 : 1 }}
                                            className={cn(
                                                "p-5 rounded-2xl border transition-all flex items-center gap-4 group",
                                                task.completed
                                                    ? "bg-success/5 border-success/20"
                                                    : "bg-[#0a0a0a] border-border-subtle hover:border-primary/30"
                                            )}
                                        >
                                            {/* Inline Clickable Checkbox */}
                                            <button
                                                disabled={!!togglingTaskId}
                                                onClick={async () => {
                                                    if (!stats.activeDayProgressId) {
                                                        toast.error('No active progress session found.')
                                                        return
                                                    }
                                                    setTogglingTaskId(task.id)
                                                    try {
                                                        await toggleTaskCompletion(task.id, stats.activeDayProgressId, !task.completed)
                                                        queryClient.invalidateQueries({ queryKey: ['dashboard-data'] })
                                                        if (!task.completed) toast.success(`"${task.title}" locked in. ✓`)
                                                    } catch {
                                                        toast.error('Failed to update task.')
                                                    } finally {
                                                        setTogglingTaskId(null)
                                                    }
                                                }}
                                                className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center border transition-all shrink-0",
                                                    task.completed
                                                        ? "bg-success border-success text-white"
                                                        : "bg-surface border-border-subtle hover:border-success hover:bg-success/10 hover:text-success"
                                                )}
                                            >
                                                {togglingTaskId === task.id ? (
                                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : task.completed ? (
                                                    <CheckCircle2 className="w-5 h-5" />
                                                ) : (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-current opacity-30 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={cn("text-sm font-bold tracking-tight truncate", task.completed ? "line-through text-text-secondary" : "text-text-primary")}>
                                                    {task.title}
                                                </h4>
                                                <p className="text-xs text-text-secondary mt-0.5">{task.duration} · {task.type}</p>
                                            </div>
                                            <Link
                                                href="/tracker"
                                                className="opacity-0 group-hover:opacity-100 p-2 bg-surface-elevated rounded-lg hover:text-primary transition-all shrink-0"
                                                title="View in Tracker"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </motion.div>
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
                        <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest">Focus Timer</h3>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em]">Pomodoro Protocol</p>
                                    </div>
                                </div>
                            </div>
                            <PomodoroTimer />
                        </div>

                        {/* <div className="flex items-center justify-between border-b border-border-subtle pb-4">
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
                                            style={{
                                                width: `${Math.min(100, (() => {
                                                    switch (m.criteriaType) {
                                                        case 'streak': return (stats.streak / m.criteriaValue) * 100
                                                        case 'tasks_done': return ((stats.totalTasksDone ?? 0) / m.criteriaValue) * 100
                                                        case 'hours_logged': return ((stats.hoursLogged ?? 0) / m.criteriaValue) * 100
                                                        case 'kc_passed': return ((stats.kcPassed ?? 0) / m.criteriaValue) * 100
                                                        default: return (stats.streak / m.criteriaValue) * 100
                                                    }
                                                })())}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link href="/milestones" className="w-full block py-4 bg-surface-elevated border border-border-subtle rounded-2xl text-center text-xs font-bold uppercase tracking-[0.2em] hover:border-primary transition-all">
                            View All Milestones
                        </Link> */}
                    </section>
                </div>
                {/* Beast Analysis (New) */}
            {stats.metadata && (
                <BeastAnalysis metadata={stats.metadata} />
            )}
            </div>

            

            {activeSession && (
                <SessionHUD
                    sessionId={activeSession.id}
                    title={activeSession.title}
                    onEnd={handleEndSession}
                />
            )}

            {showEndOfDay && (
                <EndOfDayModal
                    isOpen={showEndOfDay}
                    onClose={() => setShowEndOfDay(false)}
                    onSaveReflection={async (reflection) => {
                        if (!stats?.activeDayProgressId) return
                        const res = await updateDayProgress(stats.activeDayProgressId, { reflection })
                        if (res.success) {
                            toast.success('Reflection archived in Neural Archive')
                            setShowEndOfDay(false)
                        }
                    }}
                    summary={{
                        disciplineScore: stats.disciplineScore,
                        hoursLogged: stats.hoursLogged,
                        hoursTarget: stats.hoursTarget,
                        tasksCompleted: stats.tasksDone,
                        tasksTotal: stats.tasksTotal,
                        weaknesses: ["Context switching", "Distraction spikes"],
                        tomorrowPlan: {
                            focus: stats.focus,
                            topTask: stats.topTask
                        }
                    }}
                />
            )}
            {showDailyBrief && (
                <DailyBriefingModal
                    isOpen={showDailyBrief}
                    onClose={() => setShowDailyBrief(false)}
                    stats={stats}
                />
            )}

            <DayOffModal
                isOpen={showDayOffReason}
                onClose={() => setShowDayOffReason(false)}
                onConfirm={(reason) => toggleDayOffToday(reason)}
            />
        </PageWrapper>
    )
}
