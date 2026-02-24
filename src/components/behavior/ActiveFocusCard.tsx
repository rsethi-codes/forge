'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, ArrowRight, Timer, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ActiveFocusCardProps {
    title: string
    status: 'running' | 'paused'
    dayNumber: string
    type: 'task' | 'topic'
    id: string
}

export default function ActiveFocusCard({
    title,
    status,
    dayNumber,
    type,
    id
}: ActiveFocusCardProps) {
    const isRunning = status === 'running'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-[#0a0a0a] border rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl",
                isRunning ? "border-emerald-500/30" : "border-amber-500/30"
            )}
        >
            {/* Ambient Glow */}
            <div className={cn(
                "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-20 transition-all duration-1000",
                isRunning ? "bg-emerald-500" : "bg-amber-500"
            )} />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "h-10 px-4 border rounded-full flex items-center gap-2",
                            isRunning ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"
                        )}>
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                isRunning ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                            )} />
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                isRunning ? "text-emerald-400" : "text-amber-400"
                            )}>
                                {isRunning ? "Active Focus" : "Paused Mission"}
                            </span>
                        </div>
                        <div className="h-10 px-4 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                            <Timer className="w-4 h-4 text-text-secondary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Day {dayNumber}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-4xl md:text-5xl font-syne font-bold tracking-tighter text-text-primary leading-tight">
                            {title}
                        </h2>
                        <p className="text-lg text-text-secondary font-medium font-lora italic">
                            {isRunning ? "Maintaining peak cognitive performance." : "Ready to re-engage? Momentum is waiting."}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                        <Zap className="w-3 h-3 text-primary" />
                        Quick Access: Day Tracker
                    </div>
                </div>

                <div className="w-full md:w-auto">
                    <Link
                        href={`/tracker/day/${dayNumber}`}
                        className={cn(
                            "w-full md:w-56 h-56 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all duration-500 hover:scale-105 active:scale-95 group/btn border",
                            isRunning
                                ? "bg-emerald-600 text-white border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] hover:shadow-emerald-500/50"
                                : "bg-amber-600 text-white border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.3)] hover:shadow-amber-500/50"
                        )}
                    >
                        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                            {isRunning ? (
                                <Zap className="w-10 h-10 text-white fill-current" />
                            ) : (
                                <Play className="w-10 h-10 text-white fill-current translate-x-0.5" />
                            )}
                        </div>
                        <div className="text-center">
                            <span className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">
                                {isRunning ? "Stay in Zone" : "Protocol Restart"}
                            </span>
                            <span className="text-xl font-syne font-bold">
                                {isRunning ? "Resume Task" : "Continue Work"}
                            </span>
                        </div>
                    </Link>
                </div>
            </div>
        </motion.div>
    )
}
