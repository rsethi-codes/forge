'use client'

import React from 'react'
import { getPublicProfile } from '@/lib/actions/profile'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Zap, Target, Flame, Database, Github, Linkedin, Twitter, Globe, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PublicProfilePage({ params }: { params: { handle: string } }) {
    const [loading, setLoading] = React.useState(true)
    const [data, setData] = React.useState<any>(null)

    React.useEffect(() => {
        async function fetch() {
            try {
                const res = await getPublicProfile(params.handle)
                setData(res)
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [params.handle])

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    )

    if (!data) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center space-y-6">
            <ShieldCheck className="w-16 h-16 text-white/10" />
            <h1 className="text-4xl font-syne font-black uppercase tracking-tighter">Forge Identity Not Found</h1>
            <p className="text-white/40 max-w-sm">This handle is either private or has not been initialized in the Forge.</p>
            <a href="/" className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs">Back to Forge</a>
        </div>
    )

    const { profile, stats } = data

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary selection:text-white font-sans overflow-x-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] opacity-20" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] opacity-10" />
            </div>

            <div className="max-w-4xl mx-auto px-6 py-20 relative z-10 space-y-20">
                {/* 1. Header & Identity */}
                <header className="flex flex-col md:flex-row items-center md:items-end gap-10 text-center md:text-left">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-[3rem] blur-2xl group-hover:blur-3xl transition-all" />
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-[3rem] border-2 border-white/5 bg-surface-elevated relative overflow-hidden flex items-center justify-center shadow-2xl">
                            {profile.avatarUrl ? (
                                <Image
                                    src={profile.avatarUrl}
                                    alt={profile.fullName}
                                    fill
                                    className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
                                />
                            ) : (
                                <Database className="w-16 h-16 text-white/10" />
                            )}
                        </div>
                    </motion.div>

                    <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            {profile.updatedAt && (new Date().getTime() - new Date(profile.updatedAt).getTime()) < 60000 ? (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Operational Now</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-white/20" />
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
                                        Standby // Last Active {profile.updatedAt ? new Date(profile.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                                    </span>
                                </>
                            )}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-syne font-black tracking-tighter uppercase leading-none italic group">
                            {profile.fullName?.split(' ')[0]} <span className="text-white/20 group-hover:text-primary transition-all duration-500">{profile.fullName?.split(' ')[1]}</span>
                        </h1>
                        <p className="text-lg md:text-xl text-white/50 font-lora font-medium leading-relaxed max-w-xl">
                            {profile.headline || 'Senior Software Engineer in training at THE FORGE.'}
                        </p>

                        <div className="flex items-center justify-center md:justify-start gap-4">
                            {profile.githubUrl && <a href={profile.githubUrl} className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white"><Github className="w-5 h-5" /></a>}
                            {profile.linkedinUrl && <a href={profile.linkedinUrl} className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white"><Linkedin className="w-5 h-5" /></a>}
                            {profile.twitterUrl && <a href={profile.twitterUrl} className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white"><Twitter className="w-5 h-5" /></a>}
                            {profile.websiteUrl && <a href={profile.websiteUrl} className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white"><Globe className="w-5 h-5" /></a>}
                        </div>
                    </div>
                </header>

                {/* 2. Primary Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <motion.div whileHover={{ y: -5 }} className="bg-surface-elevated border border-white/5 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                <Flame className="w-6 h-6 fill-current animate-pulse" />
                            </div>
                            <span className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-orange-500/20">Operational Streak</span>
                        </div>
                        <div>
                            <p className="text-6xl font-syne font-black tracking-tighter italic text-orange-500">
                                {stats.streak}
                                <span className="text-xl text-white/20 not-italic ml-2 tracking-widest">DAYS</span>
                            </p>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mt-2">Maximum Momentum</h3>
                        </div>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-surface-elevated border border-white/5 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                                <Zap className="w-6 h-6 fill-current" />
                            </div>
                            <span className="text-[9px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-primary/20">Execution Index</span>
                        </div>
                        <div>
                            <p className="text-6xl font-syne font-black tracking-tighter italic text-primary">
                                {stats.disciplineScore}
                                <span className="text-xl text-white/20 not-italic ml-2 tracking-widest">V</span>
                            </p>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mt-2">Discipline Velocity</h3>
                        </div>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-surface-elevated border border-white/5 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                                <Target className="w-6 h-6" />
                            </div>
                            <span className="text-[9px] font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-blue-500/20">Current Protocol</span>
                        </div>
                        <div className="min-h-[4rem] flex flex-col justify-center">
                            <h4 className="text-xl font-syne font-black tracking-tight leading-tight uppercase">{stats.activeProgram}</h4>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mt-2 italic">Active Roadmap</h3>
                        </div>
                    </motion.div>
                </div>

                {/* 3. Neural Activity Heatmap */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-syne font-black uppercase tracking-widest italic">Neural Activity Log</h2>
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Last 50 Transmissions</span>
                    </div>

                    <div className="bg-surface/40 backdrop-blur-xl border border-white/5 p-8 rounded-[3rem] overflow-hidden relative group">
                        <div className="flex flex-wrap gap-2 justify-between">
                            {/* Simple Heatmap implementation: 28 days of activity blocks */}
                            {Array.from({ length: 28 }).map((_, i) => {
                                const day = new Date()
                                day.setDate(day.getDate() - (27 - i))
                                const dateStr = day.toISOString().split('T')[0]
                                const activityCount = stats.recentActivity?.filter((a: any) =>
                                    new Date(a.createdAt).toISOString().split('T')[0] === dateStr
                                ).length || 0

                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-full h-8 flex-1 min-w-[12px] rounded-sm transition-all duration-500",
                                            activityCount === 0 ? "bg-white/5" :
                                                activityCount < 3 ? "bg-primary/20" :
                                                    activityCount < 7 ? "bg-primary/50" : "bg-primary shadow-[0_0_15px_rgba(255,49,49,0.4)]"
                                        )}
                                        title={`${activityCount} events on ${dateStr}`}
                                    />
                                )
                            })}
                        </div>
                        <div className="flex items-center justify-between mt-4 text-[8px] font-black text-white/20 uppercase tracking-widest">
                            <span>28 Days Ago</span>
                            <div className="flex items-center gap-2">
                                <span>Low</span>
                                <div className="w-2 h-2 rounded-sm bg-white/5" />
                                <div className="w-2 h-2 rounded-sm bg-primary/20" />
                                <div className="w-2 h-2 rounded-sm bg-primary/50" />
                                <div className="w-2 h-2 rounded-sm bg-primary" />
                                <span>High Output</span>
                            </div>
                            <span>Active Today</span>
                        </div>
                    </div>
                </section>

                {/* 4. Automated Project Board & Reflections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-syne font-black uppercase tracking-widest italic">Verified Build Log</h2>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {stats.topTasks?.map((task: any, i: number) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-6 bg-surface-elevated border border-white/5 rounded-3xl space-y-4 hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Build {i + 1}</span>
                                        <span className="text-[9px] font-bold text-white/20 uppercase">{new Date(task.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="font-syne font-black uppercase tracking-tight group-hover:text-primary transition-colors">{task.title}</h3>
                                    <p className="text-xs text-white/40 line-clamp-2 leading-relaxed italic">{task.description}</p>
                                </motion.div>
                            ))}
                            {(!stats.topTasks || stats.topTasks.length === 0) && (
                                <div className="col-span-2 py-12 text-center border border-dashed border-white/10 rounded-3xl">
                                    <p className="text-[10px] font-black text-white/10 uppercase tracking-widest italic">Core Protocol Builds Pending...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-syne font-black uppercase tracking-widest italic">Reflections</h2>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>

                        <div className="space-y-4">
                            {stats.recentPosts?.map((post: any, i: number) => (
                                <a
                                    key={i}
                                    href={`/blog/${post.slug}`}
                                    className="block p-6 bg-surface/40 backdrop-blur-xl border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all group"
                                >
                                    <h4 className="text-sm font-syne font-bold group-hover:text-blue-400 transition-colors line-clamp-2">{post.title}</h4>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="text-[9px] font-bold text-white/20 uppercase">{new Date(post.publishedAt).toLocaleDateString()}</span>
                                        <div className="w-1 h-1 rounded-full bg-white/10" />
                                        <span className="text-[9px] font-bold text-blue-500/60 uppercase">{post.readingTimeMinutes}m Read</span>
                                    </div>
                                </a>
                            ))}
                            {(!stats.recentPosts || stats.recentPosts.length === 0) && (
                                <div className="py-12 text-center border border-dashed border-white/10 rounded-3xl">
                                    <p className="text-[10px] font-black text-white/10 uppercase tracking-widest italic">No public reflections yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 5. Bio & Status Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        <section className="space-y-6">
                            <h2 className="text-xl font-syne font-black uppercase tracking-widest flex items-center gap-4 italic font-bold">
                                Engineering Narrative
                                <div className="h-px flex-1 bg-white/5" />
                            </h2>
                            <p className="text-xl font-lora font-medium text-white/60 leading-relaxed italic">
                                &rdquo;{profile.bio || "The journey into engineering greatness is not a test of memory, but a test of will. Every task shipped is a node in the internal architecture of a senior engineer.&rdquo;"}
                            </p>
                        </section>

                        <div className="p-8 rounded-[3rem] border border-white/5 bg-gradient-to-br from-black to-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-primary/10 transition-colors">
                                <Database className="w-32 h-32" />
                            </div>
                            <h4 className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-4">Core Competencies</h4>
                            <div className="flex flex-wrap gap-2">
                                {(profile.skills || ['Architectural Design', 'Deep Systems', 'Distributed Logic', 'Type Safety']).map((s: string) => (
                                    <span key={s} className="px-5 py-2.5 bg-white/5 rounded-2xl text-xs font-bold border border-white/5 hover:border-primary/50 transition-all uppercase tracking-widest">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0c0c0c] border border-white/5 rounded-[3rem] p-10 flex flex-col justify-center items-center text-center space-y-8 relative overflow-hidden shadow-black/80 shadow-2xl">
                        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                        <div className="relative space-y-6">
                            <ShieldCheck className="w-12 h-12 text-primary mx-auto animate-pulse" />
                            <div className="space-y-2">
                                <h3 className="text-xl font-syne font-black tracking-tighter uppercase italic">Verified Candidate</h3>
                                <p className="text-xs font-black text-white/20 uppercase tracking-[0.3em]">Integrity Level: HIGH</p>
                            </div>
                            <div className="h-px w-20 bg-white/10 mx-auto" />
                            <p className="text-sm font-lora font-medium text-white/50 leading-relaxed italic">
                                Progress automatically verified by the Forge behavioral tracking engine. No manual effort. Pure proof of work.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. CTA */}
                <footer className="pt-20 border-t border-white/5 text-center space-y-8">
                    <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Proprietary Technology of THE FORGE</span>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <a href="/" className="px-10 py-5 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all shadow-xl shadow-primary/20">
                            Join the Forge
                        </a>
                        <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Scale your career with automated deep work.</p>
                    </div>
                </footer>
            </div>
        </div>
    )
}
