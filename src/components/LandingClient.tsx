'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Flame, Shield, Zap, Target, Award } from 'lucide-react'
import Link from 'next/link'

export default function LandingClient() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-text-primary selection:bg-primary selection:text-white overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10" />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-10">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-primary"
                        >
                            <Zap className="w-3 h-3 fill-primary" /> Initializing Session v1.0
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-8xl font-syne font-bold tracking-tighter leading-[0.9]"
                        >
                            FORGE <br /> <span className="text-gradient">EXCELLENCE.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-text-secondary font-lora max-w-lg leading-relaxed"
                        >
                            A brutal, high-performance environment designed to take you from a Senior React Engineer to an industry-leading force in 60 days.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-4"
                        >
                            <Link
                                href="/login"
                                className="bg-primary hover:bg-red-600 text-white font-bold px-10 py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-primary/20 group"
                            >
                                Enter the Forge <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/blog"
                                className="bg-surface hover:bg-surface-elevated text-text-primary border border-border-subtle font-bold px-10 py-5 rounded-2xl flex items-center justify-center gap-3 transition-all"
                            >
                                Read the Blog
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center gap-8 pt-10"
                        >
                            <div className="space-y-1 text-center">
                                <p className="text-3xl font-syne font-bold tracking-tighter">60</p>
                                <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Day Grind</p>
                            </div>
                            <div className="w-[1px] h-10 bg-border-subtle" />
                            <div className="space-y-1 text-center">
                                <p className="text-3xl font-syne font-bold tracking-tighter">12</p>
                                <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Milestones</p>
                            </div>
                            <div className="w-[1px] h-10 bg-border-subtle" />
                            <div className="space-y-1 text-center">
                                <p className="text-3xl font-syne font-bold tracking-tighter">∞</p>
                                <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Legacy</p>
                            </div>
                        </motion.div>
                    </div>

                    <div className="relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ delay: 0.4, type: 'spring' }}
                            className="bg-surface border border-white/10 rounded-[3rem] p-4 shadow-[0_0_100px_rgba(255,49,49,0.15)] relative z-10 aspect-square flex items-center justify-center"
                        >
                            <div className="w-full h-full bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 overflow-hidden p-8 space-y-10">
                                <div className="flex justify-between items-center">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Flame className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="text-right">
                                        <div className="h-2 w-24 bg-surface-elevated rounded-full mb-1" />
                                        <div className="h-2 w-16 bg-surface-elevated rounded-full ml-auto" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="h-8 w-3/4 bg-white/5 rounded-xl" />
                                    <div className="h-4 w-1/2 bg-white/5 rounded-full" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-32 bg-primary/5 border border-primary/10 rounded-3xl flex flex-col items-center justify-center gap-2">
                                        <span className="text-xs font-bold text-text-secondary">Discipline</span>
                                        <span className="text-3xl font-syne font-bold text-primary">98</span>
                                    </div>
                                    <div className="h-32 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-2">
                                        <span className="text-xs font-bold text-text-secondary">Streak</span>
                                        <span className="text-3xl font-syne font-bold text-text-primary">14</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden">
                                        <div className="h-full w-2/3 bg-primary" />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-text-secondary">
                                        <span>Phase 1 COMPLETE</span>
                                        <span>66%</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute -top-10 -right-10 z-20 bg-[#111111] border border-success/30 p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl"
                        >
                            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                                < Award className="w-5 h-5 text-success" />
                            </div>
                            <div>
                                <p className="text-xs font-bold">Elite Status</p>
                                <p className="text-[10px] text-text-secondary">Top 1% Performers</p>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 20, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute -bottom-10 -left-10 z-20 bg-[#111111] border border-primary/30 p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl"
                        >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                < Shield className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-bold">Iron Discipline</p>
                                <p className="text-[10px] text-text-secondary">Strict 8h Daily Workload</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            <footer className="absolute bottom-10 left-0 w-full px-6 flex justify-between items-center text-text-secondary md:px-12">
                <div className="flex items-center gap-6">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Built for Seniority</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Proof of Excellence</span>
                </div>
                <div className="h-[1px] flex-1 mx-10 bg-border-subtle hidden md:block" />
                <p className="text-[10px] font-bold">FORGE &copy; 2026</p>
            </footer>
        </div>
    )
}
