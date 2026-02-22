'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export const dynamic = 'force-dynamic'
import { ChevronRight, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

import { getTrackerData } from '@/lib/actions/roadmap'

export default function RoadmapOverview() {
    const [activeMonth, setActiveMonth] = useState(1)
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        getTrackerData(activeMonth).then(res => {
            setData(res)
            setLoading(false)
        })
    }, [activeMonth])

    if (loading) {
        return (
            <div className="p-10 space-y-8 animate-pulse">
                <div className="h-12 w-64 bg-surface-elevated rounded-xl"></div>
                <div className="flex gap-4">
                    <div className="h-10 w-32 bg-surface-elevated rounded-lg"></div>
                    <div className="h-10 w-32 bg-surface-elevated rounded-lg"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-48 bg-surface-elevated rounded-3xl"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
            <header>
                <h1 className="text-4xl font-syne font-bold tracking-tighter mb-4">Training Timeline</h1>
                <div className="flex gap-2 p-1 bg-surface rounded-xl w-fit">
                    <button
                        onClick={() => setActiveMonth(1)}
                        className={cn(
                            "px-6 py-2 rounded-lg font-bold transition-all",
                            activeMonth === 1 ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-secondary hover:text-text-primary"
                        )}
                    >
                        Month 1
                    </button>
                    <button
                        onClick={() => setActiveMonth(2)}
                        className={cn(
                            "px-6 py-2 rounded-lg font-bold transition-all",
                            activeMonth === 2 ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-secondary hover:text-text-primary"
                        )}
                    >
                        Month 2
                    </button>
                </div>
            </header>

            {data?.month && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/5 border border-primary/20 rounded-3xl p-8"
                >
                    <h2 className="text-xl font-syne font-bold text-primary mb-2 uppercase tracking-tighter">Month {activeMonth} Objective</h2>
                    <p className="text-text-secondary leading-relaxed font-lora italic text-lg">
                        {data.month.objective}
                    </p>
                </motion.section>
            )}

            <div className="space-y-16">
                {(!data || data.weeks.length === 0) ? (
                    <div className="bg-surface border border-border-subtle p-12 rounded-[2.5rem] text-center space-y-4">
                        <AlertCircle className="w-12 h-12 text-text-secondary mx-auto" />
                        <h2 className="text-2xl font-syne font-bold">Plan Not Found for Month {activeMonth}</h2>
                        <p className="text-text-secondary">It seems the parser missed this month or the roadmap is shorter than expected.</p>
                    </div>
                ) : (
                    data.weeks.map((week: any) => (
                        <section key={week.id} className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-3xl font-syne font-bold text-text-primary whitespace-nowrap">Week {week.weekNumber}</h2>
                                    <div className="h-[1px] flex-1 bg-border-subtle"></div>
                                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest bg-surface px-4 py-1 rounded-full border border-border-subtle">
                                        {week.title}
                                    </span>
                                </div>
                                {week.goal && (
                                    <p className="text-sm text-text-secondary max-w-3xl border-l-2 border-primary/30 pl-4 py-1 italic">
                                        {week.goal}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {week.days.map((day: any) => (
                                    <motion.div
                                        key={day.id}
                                        whileHover={{ y: -5 }}
                                        className={cn(
                                            "group relative bg-surface border rounded-3xl p-6 transition-all hover:border-primary/50",
                                            day.isCurrent && "ring-2 ring-primary ring-offset-4 ring-offset-[#0a0a0a]",
                                            !day.isComplete && !day.isCurrent && "opacity-60 grayscale-[0.5]"
                                        )}
                                    >
                                        <Link href={`/tracker/day/${day.dayNumber}`} className="absolute inset-0 z-10" />

                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Day {day.dayNumber}</span>
                                            {day.isComplete ? (
                                                <CheckCircle2 className="w-5 h-5 text-success" />
                                            ) : day.isCurrent ? (
                                                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-border-subtle" />
                                            )}
                                        </div>

                                        <h3 className="font-syne font-bold text-lg mb-4 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                            {day.title}
                                        </h3>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary uppercase">
                                                <span>Estimated</span>
                                                <span>{day.estimatedHours}h Study</span>
                                            </div>
                                            <div className="w-full h-1 bg-border-subtle rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: day.isComplete ? '100%' : '0%' }}
                                                    className="h-full bg-primary"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-text-secondary">
                                                <Clock className="w-3 h-3" />
                                                <span className="text-[10px] font-bold">{day.focus || 'Focus Area Pending'}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-text-secondary group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>
        </div>
    )
}
