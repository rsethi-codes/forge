'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ChevronRight,
    Clock,
    CheckCircle2,
    Circle,
    AlertCircle,
    Map as MapIcon,
    ChevronDown,
    Loader2
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { getTrackerData } from '@/lib/actions/roadmap'
import { listRoadmaps, setActiveRoadmap } from '@/lib/actions/roadmap-mgmt'
import PageWrapper from '@/components/PageWrapper'

// Data freshness is managed by React Query.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function RoadmapOverview() {
    const [activeMonth, setActiveMonth] = useState(1)
    const router = useRouter()
    const queryClient = useQueryClient()

    // Query for tracker data (month-based)
    const { data, isLoading: loading } = useQuery({
        queryKey: ['tracker', activeMonth],
        queryFn: async () => {
            const response = await fetch(`/api/roadmap/tracker?month=${activeMonth}`)
            if (!response.ok) throw new Error('Failed to fetch tracker data')
            return response.json()
        },
        staleTime: 5 * 60 * 1000,
    })

    // Query for roadmaps list
    const { data: roadmaps = [] } = useQuery({
        queryKey: ['roadmaps-list'],
        queryFn: async () => {
            const response = await fetch('/api/roadmap/list')
            if (!response.ok) throw new Error('Failed to fetch roadmaps')
            return response.json()
        },
    })

    const activeRoadmapId = data?.month?.programId || null

    // Mutation for switching roadmaps
    const switchMutation = useMutation({
        mutationFn: async (id: string) => {
            await setActiveRoadmap(id)
        },
        onSuccess: () => {
            // Refetch everything to stay synced
            queryClient.invalidateQueries({ queryKey: ['tracker'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] })
            queryClient.invalidateQueries({ queryKey: ['sidebar-stats'] })
            router.refresh()
        }
    })

    const handleSwitchRoadmap = (id: string) => {
        if (id === activeRoadmapId) return
        switchMutation.mutate(id)
    }

    const switching = switchMutation.isPending

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
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-syne font-black tracking-tighter uppercase mb-4 leading-none">Campaign Map</h1>
                        <p className="text-text-secondary text-lg font-medium opacity-60">Strategic oversight of your 60-day neural transformation.</p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex gap-2 p-1.5 bg-[#0c0c0c] border border-white/5 rounded-[1.5rem] w-fit">
                            {(data?.containers || [1, 2]).map((c: any) => {
                                const num = typeof c === 'number' ? c : (c.phaseNumber || c.monthNumber)
                                return (
                                    <button
                                        key={num}
                                        onClick={() => setActiveMonth(num)}
                                        className={cn(
                                            "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                            activeMonth === num
                                                ? "bg-primary text-white shadow-xl shadow-primary/20"
                                                : "text-text-secondary hover:text-white"
                                        )}
                                    >
                                        {data?.containerType || 'Phase'} {num < 10 ? `0${num}` : num}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="bg-primary/5 border border-primary/20 px-6 py-3 rounded-[1.5rem] flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-primary uppercase tracking-widest">Global Progress</span>
                                <span className="text-sm font-black text-text-primary">{((data?.month?.daysComplete || 0) / 60 * 100).toFixed(0)}% Curated</span>
                            </div>
                            <div className="w-24 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((data?.month?.daysComplete || 0) / 60 * 100)}%` }}
                                    className="h-full bg-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:items-end gap-3 min-w-[280px]">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">Active Neural Program</span>
                    <div className="relative w-full">
                        <select
                            value={activeRoadmapId || ''}
                            disabled={switching}
                            onChange={(e) => handleSwitchRoadmap(e.target.value)}
                            className="w-full bg-[#0c0c0c] border-2 border-white/5 group-hover:border-primary/40 px-6 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest outline-none transition-all appearance-none cursor-pointer pr-12"
                        >
                            {roadmaps.length === 0 && <option value="">No Programs Found</option>}
                            {roadmaps.map((rm: any) => (
                                <option key={rm.id} value={rm.id}>
                                    {rm.title}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                            {switching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </div>
                </div>
            </header>

            {data?.month && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/5 border border-primary/20 rounded-3xl p-8"
                >
                    <h2 className="text-xl font-syne font-bold text-primary mb-2 uppercase tracking-tighter">
                        {data?.containerType || 'Phase'} {activeMonth} Objective
                    </h2>
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
                        <Link href="/setup" className="inline-flex items-center gap-2 text-primary font-bold hover:underline mt-4">
                            Go to Forge Armory <ChevronRight className="w-4 h-4" />
                        </Link>
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
                                                <div className="flex items-center justify-center w-5 h-5">
                                                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                                                </div>
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
                                                    animate={{ width: `${day.isComplete ? 100 : (day.completionRate ?? 0)}%` }}
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
