'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, Clock, Zap, AlertTriangle, ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EndOfDaySummary {
    disciplineScore: number
    hoursLogged: number
    hoursTarget: number
    tasksCompleted: number
    tasksTotal: number
    weaknesses: string[]
    tomorrowPlan: {
        focus: string
        topTask: string
    }
}

interface EndOfDayModalProps {
    isOpen: boolean
    onClose: () => void
    summary: EndOfDaySummary
}

export default function EndOfDayModal({ isOpen, onClose, summary }: EndOfDayModalProps) {
    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-[#0c0c0c] border border-primary/20 w-full max-w-4xl rounded-[3rem] overflow-hidden relative shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-10 border-b border-border-subtle bg-gradient-to-r from-primary/5 to-transparent flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="inline-flex px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Daily Briefing Concluded</span>
                            </div>
                            <h2 className="text-4xl font-syne font-bold tracking-tighter text-text-primary">Performance Debrief</h2>
                        </div>
                        <button onClick={onClose} className="p-3 rounded-full hover:bg-surface-elevated transition-colors">
                            <X className="w-6 h-6 text-text-secondary" />
                        </button>
                    </div>

                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Highlights */}
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-surface-elevated rounded-3xl border border-border-subtle">
                                    <div className="flex items-center gap-3 mb-4">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Discipline</span>
                                    </div>
                                    <p className="text-4xl font-syne font-bold text-text-primary italic">
                                        {summary.disciplineScore}<span className="text-lg opacity-50 not-italic">/100</span>
                                    </p>
                                </div>
                                <div className="p-6 bg-surface-elevated rounded-3xl border border-border-subtle">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Clock className="w-5 h-5 text-blue-500" />
                                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Efficiency</span>
                                    </div>
                                    <p className="text-4xl font-syne font-bold text-text-primary italic">
                                        {Math.round((summary.hoursLogged / summary.hoursTarget) * 100)}<span className="text-lg opacity-50 not-italic">%</span>
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" /> Critical Weaknesses
                                </h4>
                                <div className="space-y-3">
                                    {summary.weaknesses.map((w, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2" />
                                            <p className="text-xs font-medium text-text-secondary leading-relaxed">{w}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Future Plan */}
                        <div className="space-y-8">
                            <div className="p-8 bg-primary rounded-[2.5rem] relative overflow-hidden group shadow-2xl shadow-primary/20">
                                <ShieldCheck className="absolute -bottom-8 -right-8 w-40 h-40 text-black/10 transition-transform group-hover:scale-110" />
                                <div className="relative z-10 space-y-6">
                                    <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Tomorrow's Mandate</h4>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-white/80 uppercase">Primary Objective</p>
                                        <p className="text-xl font-syne font-bold text-white leading-tight">{summary.tomorrowPlan.focus}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-white/80 uppercase">Target Task</p>
                                        <p className="text-sm font-bold text-white">{summary.tomorrowPlan.topTask}</p>
                                    </div>
                                    <button className="w-full h-14 bg-white rounded-2xl text-black font-bold flex items-center justify-center gap-3 hover:bg-white/90 transition-all active:scale-95">
                                        Pre-commit to Protocol <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 border border-border-subtle rounded-3xl flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Execution Rate</p>
                                    <p className="text-sm font-bold text-text-primary">{summary.tasksCompleted} / {summary.tasksTotal} Tasks Cleared</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success">
                                    <Zap className="w-6 h-6 fill-current" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
