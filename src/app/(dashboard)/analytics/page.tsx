'use client'

import React from 'react'
import { motion } from 'framer-motion'

// Data freshness is handled by React Query (staleTime 60s).
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
    Cell
} from 'recharts'
import {
    TrendingUp,
    Target,
    Award,
    Brain,
    Clock,
    CheckCircle2,
    Calendar,
    Zap,
    Loader2,
    FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

import { useQuery } from '@tanstack/react-query'

export default function AnalyticsPage() {
    const { data, isLoading: loading } = useQuery({
        queryKey: ['analytics-data'],
        queryFn: async () => {
            const response = await fetch('/api/stats/analytics')
            if (!response.ok) throw new Error('Failed to fetch analytics data')
            return response.json()
        },
        staleTime: 60 * 1000,
    })

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">Processing Performance Logs...</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">No analytics data available yet. Keep building.</p>
            </div>
        )
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-subtle">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-syne font-bold tracking-tighter">War Room</h1>
                    <p className="text-text-secondary text-lg">Detailed performance metrics and growth indicators.</p>
                </motion.div>
                <div className="flex gap-4">
                    <div className="bg-surface border border-border-subtle px-6 py-4 rounded-2xl text-center">
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Avg. Discipline</p>
                        <p className="text-2xl font-syne font-bold text-primary">{data.avgDiscipline ?? 0}%</p>
                    </div>
                    <div className="bg-surface border border-border-subtle px-6 py-4 rounded-2xl text-center">
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Articles</p>
                        <p className="text-2xl font-syne font-bold text-secondary">{data.blogCount ?? 0}</p>
                    </div>
                    <div className="bg-surface border border-border-subtle px-6 py-4 rounded-2xl text-center">
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Days Active</p>
                        <p className="text-2xl font-syne font-bold text-success">{data.streak ?? 0}</p>
                    </div>
                </div>
            </header>

            {/* Primary KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <section className="bg-surface border border-border-subtle p-8 rounded-3xl lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-syne font-bold text-xl flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Discipline Velocity
                            </h3>
                            <p className="text-xs text-text-secondary mt-1">7-day performance window</p>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.disciplineTrend}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff3131" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ff3131" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" stroke="#444" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '12px' }}
                                    itemStyle={{ color: '#ff3131' }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#ff3131" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="bg-surface border border-border-subtle p-8 rounded-3xl flex flex-col justify-between group">
                    <div className="space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            < Award className="w-8 h-8 text-primary group-hover:rotate-12 transition-transform" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-syne font-bold mb-2 uppercase tracking-tighter">Current Tier</h3>
                            <p className="text-7xl font-syne font-bold tracking-tighter italic decoration-2 underline-offset-8" style={{ color: data.currentTier?.color ?? '#ff3131' }}>
                                {data.currentTier?.tier ?? 'B'}
                            </p>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed font-medium">
                            Based on your latest activity. You are performing at <span className="text-text-primary font-bold">top-tier engineering standards</span>.
                        </p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-border-subtle space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold uppercase">
                            <span>Next Tier: {data.currentTier.tier === 'S' ? 'MAXED' : 'UPGRADE'}</span>
                            <span className="text-primary">{Math.min(100, data.avgDiscipline + 10)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-border-subtle rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, data.avgDiscipline + 10)}%` }} className="h-full bg-primary" />
                        </div>
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <section className="bg-surface border border-border-subtle p-6 rounded-3xl lg:col-span-2 space-y-6">
                    <h3 className="font-syne font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                        <Brain className="w-4 h-4 text-secondary" />
                        Knowledge Retention
                    </h3>
                    <div className="h-64 w-full">
                        {data.kcPerformance.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.kcPerformance} layout="vertical">
                                    <XAxis type="number" hide domain={[0, 100]} />
                                    <YAxis dataKey="topic" type="category" stroke="#888888" fontSize={10} width={80} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '12px' }}
                                    />
                                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                                        {data.kcPerformance.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#00d68f' : entry.score >= 70 ? '#f0b429' : '#ff3131'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-text-secondary text-xs uppercase font-bold">No retention data yet.</div>
                        )}
                    </div>
                </section>

                <section className="bg-surface border border-border-subtle p-6 rounded-3xl lg:col-span-2 space-y-6">
                    <h3 className="font-syne font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        Effort Audit
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.hoursData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                                <XAxis dataKey="day" stroke="#444" fontSize={8} axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '12px' }}
                                />
                                <Line type="step" dataKey="hours" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>

            {/* Extended Detail Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Task Type Performance */}
                <section className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] space-y-6">
                    <h3 className="font-syne font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Discipline Distribution
                    </h3>
                    <div className="space-y-4">
                        {data.taskStats.map((stat: any) => (
                            <div key={stat.type} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-bold text-text-secondary uppercase">{stat.type}</span>
                                    <span className="text-xs font-bold text-text-primary">{stat.completed}/{stat.total}</span>
                                </div>
                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stat.percentage}%` }}
                                        className={cn(
                                            "h-full transition-all duration-1000",
                                            stat.type === 'build' ? "bg-primary" : stat.type === 'study' ? "bg-secondary" : "bg-success"
                                        )}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Focus Session Audit */}
                <section className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] space-y-6">
                    <h3 className="font-syne font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Focus session audit
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                            <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest mb-1">Total Focus</p>
                            <p className="text-2xl font-syne font-bold">{Math.round((data.focusStats?.totalMinutes || 0) / 60)}H</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                            <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest mb-1">Sessions</p>
                            <p className="text-2xl font-syne font-bold">{data.focusStats?.sessionCount || 0}</p>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                        {(data.focusStats?.recentSessions || []).map((s: any) => (
                            <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-[10px] font-medium text-text-secondary">{s.time}</span>
                                <span className={cn(
                                    "text-[8px] font-bold px-1.5 py-0.5 rounded",
                                    s.status === 'Success' ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                                )}>{s.status}</span>
                            </div>
                        ))}
                        {(data.focusStats?.recentSessions || []).length === 0 && (
                            <p className="text-[10px] text-text-secondary text-center py-4">No recent focus blocks logged.</p>
                        )}
                    </div>
                </section>

                {/* Growth Velocity */}
                <section className="bg-primary/5 border-2 border-primary/20 p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[280px]">
                    <div className="space-y-4">
                        <h3 className="font-syne font-bold text-sm uppercase tracking-widest text-primary">Velocity Grade</h3>
                        <p className="text-6xl font-syne font-black tracking-tighter"
                            style={{ color: data.currentTier?.color || '#ff3131' }}>
                            {data.currentTier?.tier ?? 'B'}
                        </p>
                    </div>
                    <div className="pt-10 space-y-6">
                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest italic leading-relaxed max-w-xs">
                            &quot;Avg discipline {data.avgDiscipline}%. Tier {data.currentTier?.tier ?? 'B'}. Streak: {data.streak ?? 0} days.&quot;
                        </p>
                        <Link
                            href="/forge-chat"
                            className="w-full py-3 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 text-center hover:bg-red-600 transition-colors"
                        >
                            Ask Forge Mentor
                        </Link>
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Activity Heatmap */}
                <section className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-6 h-6 text-primary" />
                            <h3 className="text-xl font-syne font-bold uppercase tracking-tighter">Activity Heatmap</h3>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-text-secondary uppercase">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-primary" /> Done</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-500" /> WIP</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#0a0a0a] border border-border-subtle" /> Idle</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2">
                        {data.heatmapData.map((d: any) => (
                            <motion.div
                                key={d.day}
                                whileHover={{ scale: 1.2, zIndex: 10 }}
                                className={cn(
                                    "aspect-square rounded-md border flex items-center justify-center text-[8px] font-bold cursor-help transition-colors",
                                    d.status === 'complete' ? "bg-primary border-primary text-white" :
                                        d.status === 'in_progress' ? "bg-blue-500/20 border-blue-500/50 text-blue-500" :
                                            "bg-[#0a0a0a] border-border-subtle text-text-secondary/20"
                                )}
                                title={`Day ${d.day}: ${d.status}`}
                            >
                                {d.day}
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Content Metrics */}
                {data.blogStats && data.blogStats.length > 0 ? (
                    <section className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-secondary" />
                            <h3 className="text-xl font-syne font-bold uppercase tracking-tighter">Deep View Audit</h3>
                        </div>
                        <div className="space-y-4">
                            {data.blogStats.map((post: any) => (
                                <div key={post.id} className="p-4 bg-[#0a0a0a] border border-border-subtle rounded-2xl group hover:border-secondary/50 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-xs font-bold line-clamp-1 flex-1">{post.title}</h4>
                                        <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                                            {post.views} VIEWS
                                        </span>
                                    </div>
                                    <div className="w-full h-1 bg-border-subtle rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-secondary"
                                            style={{ width: `${Math.min(100, (post.views / 100) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link
                            href="/forge-chat"
                            className="w-full py-3 bg-surface-elevated border border-border-subtle rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-secondary transition-all text-center"
                        >
                            View Detailed Insights
                        </Link>
                    </section>
                ) : (
                    <section className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-text-secondary/40" />
                            <h3 className="text-xl font-syne font-bold uppercase tracking-tighter text-text-secondary/40">Deep View Audit</h3>
                        </div>
                        <div className="text-center py-12">
                            <p className="text-sm text-text-secondary/60 max-w-md mx-auto">
                                This stat becomes available once you write any blog post. Share your learning journey and track audience engagement here.
                            </p>
                        </div>
                    </section>
                )}
            </div>

            {/* Bottleneck Audit */}
            <section className="bg-surface-elevated border border-primary/20 p-8 rounded-3xl space-y-6">
                <div className="flex items-center gap-4">
                    <Zap className="w-8 h-8 text-primary" />
                    <div>
                        <h3 className="text-xl font-syne font-bold uppercase tracking-tighter">Bottleneck Analysis</h3>
                        <p className="text-sm text-text-secondary">AI-generated patterns from your logs</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {data.bottleneckInsights?.map((insight: any, idx: number) => (
                        <div key={insight.type} className={cn(
                            "bg-[#0a0a0a] border border-border-subtle p-5 rounded-2xl transition-all",
                            idx === 0 ? "hover:border-primary/30" : idx === 1 ? "hover:border-secondary/30" : "hover:border-success/30"
                        )}>
                            <div className={cn(
                                "flex items-center gap-2 text-xs font-bold uppercase mb-2",
                                idx === 0 ? "text-primary" : idx === 1 ? "text-secondary" : "text-success"
                            )}>
                                {idx === 0 ? <Target className="w-4 h-4" /> : idx === 1 ? <Brain className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                {insight.type}
                            </div>
                            <p className="text-sm font-medium leading-relaxed italic font-lora">
                                &quot;{insight.text}&quot;
                            </p>
                        </div>
                    ))}
                    {(!data.bottleneckInsights || data.bottleneckInsights.length === 0) && (
                        <p className="text-text-secondary text-sm italic col-span-3 text-center py-10">Initializing pattern analysis... Continue the build to generate insights.</p>
                    )}
                </div>
            </section>
        </div>
    )
}
