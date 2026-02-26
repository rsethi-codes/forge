'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BookOpen,
    Calendar,
    Search,
    Filter,
    MoreVertical,
    ArrowRight,
    Zap,
    Quote,
    Loader2,
    Clock,
    Target
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getReflections } from '@/lib/actions/day'
import PageWrapper from '@/components/PageWrapper'

export default function ReflectionsPage() {
    const [searchQuery, setSearchQuery] = useState('')

    const { data: reflections = [], isLoading } = useQuery({
        queryKey: ['reflections'],
        queryFn: () => getReflections(),
        staleTime: 5 * 60 * 1000
    })

    const filteredReflections = reflections.filter(r =>
        r.reflection?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.dayTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.focus?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (isLoading) {
        return (
            <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-text-secondary font-bold tracking-widest uppercase text-xs">Retrieving neural logs...</p>
            </div>
        )
    }

    return (
        <PageWrapper>
            <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-12">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-secondary" />
                            <span className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">War Logs & Reflections</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-syne font-black tracking-tighter uppercase leading-none">The Neural Archive</h1>
                        <p className="text-text-secondary text-lg max-w-xl font-medium opacity-60">Complete history of your end-of-day strategic audits and breakthroughs.</p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Filter archives..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-white/5 rounded-2xl py-3 px-12 text-xs font-bold uppercase tracking-widest focus:border-secondary outline-none transition-all placeholder:text-text-secondary/30"
                        />
                    </div>
                </header>

                {filteredReflections.length === 0 ? (
                    <div className="py-20 text-center space-y-6 bg-surface border border-dashed border-border-subtle rounded-[3rem]">
                        <Quote className="w-12 h-12 text-text-secondary/20 mx-auto" />
                        <div className="space-y-2">
                            <h2 className="text-xl font-syne font-bold uppercase tracking-tight">Archives are Empty</h2>
                            <p className="text-text-secondary text-sm max-w-xs mx-auto">You haven&apos;t logged any reflections yet. Complete a day in the forge to start your legacy.</p>
                        </div>
                        <Link href="/tracker" className="inline-flex items-center gap-2 bg-secondary text-black px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all">
                            Go to Day Tracker <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {filteredReflections.map((r, idx) => (
                            <motion.div
                                key={r.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-surface border border-border-subtle rounded-[2.5rem] p-8 md:p-10 hover:border-secondary/30 transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                    <Quote className="w-40 h-40" />
                                </div>

                                <div className="flex flex-col md:flex-row gap-10">
                                    <div className="md:w-48 shrink-0 space-y-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest block">Day {r.dayNumber}</span>
                                            <h3 className="text-sm font-black uppercase tracking-tighter leading-tight">{r.dayTitle}</h3>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(r.date), 'MMM dd, yyyy')}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase">
                                                <Target className="w-3 h-3" />
                                                <span className="truncate max-w-[120px]">{r.focus}</span>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/tracker/day/${r.dayNumber}`}
                                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-secondary hover:underline group-hover:gap-3 transition-all pt-4"
                                        >
                                            View Day Detail <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>

                                    <div className="flex-1 relative">
                                        <Quote className="w-8 h-8 text-secondary/20 absolute -top-4 -left-4" />
                                        <div className="text-text-primary text-lg md:text-xl font-lora italic leading-relaxed whitespace-pre-wrap pl-4 border-l border-white/5">
                                            &quot;{r.reflection}&quot;
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                <footer className="pt-20 pb-10 flex flex-col items-center gap-6 text-center">
                    <div className="w-12 h-[1px] bg-white/10" />
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.4em]">End of Archive</p>
                    <div className="bg-secondary/5 border border-secondary/20 p-8 rounded-[2rem] max-w-2xl">
                        <Zap className="w-8 h-8 text-secondary mx-auto mb-4 animate-pulse" />
                        <p className="text-sm font-medium italic text-text-secondary leading-relaxed">
                            &quot;Reflection is the bridge between activity and achievement. Every entry here is a brick in your cognitive fortress.&quot;
                        </p>
                    </div>
                </footer>
            </div>
        </PageWrapper>
    )
}
