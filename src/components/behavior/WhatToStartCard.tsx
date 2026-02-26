'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Play, Zap, Brain, Shield, ArrowRight, Coins, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WhatToStartCardProps {
    dayNumber: number
    dayTitle?: string
    recommendedAction: 'QuickWin' | 'DeepWork' | 'Momentum'
    topTask: string
    shortDiagnostic: string
    coinsBalance: number
    onStart: () => void
    onForceMomentum?: () => void
    isPastDue?: boolean
    scheduledDate?: string
}

export default function WhatToStartCard({
    dayNumber,
    dayTitle,
    recommendedAction,
    topTask,
    shortDiagnostic,
    coinsBalance,
    onStart,
    onForceMomentum,
    isPastDue,
    scheduledDate
}: WhatToStartCardProps) {
    const [starting, setStarting] = React.useState(false)
    const isDeepWork = recommendedAction === 'DeepWork'
    const isMomentum = recommendedAction === 'Momentum'

    const handleStart = async () => {
        if (starting) return
        setStarting(true)
        try {
            await onStart()
        } finally {
            setStarting(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "bg-[#0a0a0a] border rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl transition-colors duration-700",
                isDeepWork ? "border-primary/20" : isMomentum ? "border-blue-500/30" : "border-success/20"
            )}
        >
            {/* Ambient Background Glow */}
            <div className={cn(
                "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-20 transition-all duration-1000",
                isDeepWork ? "bg-primary" : isMomentum ? "bg-blue-600" : "bg-success"
            )} />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "h-10 px-4 border rounded-full flex items-center gap-2",
                            isMomentum ? "bg-blue-500/10 border-blue-500/20" : "bg-primary/10 border-primary/20"
                        )}>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                isMomentum ? "text-blue-400" : "text-primary"
                            )}>
                                {isMomentum ? "Emergency Momentum Mode" : `Day ${dayNumber} Protocol`}
                            </span>
                        </div>
                        <div className="h-10 px-4 bg-success/10 border border-success/20 rounded-full flex items-center gap-2">
                            <Coins className="w-4 h-4 text-success" />
                            <span className="text-sm font-bold text-success">{coinsBalance}</span>
                        </div>
                        {isPastDue && (
                            <div className="h-10 px-4 bg-primary/20 border border-primary/40 rounded-full flex items-center gap-2 animate-pulse">
                                <AlertTriangle className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Target Overdue</span>
                            </div>
                        )}
                        {!isMomentum && onForceMomentum && (
                            <button
                                onClick={onForceMomentum}
                                className="h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center gap-2 transition-all group/stuck"
                            >
                                <Brain className="w-4 h-4 text-text-secondary group-hover/stuck:text-blue-400" />
                                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Feeling Stuck?</span>
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-4xl md:text-5xl font-syne font-bold tracking-tighter text-text-primary leading-tight">
                            {isDeepWork ? "Ignite Deep Work" : isMomentum ? "Frictionless Entry" : "Calibrate Focus"}
                        </h2>
                        <p className="text-lg text-text-secondary font-medium font-lora italic">
                            {isMomentum ? "Low effort. Maximum reward. Just 120 seconds." : `"${dayTitle || "Forge the next component"}"`}
                        </p>
                    </div>

                    {isMomentum ? (
                        <div className="flex items-center gap-4 py-3 bg-blue-500/5 px-4 rounded-2xl border border-blue-500/10">
                            <div className="flex gap-1.5 flex-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={cn(
                                        "h-1.5 flex-1 rounded-full overflow-hidden bg-white/5",
                                        i === 1 && "bg-blue-500/40"
                                    )}>
                                        {i === 1 && <motion.div
                                            animate={{ x: ['-100%', '100%'] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                            className="h-full w-full bg-blue-400 shadow-[0_0_10px_#60a5fa]"
                                        />}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest whitespace-nowrap">Step 1: The Spark</span>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <div className="h-1.5 w-12 rounded-full bg-primary/40 shadow-[0_0_10px_rgba(255,49,49,0.5)]" />
                            <div className="h-1.5 w-6 rounded-full bg-white/10" />
                            <div className="h-1.5 w-6 rounded-full bg-white/10" />
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                <Target className={cn("w-3 h-3", isMomentum ? "text-blue-400" : "text-primary")} />
                                {isMomentum ? "Minimal Commitment" : "Priority Mandate"}
                            </p>
                            <p className="text-sm font-bold text-text-primary">{topTask}</p>
                        </div>
                        <div className="h-12 w-[1px] bg-border-subtle hidden sm:block" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                <Brain className="w-3 h-3 text-success" /> Diagnostic Status
                            </p>
                            <p className="text-xs font-medium text-text-secondary max-w-xs">{shortDiagnostic}</p>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-auto">
                    <button
                        onClick={handleStart}
                        disabled={starting}
                        className={cn(
                            "w-full md:w-56 h-56 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all duration-500 hover:scale-105 active:scale-95 group/btn border disabled:opacity-80 disabled:cursor-not-allowed disabled:scale-100",
                            isDeepWork
                                ? "bg-primary text-white border-primary shadow-[0_0_50px_rgba(255,49,49,0.3)] hover:shadow-primary/50"
                                : isMomentum
                                    ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_50px_rgba(37,99,235,0.3)] hover:shadow-blue-500/50"
                                    : "bg-success text-black border-success shadow-[0_0_50px_rgba(0,214,143,0.3)] hover:shadow-success/50"
                        )}
                    >
                        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                            {starting ? (
                                <Loader2 className="w-10 h-10 animate-spin" />
                            ) : (
                                <Zap className={cn("w-10 h-10 fill-current", isMomentum ? "text-white" : isDeepWork ? "text-white" : "text-black")} />
                            )}
                        </div>
                        <div className="text-center">
                            <span className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">
                                {isMomentum ? "2-Minute Rule" : "Engage System"}
                            </span>
                            <span className="text-xl font-syne font-bold">
                                {starting ? 'Igniting...' : isMomentum ? "Start Starter" : isDeepWork ? "Start Session" : "Start Quick Win"}
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

function Target(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    )
}
