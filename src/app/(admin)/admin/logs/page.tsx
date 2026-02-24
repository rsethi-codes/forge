'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSystemLogs } from '@/lib/actions/admin'
import { Activity, AlertTriangle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

function fmt(ts: any) {
    try {
        return new Date(ts).toLocaleString()
    } catch {
        return String(ts)
    }
}

export default function AdminLogsPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-system-logs'],
        queryFn: () => getSystemLogs(50),
    })

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
                <Activity className="w-12 h-12 text-red-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Streaming System Logs...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-10">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <p className="text-sm font-bold text-red-200">Failed to load logs.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-12">
            <header className="space-y-2">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.4em]">Section: System Logs</p>
                <h1 className="text-5xl font-syne font-black tracking-tighter">EVENT STREAM</h1>
                <p className="text-text-secondary text-sm max-w-2xl italic font-lora">
                    Recent activity across sessions, app events, and analytics events.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <section className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-syne font-bold uppercase tracking-tight flex items-center gap-2">
                        <Clock className="w-5 h-5 text-red-500" /> Sessions
                    </h2>
                    <div className="space-y-3">
                        {data?.sessions?.map((s: any, i: number) => (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-5"
                            >
                                <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{s.id}</div>
                                <div className="text-xs font-mono text-text-secondary mt-2">User: {s.userId}</div>
                                <div className="text-xs font-mono text-text-secondary">Start: {fmt(s.startedAt)}</div>
                                <div className="text-xs font-mono text-text-secondary">End: {s.endedAt ? fmt(s.endedAt) : '—'}</div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-syne font-bold uppercase tracking-tight flex items-center gap-2">
                        <Activity className="w-5 h-5 text-red-500" /> App Events
                    </h2>
                    <div className="space-y-3">
                        {data?.appEvents?.map((e: any, i: number) => (
                            <motion.div
                                key={e.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.01 }}
                                className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-5"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-red-500">{e.eventType}</div>
                                    <div className="text-[10px] font-bold text-text-secondary">{fmt(e.createdAt)}</div>
                                </div>
                                <div className="text-xs font-mono text-text-secondary mt-2">User: {e.userId}</div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-syne font-bold uppercase tracking-tight flex items-center gap-2">
                        <Activity className="w-5 h-5 text-red-500" /> Analytics Events
                    </h2>
                    <div className="space-y-3">
                        {data?.analyticsEvents?.map((e: any, i: number) => (
                            <motion.div
                                key={e.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.01 }}
                                className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-5"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-red-500">{e.event}</div>
                                    <div className="text-[10px] font-bold text-text-secondary">{fmt(e.timestamp)}</div>
                                </div>
                                <div className="text-xs font-mono text-text-secondary mt-2">User: {e.userId || '—'}</div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
