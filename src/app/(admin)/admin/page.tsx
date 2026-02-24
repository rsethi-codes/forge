'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getGlobalAnalytics } from '@/lib/actions/admin'
import {
    Users,
    BookOpen,
    Zap,
    Coins,
    Trash2,
    RefreshCcw,
    ChevronRight,
    Search,
    ShieldCheck
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function AdminDashboard() {
    const { data: analytics, isLoading } = useQuery({
        queryKey: ['admin-global-analytics'],
        queryFn: () => getGlobalAnalytics()
    })

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
            <Zap className="w-12 h-12 text-red-500 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Decrypting Command Center...</p>
        </div>
    )

    return (
        <div className="space-y-12">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.4em]">Protocol 00: Status Operational</p>
                    <h1 className="text-5xl font-syne font-black tracking-tighter">GLOBAL COMMAND</h1>
                </div>
                <div className="flex gap-4">
                    <div className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl flex flex-col items-center">
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">System Load</span>
                        <span className="text-2xl font-syne font-bold">1.2%</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex flex-col items-center">
                        <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest">Active Auth</span>
                        <span className="text-2xl font-syne font-bold text-success">VERIFIED</span>
                    </div>
                </div>
            </header>

            {/* High-Level Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Operatives', value: analytics?.stats.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Active Roadmaps', value: analytics?.stats.programs, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Neural Sessions', value: analytics?.stats.sessions, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                    { label: 'Vault Credits', value: analytics?.stats.vaultBalance, icon: Coins, color: 'text-success', bg: 'bg-success/10' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-red-500/30 transition-all shadow-2xl"
                    >
                        <div className={cn("absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-10 transition-all group-hover:opacity-30", stat.color.replace('text', 'bg'))} />
                        <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-4xl font-syne font-bold tracking-tight">{stat.value?.toLocaleString()}</h3>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* User Directory */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-syne font-bold uppercase tracking-tight flex items-center gap-2">
                            <Users className="w-5 h-5 text-red-500" /> Recent Operatives
                        </h2>
                        <button className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1 group">
                            Directory Full Access <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Identity</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary outline-none">Last Trace</th>
                                        <th className="px-8 py-5"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics?.recentUsers.map((user: any) => (
                                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold border border-white/10">
                                                        {user.fullName?.[0] || user.email[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-syne font-bold text-sm">{user.fullName || 'Anonymous Operative'}</div>
                                                        <div className="text-[10px] text-text-secondary lowercase">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    <span className="text-[10px] font-bold text-text-secondary uppercase">Operational</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-[10px] font-medium text-text-secondary uppercase">
                                                {new Date(user.updatedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="p-3 bg-white/5 hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* System Integrity & Deletions */}
                <div className="space-y-6">
                    <h2 className="text-xl font-syne font-bold uppercase tracking-tight flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-500" /> Data Restoration
                    </h2>

                    <div className="bg-[#0c0c0c] border border-red-500/20 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <ShieldCheck className="w-16 h-16 text-red-500/10" />
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Safety Net Active</p>
                            <h3 className="text-3xl font-syne font-bold tracking-tighter">
                                {analytics?.stats.deletedPrograms} Archived Records
                            </h3>
                            <p className="text-sm text-text-secondary leading-relaxed italic font-lora">
                                All user progress is buffered in the &quot;Soft Delete&quot; vault. You can restore any roadmap to its original state if accidently purged.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                                <RefreshCcw className="w-4 h-4" /> Open Vault Recovery
                            </button>
                        </div>
                    </div>

                    {/* Quick System Actions */}
                    <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8">
                        <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-6">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Clear Cache', icon: RefreshCcw },
                                { label: 'Audit Logs', icon: Trash2 },
                                { label: 'Verify Keys', icon: Zap },
                                { label: 'Sync DB', icon: RefreshCcw },
                            ].map(action => (
                                <button key={action.label} className="p-4 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 rounded-2xl flex flex-col items-center gap-2 transition-all group">
                                    <action.icon className="w-4 h-4 text-text-secondary group-hover:text-red-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
