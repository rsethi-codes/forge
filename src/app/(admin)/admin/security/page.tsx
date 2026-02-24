'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSecurityOverview } from '@/lib/actions/admin'
import { ShieldCheck, AlertTriangle, Lock, KeyRound } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function AdminSecurityPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-security-overview'],
        queryFn: () => getSecurityOverview(),
    })

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
                <Lock className="w-12 h-12 text-red-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Verifying Security Posture...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-10">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <p className="text-sm font-bold text-red-200">Failed to load security overview.</p>
                    </div>
                </div>
            </div>
        )
    }

    const required = data?.required || {}
    const rows = Object.entries(required)

    return (
        <div className="space-y-12">
            <header className="space-y-2">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.4em]">Section: Vault Security</p>
                <h1 className="text-5xl font-syne font-black tracking-tighter">SECURITY POSTURE</h1>
                <p className="text-text-secondary text-sm max-w-2xl italic font-lora">
                    This panel validates runtime configuration and access controls. It does not expose secrets.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-syne font-bold uppercase tracking-tight flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-red-500" /> Env & Access Requirements
                    </h2>

                    <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Signal</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(([key, ok], i) => (
                                        <motion.tr
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            key={key}
                                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-8 py-5 text-sm font-mono">{key}</td>
                                            <td className="px-8 py-5">
                                                <div className={cn(
                                                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border',
                                                    ok ? 'bg-success/10 text-success border-success/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                )}>
                                                    {ok ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                    {ok ? 'OK' : 'MISSING'}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-syne font-bold uppercase tracking-tight flex items-center gap-2">
                        <Lock className="w-5 h-5 text-red-500" /> Guardrails
                    </h2>

                    <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Allowed User Email</div>
                        <div className="font-mono text-sm">{data?.allowedUserEmail || 'NOT SET'}</div>
                    </div>

                    <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Demo Mode</div>
                        <div className={cn(
                            'text-[10px] font-black uppercase tracking-widest',
                            data?.demoMode ? 'text-amber-400' : 'text-success'
                        )}>
                            {data?.demoMode ? 'ENABLED (Local only recommended)' : 'DISABLED'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
