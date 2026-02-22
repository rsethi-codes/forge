'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Zap, Target, Book, ChevronRight, Github, Twitter, Linkedin, ExternalLink, Calendar, Award } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { getPublicProfileData } from '@/lib/actions/profile'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export default function PublicProfilePage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getPublicProfileData().then(res => {
            setData(res)
            setLoading(false)
        })
    }, [])

    if (loading) return (
        <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
    )

    if (!data) return (
        <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center font-fraunces text-2xl">
            Engineer Profile Not Found.
        </div>
    )

    const { program, stats, publicPosts, achievements } = data

    return (
        <div className="min-h-screen bg-[#fafaf8] text-[#1a1a1a] selection:bg-[#ff3131] selection:text-white pb-32">
            {/* Header / Intro */}
            <header className="max-w-5xl mx-auto px-6 pt-32 pb-20 border-b border-black/5">
                <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                    <div className="space-y-6 max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-black text-white px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] inline-block"
                        >
                            Executive Summary
                        </motion.div>
                        <h1 className="text-6xl md:text-8xl font-fraunces font-bold tracking-tighter leading-[0.9]">
                            Raghav Sethi
                        </h1>
                        <p className="text-xl md:text-2xl font-lora text-[#444] leading-relaxed italic">
                            Building FORGE — An aggressive 60-day deep-dive into high-performance React engineering.
                        </p>
                        <div className="flex items-center gap-6 pt-4">
                            <a href="#" className="p-3 bg-white border border-black/10 rounded-full hover:bg-black hover:text-white transition-all shadow-sm"><Github className="w-5 h-5" /></a>
                            <a href="#" className="p-3 bg-white border border-black/10 rounded-full hover:bg-black hover:text-white transition-all shadow-sm"><Linkedin className="w-5 h-5" /></a>
                            <a href="#" className="p-3 bg-white border border-black/10 rounded-full hover:bg-black hover:text-white transition-all shadow-sm"><Twitter className="w-5 h-5" /></a>
                        </div>
                    </div>

                    <div className="w-full md:w-80 space-y-8">
                        <div className="p-8 bg-white border border-black/10 shadow-xl shadow-black/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-2 h-full bg-[#ff3131]" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-4">Current Velocity</p>
                            <p className="text-5xl font-fraunces font-bold mb-2">Day {stats.heatmapData.filter((d: any) => d.status === 'complete').length}</p>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#ff3131]">Senior Roadmap Active</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-black/5 pb-2">
                                <span className="text-[10px] font-bold uppercase">Discipline Score</span>
                                <span className="text-lg font-bold">{stats.avgDiscipline}</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-black/5 pb-2">
                                <span className="text-[10px] font-bold uppercase">Focus Hours</span>
                                <span className="text-lg font-bold">{stats.weeklySummary.totalHours}H</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Sprints / Heatmap */}
            <section className="max-w-5xl mx-auto px-6 py-24 space-y-12">
                <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-fraunces font-bold tracking-tight">The 60-Day Sprint</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Visual Momentum Audit</p>
                </div>

                <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-15 gap-2">
                    {stats.heatmapData.map((d: any) => (
                        <div
                            key={d.day}
                            className={cn(
                                "aspect-square rounded-sm border transition-all duration-500",
                                d.status === 'complete' ? "bg-black border-black" : "bg-white border-black/10"
                            )}
                            title={`Day ${d.day}: ${d.status}`}
                        />
                    ))}
                </div>
                <div className="flex items-center justify-center gap-12 pt-8">
                    <div className="flex flex-col items-center">
                        <p className="text-3xl font-fraunces font-bold">{stats.streak}D</p>
                        <p className="text-[8px] font-bold uppercase tracking-tighter text-[#888]">Current Streak</p>
                    </div>
                    <div className="h-12 w-px bg-black/5" />
                    <div className="flex flex-col items-center">
                        <p className="text-3xl font-fraunces font-bold">{stats.focusStats.sessionCount}</p>
                        <p className="text-[8px] font-bold uppercase tracking-tighter text-[#888]">Focus Sessions</p>
                    </div>
                    <div className="h-12 w-px bg-black/5" />
                    <div className="flex flex-col items-center">
                        <p className="text-3xl font-fraunces font-bold">{achievements.length}</p>
                        <p className="text-[8px] font-bold uppercase tracking-tighter text-[#888]">Milestones</p>
                    </div>
                </div>
            </section>

            {/* Recent Intel (Blog) */}
            <section className="bg-black text-white py-32">
                <div className="max-w-5xl mx-auto px-6 space-y-20">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div className="space-y-4">
                            <h2 className="text-5xl md:text-7xl font-fraunces font-bold tracking-tighter leading-none">Latest Technical Write-ups</h2>
                            <p className="text-lora text-white/60 italic text-xl">Deep architectural patterns and insights from the grind.</p>
                        </div>
                        <Link href="/blog" className="flex items-center gap-2 font-bold uppercase text-xs border-b border-white/20 pb-1 hover:border-white transition-all">
                            Browse All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {publicPosts.map((post: any) => (
                            <Link href={`/blog/${post.slug}`} key={post.id} className="group space-y-6">
                                <div className="aspect-[4/5] bg-white/5 overflow-hidden filter grayscale group-hover:grayscale-0 transition-all duration-700 relative">
                                    <Image
                                        src={post.coverImageUrl || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070"}
                                        alt={post.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff3131]">Engineering</p>
                                    <h3 className="text-2xl font-fraunces font-bold group-hover:underline decoration-[#ff3131] underline-offset-8 transition-all">{post.title}</h3>
                                    <p className="text-white/40 text-sm font-lora line-clamp-2">{post.excerpt}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Milestones / Social Proof */}
            <section className="max-w-5xl mx-auto px-6 py-32 space-y-16">
                <h2 className="text-4xl font-fraunces font-bold tracking-tight text-center">Achieved Milestones</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {achievements.map((m: any) => (
                        <div key={m.id} className="p-8 bg-white border border-black/10 rounded-2xl flex items-start gap-4">
                            <div className="text-3xl bg-black/5 w-12 h-12 flex items-center justify-center rounded-xl">{m.icon}</div>
                            <div>
                                <h4 className="font-bold text-sm uppercase tracking-wide">{m.title}</h4>
                                <p className="text-xs text-[#888] font-lora italic">{m.description}</p>
                                <p className="text-[8px] font-bold text-black/20 mt-2 uppercase">{format(new Date(m.achievedAt), 'MMM d, yyyy')}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Call to Action */}
            <section className="max-w-3xl mx-auto px-6 py-20 text-center space-y-8 bg-white border border-black/10 shadow-2xl rounded-[3rem]">
                <h3 className="text-4xl font-fraunces font-bold">Interested in my work?</h3>
                <p className="text-xl font-lora italic text-[#444]">
                    I am currently completing my roadmap to Senior React Engineer. I specialize in High-Performance UI, Architectural Systems, and Real-Time Experience.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <a href="mailto:hello@raghav.dev" className="bg-[#ff3131] text-white px-8 py-4 rounded-full font-bold uppercase text-xs tracking-widest shadow-xl shadow-[#ff3131]/20 hover:scale-105 transition-transform active:scale-95">Initiate Contact</a>
                    <a href="#" className="bg-black text-white px-8 py-4 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-zinc-800 transition-colors">Download Resume</a>
                </div>
            </section>
        </div>
    )
}
