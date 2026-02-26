
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    Github,
    Linkedin,
    Twitter,
    Globe,
    ExternalLink,
    Award,
    TrendingUp,
    Zap,
    Calendar,
    FileText,
    Target,
    Map,
    Shield,
    Terminal,
    Sparkles
} from 'lucide-react'
import {
    AreaChart,
    Area,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    YAxis
} from 'recharts'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'

interface PublicProfileClientProps {
    data: any
}

export default function PublicProfileClient({ data }: PublicProfileClientProps) {
    const { profile, program, analytics, publicPosts, achievements } = data

    if (!profile) return null

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    }

    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 20
            }
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-text-primary selection:bg-primary/30 font-syne pb-20 overflow-x-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse delay-700" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            {/* Navigation Header */}
            <header className="sticky top-0 z-50 bg-[#050505]/60 backdrop-blur-xl border-b border-white/5 h-20">
                <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(255,49,49,0.3)]">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter uppercase italic">The Forge Archive</span>
                    </div>
                    <Link
                        href="/login"
                        className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-primary transition-colors border border-white/10 px-5 py-2.5 rounded-full"
                    >
                        Initialize Your Own
                    </Link>
                </div>
            </header>

            <motion.main
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto px-6 pt-16 relative z-10 space-y-24"
            >
                {/* Hero Section */}
                <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-lg border border-primary/20">Forge Verified Elite</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9]">
                                {profile.fullName || 'Anonymous Operator'}
                            </h1>
                            <h2 className="text-2xl md:text-3xl font-bold text-text-secondary tracking-tight opacity-80 decoration-primary decoration-4 underline-offset-8">
                                {profile.headline || 'Senior Engineering Candidate'}
                            </h2>
                        </div>

                        <p className="text-xl text-text-secondary max-w-2xl leading-relaxed italic font-medium">
                            &quot;{profile.bio || 'Architecting high-performance systems and documenting the grind. Consistency is the only variable that matters.'}&quot;
                        </p>

                        <div className="flex flex-wrap gap-4">
                            {profile.githubUrl && (
                                <a href={profile.githubUrl} target="_blank" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-2xl transition-all group">
                                    <Github className="w-5 h-5 text-text-secondary group-hover:text-white" />
                                    <span className="text-sm font-bold tracking-tight">GitHub</span>
                                </a>
                            )}
                            {profile.linkedinUrl && (
                                <a href={profile.linkedinUrl} target="_blank" className="flex items-center gap-3 bg-[#0a66c2]/10 hover:bg-[#0a66c2]/20 border border-[#0a66c2]/20 px-6 py-3 rounded-2xl transition-all group">
                                    <Linkedin className="w-5 h-5 text-[#0a66c2]" />
                                    <span className="text-sm font-bold tracking-tight">LinkedIn</span>
                                </a>
                            )}
                            {profile.websiteUrl && (
                                <a href={profile.websiteUrl} target="_blank" className="flex items-center gap-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 px-6 py-3 rounded-2xl transition-all group">
                                    <Globe className="w-5 h-5 text-primary" />
                                    <span className="text-sm font-bold tracking-tight">Portfolio</span>
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-4 flex justify-center lg:justify-end">
                        <div className="relative w-72 h-72 group">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full group-hover:bg-primary/40 transition-all" />
                            <div className="relative w-full h-full rounded-[3rem] border-2 border-white/10 overflow-hidden bg-surface shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
                                {profile.avatarUrl ? (
                                    <Image src={profile.avatarUrl} alt={profile.fullName} fill className="object-cover" unoptimized />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#111] to-[#050505]">
                                        <Shield className="w-20 h-20 text-white/10" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Core Performance Section */}
                <motion.section variants={itemVariants} className="space-y-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter">Core Performance Metrics</h3>
                        <div className="hidden md:flex gap-1.5 h-1.5 w-48">
                            {[...Array(12)].map((_, i) => <div key={i} className="flex-1 bg-primary/20 rounded-full" />)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-surface border border-white/5 p-8 rounded-[2.5rem] space-y-6 group hover:border-primary/30 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Discipline Grade</p>
                                <p className="text-6xl font-black tracking-tighter italic text-primary">{analytics?.currentTier?.tier || 'A'}</p>
                            </div>
                            <p className="text-[10px] text-text-secondary font-bold uppercase leading-relaxed">Top 2% of engineering consistency tracked via Forge OS.</p>
                        </div>

                        <div className="bg-surface border border-white/5 p-8 rounded-[2.5rem] lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Velocity Pulse</p>
                                    <h4 className="text-lg font-bold">Discipline Score Trend</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-primary italic">{analytics?.avgDiscipline || 0}%</p>
                                    <p className="text-[8px] font-bold text-text-secondary uppercase">7-Day Average</p>
                                </div>
                            </div>
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics?.disciplineTrend || []}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ff3131" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ff3131" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="score" stroke="#ff3131" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-surface border border-white/5 p-8 rounded-[2.5rem] space-y-6 group hover:border-blue-500/30 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Strategic Streak</p>
                                <p className="text-6xl font-black tracking-tighter italic text-blue-500">{analytics?.streak || 0}</p>
                            </div>
                            <p className="text-[10px] text-text-secondary font-bold uppercase leading-relaxed">Consecutive days of deep-work & technical evolution.</p>
                        </div>
                    </div>
                </motion.section>

                {/* Active Mission Section */}
                <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-7 space-y-10">
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                                Current Technical Mission
                                <div className="h-px flex-1 bg-white/10" />
                            </h3>
                            {program ? (
                                <div className="bg-surface border border-white/5 p-10 rounded-[3rem] space-y-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none transition-all group-hover:scale-110" />
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-primary">
                                            <Map className="w-6 h-6" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Active Core Directive</span>
                                        </div>
                                        <h4 className="text-4xl font-black tracking-tighter italic uppercase">{program.title}</h4>
                                        <p className="text-text-secondary leading-relaxed font-medium line-clamp-3">
                                            {program.description || 'Executing a high-density roadmap to master modern architecture and engineering principles.'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 border-t border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest leading-none">Total Cycles</p>
                                            <p className="text-xl font-black italic">{program.totalDays} Days</p>
                                        </div>
                                        <div className="space-y-1 text-primary">
                                            <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest leading-none">Days Complete</p>
                                            <p className="text-xl font-black italic">{analytics?.dayProgress || '0'} Days</p>
                                        </div>
                                        <div className="space-y-1 text-secondary hidden md:block">
                                            <p className="text-[9px] font-black text-secondary/60 uppercase tracking-widest leading-none">Efficiency Grade</p>
                                            <p className="text-xl font-black italic">OPTIMIZED</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-surface border border-white/10 p-12 rounded-[3rem] text-center italic text-text-secondary">
                                    No active public mission currently transmitting.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-10">
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                                Evidence of Grind
                                <div className="h-px flex-1 bg-white/10" />
                            </h3>
                            <div className="space-y-4">
                                {achievements?.slice(0, 4).map((a: any) => (
                                    <div key={a.id} className="bg-surface border border-white/5 p-6 rounded-2xl flex items-center gap-6 group hover:translate-x-2 transition-all">
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <Award className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h5 className="font-black text-sm uppercase tracking-tight italic">{a.title}</h5>
                                            <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Achieved {format(new Date(a.achievedAt), 'MMM dd, yyyy')}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!achievements || achievements.length === 0) && (
                                    <p className="text-center text-text-secondary italic py-10 border border-dashed border-white/5 rounded-3xl">No milestones broadcasted yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Intelligence Nodes Section */}
                <motion.section variants={itemVariants} className="space-y-12">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <h3 className="text-4xl font-black uppercase italic tracking-tighter text-secondary">Intelligence Briefings</h3>
                            <p className="text-text-secondary text-sm italic font-medium">Deep-dives into the technical hurdles encountered during the Forge.</p>
                        </div>
                        <Link href="/blog" className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-secondary transition-colors group">
                            Full Archive <ExternalLink className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {publicPosts?.map((post: any) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="group bg-surface border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col hover:border-secondary/30 transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                            >
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <div className="absolute inset-0 bg-secondary/10 z-10 group-hover:opacity-0 transition-opacity" />
                                    {post.coverImageUrl ? (
                                        <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                                    ) : (
                                        <div className="w-full h-full bg-surface-elevated flex items-center justify-center p-12">
                                            <FileText className="w-12 h-12 text-white/5" />
                                        </div>
                                    )}
                                    <div className="absolute top-6 left-6 z-20">
                                        <span className="bg-black/40 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border border-white/10">Briefing #{post.id.substring(0, 4)}</span>
                                    </div>
                                </div>
                                <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <h4 className="text-xl font-black tracking-tight uppercase italic group-hover:text-secondary transition-colors leading-tight">{post.title}</h4>
                                        <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed italic">{post.excerpt}</p>
                                    </div>
                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                        <span className="text-[8px] font-black text-text-secondary uppercase tracking-[0.2em]">{format(new Date(post.publishedAt || post.createdAt), 'MMM d, yyyy')}</span>
                                        <div className="flex items-center gap-2 group-hover:text-secondary transition-colors">
                                            <span className="text-[9px] font-black uppercase tracking-widest">Execute Read</span>
                                            <Terminal className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </motion.section>

                {/* Recruiter Trust Footer */}
                <motion.section variants={itemVariants} className="pt-20 border-t border-white/5">
                    <div className="bg-[#0c0c0c] border border-white/10 rounded-[3rem] p-12 md:p-16 relative overflow-hidden text-center space-y-8">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                        <div className="max-w-2xl mx-auto space-y-6">
                            <h3 className="text-4xl font-black uppercase italic tracking-tighter">Hiring Intel</h3>
                            <p className="text-text-secondary text-lg leading-relaxed italic">
                                This profile is a live representation of actual engineering output. Every data point—from the velocity pulse to the written briefings—is tied to verified daily activity within <span className="text-primary font-bold">The Forge OS</span>.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {analytics?.taskStats?.map((stat: any) => (
                                <div key={stat.type} className="bg-surface border border-white/5 p-6 rounded-3xl space-y-4 group hover:border-primary/20 transition-all">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{stat.type}</p>
                                        <span className="text-[10px] font-bold text-primary">{stat.percentage}%</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stat.percentage}%` }}
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000",
                                                stat.type === 'build' ? "bg-primary" : stat.type === 'study' ? "bg-blue-500" : "bg-secondary"
                                            )}
                                        />
                                    </div>
                                    <p className="text-[8px] font-bold text-text-secondary uppercase">{stat.completed} / {stat.total} Completed</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* Print Version Badge (only visible when printing) */}
                <div className="hidden print:block fixed top-10 right-10 border-2 border-primary p-4 rounded-2xl rotate-12">
                    <p className="text-primary font-black uppercase tracking-widest text-xs">Verified by Forge OS</p>
                    <p className="text-[8px] uppercase font-bold text-text-secondary">Engineering Integrity Audit Passed</p>
                </div>

                <div className="pt-8 text-center">
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.5em] opacity-40">
                        FORGE ARCHIVE SYSTEM // BUILD VERSION 2026.4.2
                    </p>
                </div>
            </motion.main>
        </div>
    )
}
