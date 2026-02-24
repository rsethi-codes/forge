'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDatabaseTrace } from '@/lib/actions/admin'
import { Database, AlertTriangle, Layers } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminDbPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-db-trace'],
        queryFn: () => getDatabaseTrace(),
    })

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
                <Database className="w-12 h-12 text-red-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Tracing Database Footprint...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-10">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <p className="text-sm font-bold text-red-200">Failed to load DB trace.</p>
                    </div>
                </div>
            </div>
        )
    }

    const counts = data?.counts || {}
    const items = Object.entries(counts)

    return (
        <div className="space-y-12">
            <header className="space-y-2">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.4em]">Section: Database Trace</p>
                <h1 className="text-5xl font-syne font-black tracking-tighter">DB FOOTPRINT</h1>
                <p className="text-text-secondary text-sm max-w-2xl italic font-lora">
                    High-level table counts + latest program snapshot.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {items.map(([k, v], i) => (
                            <motion.div
                                key={k}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2.5rem]"
                            >
                                <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{k}</div>
                                <div className="text-4xl font-syne font-bold tracking-tight mt-2">{Number(v).toLocaleString()}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-syne font-bold uppercase tracking-tight flex items-center gap-2">
                        <Layers className="w-5 h-5 text-red-500" /> Latest Program
                    </h2>
                    <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 space-y-3">
                        {data?.latestProgram ? (
                            <>
                                <div className="text-sm font-syne font-bold">{data.latestProgram.title}</div>
                                <div className="text-xs font-mono text-text-secondary">ID: {data.latestProgram.id}</div>
                                <div className="text-xs font-mono text-text-secondary">Created: {new Date(data.latestProgram.createdAt).toLocaleString()}</div>
                                <div className="text-xs font-mono text-text-secondary">Deleted: {data.latestProgram.deletedAt ? new Date(data.latestProgram.deletedAt).toLocaleString() : '—'}</div>
                            </>
                        ) : (
                            <div className="text-text-secondary text-sm">No programs found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
