
'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Zap,
    Target,
    ArrowRight,
    X,
    Trophy,
    Flame,
    Quote
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DailyBriefingModalProps {
    isOpen: boolean
    onClose: () => void
    stats: any
}

export default function DailyBriefingModal({ isOpen, onClose, stats }: DailyBriefingModalProps) {
    if (!stats) return null

    const quotes = [
        { text: "The forge is cold until you strike.", author: "Forge AI" },
        { text: "Consistency is the only superpower that matters.", author: "Discipline Engine" },
        { text: "Code is temporary. Systemic habits are forever.", author: "The Architect" }
    ]
    const quote = quotes[Math.floor(Math.random() * quotes.length)]

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(255,49,49,0.15)]"
                    >
                        {/* Header Image/Pattern */}
                        <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent relative">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                            <div className="absolute bottom-4 left-8">
                                <h2 className="text-4xl font-syne font-black tracking-tighter uppercase">MORNING BRIEFING</h2>
                                <p className="text-xs font-bold text-primary tracking-[0.3em] uppercase opacity-70">Protocol Day {stats.day}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all"
                            >
                                <X className="w-6 h-6 text-text-secondary" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Streak</span>
                                    <div className="flex items-center gap-2">
                                        <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />
                                        <span className="text-lg font-black">{stats.streak} Days</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Global Rank</span>
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-amber-400" />
                                        <span className="text-lg font-black">Top 4%</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Discipline</span>
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-primary" />
                                        <span className="text-lg font-black">{stats.disciplineScore}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Today's Target */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Target className="w-6 h-6 text-primary" />
                                    <h3 className="text-xl font-syne font-bold uppercase tracking-tighter">Primary Objective</h3>
                                </div>
                                <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl space-y-2">
                                    <h4 className="text-xl font-bold text-text-primary leading-tight">
                                        {stats.dayTitle || "Module Optimization & System Integration"}
                                    </h4>
                                    <p className="text-sm text-text-secondary italic font-lora">
                                        &quot;{stats.focus}&quot;
                                    </p>
                                </div>
                                {stats.topTask && (
                                    <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <div className="p-2 bg-primary/20 rounded-lg">
                                            <Zap className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Initialization Point</p>
                                            <p className="text-sm font-bold text-text-primary">{stats.topTask}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quote Section */}
                            <div className="pt-4 border-t border-white/5 text-center space-y-2">
                                <Quote className="w-6 h-6 text-primary mx-auto opacity-40" />
                                <p className="text-lg font-lora italic text-text-primary">
                                    &quot;{quote.text}&quot;
                                </p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                                    — {quote.author}
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full bg-primary hover:bg-red-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-xs"
                            >
                                Engage Protocol <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
