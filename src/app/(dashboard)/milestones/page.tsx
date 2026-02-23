'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// Data freshness managed by React Query (staleTime 5min).
import { Trophy, Lock, Calendar, Zap, Target, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAllMilestones } from '@/lib/milestones'
import { format } from 'date-fns'
import PageWrapper from '@/components/PageWrapper'

import { useQuery } from '@tanstack/react-query'

export default function MilestonesPage() {
    const { data: milestones = [], isLoading: loading } = useQuery({
        queryKey: ['milestones-list'],
        queryFn: async () => {
            const response = await fetch('/api/milestones/list')
            if (!response.ok) throw new Error('Failed to fetch milestones')
            return response.json()
        },
        staleTime: 5 * 60 * 1000,
    })

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">Accessing Hall of Records...</p>
            </div>
        )
    }

    const unlocked = milestones.filter((m: any) => m.achievedAt)
    const locked = milestones.filter((m: any) => !m.achievedAt)

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-subtle">
                <div>
                    <h1 className="text-4xl md:text-5xl font-syne font-bold tracking-tighter">Legacy Archive</h1>
                    <p className="text-text-secondary text-lg">A permanent record of your evolution and consistency.</p>
                </div>
                <div className="bg-surface border border-border-subtle px-6 py-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Total Unlocked</p>
                    <p className="text-2xl font-syne font-bold text-primary">{unlocked.length} / {milestones.length}</p>
                </div>
            </header>

            <section className="space-y-8">
                <h2 className="text-xl font-syne font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                    <Trophy className="w-5 h-5" /> Unlocked Achievements
                </h2>
                {unlocked.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {unlocked.map((m: any, i: number) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-surface border-2 border-primary/20 p-8 rounded-[2.5rem] relative group overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-colors" />

                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                                            {m.icon || '🎖️'}
                                        </div>
                                        <CheckCircle2 className="w-6 h-6 text-success" />
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-syne font-bold tracking-tighter">{m.title}</h3>
                                        <p className="text-sm text-text-secondary font-lora italic leading-relaxed">
                                            &quot;{m.description}&quot;
                                        </p>
                                        {m.reward && (
                                            <div className="mt-4 py-1.5 px-3 bg-success/10 border border-success/20 rounded-xl inline-block">
                                                <span className="text-[10px] font-bold text-success uppercase tracking-[0.2em]">Claimed Reward: {m.reward}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                                        <span>Unlocked On</span>
                                        <span className="text-text-primary">{format(new Date(m.achievedAt), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center bg-surface border border-dashed border-border-subtle rounded-[2.5rem]">
                        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">The grind has yet to yield its first trophy.</p>
                    </div>
                )}
            </section>

            <section className="space-y-8">
                <h2 className="text-xl font-syne font-bold uppercase tracking-widest flex items-center gap-2 text-text-secondary">
                    <Lock className="w-5 h-5" /> Locked Milestones
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {locked.map((m: any) => (
                        <div key={m.id} className="bg-surface/40 border border-border-subtle p-6 rounded-3xl group grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
                            <div className="space-y-4">
                                <div className="inline-flex p-3 bg-surface-elevated border border-border-subtle rounded-xl text-2xl">
                                    {m.icon || '🎖️'}
                                </div>
                                <div>
                                    <h4 className="font-syne font-bold text-sm uppercase tracking-tighter">{m.title}</h4>
                                    <p className="text-[10px] text-text-secondary mt-1 line-clamp-2">{m.description}</p>
                                    {m.reward && (
                                        <div className="mt-2 py-1 px-2 bg-success/10 border border-success/20 rounded-lg inline-block">
                                            <span className="text-[9px] font-bold text-success uppercase tracking-widest">Potential Reward: {m.reward}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-4 flex items-center gap-2">
                                    <div className="h-1 flex-1 bg-border-subtle rounded-full overflow-hidden">
                                        <div className="h-full bg-primary/20" style={{ width: '0%' }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-text-secondary">
                                        {m.criteriaValue} {m.criteriaType?.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
