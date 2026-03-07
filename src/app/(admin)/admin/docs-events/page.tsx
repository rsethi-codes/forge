'use client'

import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Filter, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { getDocsEvents } from '@/lib/actions/admin'
import ForgeLoader from '@/components/ForgeLoader'

function fmt(ts: any) {
    try {
        return new Date(ts).toLocaleString()
    } catch {
        return String(ts)
    }
}

export default function AdminDocsEventsPage() {
    const [dayId, setDayId] = useState('')
    const [docId, setDocId] = useState('')
    const [sessionId, setSessionId] = useState('')
    const [limit, setLimit] = useState('200')

    const params = useMemo(() => ({
        dayId: dayId.trim() || undefined,
        docId: docId.trim() || undefined,
        sessionId: sessionId.trim() || undefined,
        limit: Number(limit) || 200,
    }), [dayId, docId, sessionId, limit])

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-docs-events', params],
        queryFn: () => getDocsEvents(params as any),
    })

    if (isLoading) {
        return <ForgeLoader title="Loading Docs Telemetry" subtitle="Querying docs_* event stream..." size="lg" />
    }

    if (error) {
        return (
            <div className="p-10">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                    <p className="text-sm font-bold text-red-200">Failed to load docs events.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-12">
            <header className="space-y-2">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.4em]">Section: Docs Intelligence</p>
                <h1 className="text-5xl font-syne font-black tracking-tighter">DOCS EVENT STREAM</h1>
                <p className="text-text-secondary text-sm max-w-2xl italic font-lora">
                    Filter and inspect `docs_*` app events.
                </p>
            </header>

            <section className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                    <Filter className="w-4 h-4" /> Filters
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-text-secondary/60">dayId</div>
                        <input
                            value={dayId}
                            onChange={(e) => setDayId(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs outline-none focus:border-red-500/40"
                            placeholder="uuid"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-text-secondary/60">docId</div>
                        <input
                            value={docId}
                            onChange={(e) => setDocId(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs outline-none focus:border-red-500/40"
                            placeholder="day_1_plan"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-text-secondary/60">sessionId</div>
                        <input
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs outline-none focus:border-red-500/40"
                            placeholder="uuid"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-text-secondary/60">limit</div>
                        <input
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs outline-none focus:border-red-500/40"
                            placeholder="200"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        <Search className="w-4 h-4" /> Apply
                    </button>
                </div>
            </section>

            <section className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">Events ({(data as any[])?.length || 0})</div>
                <div className="space-y-3">
                    {(data as any[] | undefined)?.map((e: any, i: number) => (
                        <motion.div
                            key={e.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.005 }}
                            className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-5"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="text-[10px] font-black uppercase tracking-widest text-red-500 truncate">{e.eventType}</div>
                                <div className="text-[10px] font-bold text-text-secondary flex-shrink-0">{fmt(e.createdAt)}</div>
                            </div>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div className="text-[11px] font-mono text-text-secondary">id: {e.id}</div>
                                <div className="text-[11px] font-mono text-text-secondary">user: {e.userId || '—'}</div>
                                <div className="text-[11px] font-mono text-text-secondary">session: {e.sessionId || '—'}</div>
                            </div>
                            <pre className="mt-3 text-[11px] text-text-secondary/80 bg-black/40 border border-white/5 rounded-xl p-4 overflow-auto">
{JSON.stringify(e.eventMeta || {}, null, 2)}
                            </pre>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    )
}
