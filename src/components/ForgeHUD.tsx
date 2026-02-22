'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Shield, BarChart3, Quote, Info, Settings, Zap, Target, Book, X } from 'lucide-react'
import PomodoroTimer from './PomodoroTimer'
import { cn } from '@/lib/utils'
import { getAnalyticsData } from '@/lib/actions/analytics'
import { usePathname } from 'next/navigation'

type HUDMode = 'timer' | 'stats' | 'insight'

// Quick insights
const insights = [
    "Seniority is measured by the complexity of problems you solve, not the years you've spent.",
    "Infrastructure is not a chore. It's the foundation of reliability.",
    "If you can't explain your architecture to a junior, you don't understand it yet.",
    "Shipping code is the only real measure of progress.",
    "Design for the next engineer, not for your ego."
]

export default function ForgeHUD() {
    const [mode, setMode] = useState<HUDMode>('timer')
    const [isOpen, setIsOpen] = useState(false)

    const [currentInsight, setCurrentInsight] = useState(insights[0])
    const [stats, setStats] = useState<any>(null)
    const pathname = usePathname()

    const isPublicPage = pathname === '/login' || pathname === '/profile' || pathname === '/'

    useEffect(() => {
        setCurrentInsight(insights[Math.floor(Math.random() * insights.length)])
        getAnalyticsData().then(setStats)
    }, [])

    if (isPublicPage) return null

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-surface-elevated border-2 border-white/5 rounded-[2.5rem] p-4 shadow-2xl backdrop-blur-2xl w-80 space-y-4"
                    >
                        {/* Tabs */}
                        <div className="flex bg-black/40 p-1 rounded-2xl gap-1">
                            {[
                                { id: 'timer', icon: Zap, label: 'Timer' },
                                { id: 'stats', icon: BarChart3, label: 'Pulse' },
                                { id: 'insight', icon: Quote, label: 'Intel' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setMode(tab.id as HUDMode)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                        mode === tab.id
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "text-text-secondary hover:text-white"
                                    )}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="min-h-[300px] flex flex-col justify-center">
                            {mode === 'timer' && (
                                <div className="p-2">
                                    <PomodoroTimer />
                                    {/* Inline display since we want it inside HUD */}
                                    <p className="text-[10px] text-center text-text-secondary font-bold uppercase tracking-[0.2em] mt-8">
                                        Focus Session Active
                                    </p>
                                </div>
                            )}

                            {mode === 'stats' && (
                                <div className="space-y-6 p-4">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Daily Progress</span>
                                            <span className="text-xl font-syne font-bold text-primary">{stats?.avgDiscipline || 0}%</span>
                                        </div>
                                        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${stats?.avgDiscipline || 0}%` }} className="h-full bg-primary" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/20 p-4 rounded-3xl border border-white/5">
                                            <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest mb-1">Hours Logged</p>
                                            <p className="text-xl font-syne font-bold">{stats?.weeklySummary?.totalHours || 0}H</p>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-3xl border border-white/5">
                                            <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest mb-1">Weekly Streak</p>
                                            <p className="text-xl font-syne font-bold font-mono">{stats?.streak || 0}D</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                                        <Target className="w-5 h-5 text-primary" />
                                        <p className="text-[10px] font-bold text-primary leading-tight uppercase tracking-wider">
                                            Next Milestone: S-Tier Streak (3 Days Left)
                                        </p>
                                    </div>
                                </div>
                            )}

                            {mode === 'insight' && (
                                <div className="p-8 text-center space-y-6">
                                    <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto">
                                        <Quote className="w-6 h-6 text-secondary" />
                                    </div>
                                    <p className="text-sm font-medium italic font-lora leading-relaxed text-text-secondary">
                                        &quot;{currentInsight}&quot;
                                    </p>
                                    <button
                                        onClick={() => setCurrentInsight(insights[Math.floor(Math.random() * insights.length)])}
                                        className="text-[10px] font-bold text-secondary uppercase tracking-widest border-b border-secondary/20 hover:border-secondary transition-all"
                                    >
                                        Next Intelligence
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer stats */}
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">System Stable</span>
                            </div>
                            <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">FORGE OS 2.1</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500",
                    isOpen
                        ? "bg-black border-2 border-primary rotate-90"
                        : "bg-primary hover:bg-red-600 scale-110 active:scale-95"
                )}
            >
                {isOpen ? <X className="w-6 h-6 text-white" /> : <Terminal className="w-6 h-6 text-white" />}
            </button>
        </div>
    )
}
