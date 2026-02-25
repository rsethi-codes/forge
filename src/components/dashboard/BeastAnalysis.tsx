
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Zap, Target, Trophy, Info, BrainCircuit } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BeastAnalysisProps {
    metadata: {
        bluntTruth?: string | null
        roasts?: string[] | any
        strengths?: { content: string }[]
        gaps?: { area: string, whatResumeShows: string, brutalGap: string }[]
        dsaLanguage?: string | null
        specialization?: string | null
        targetPackage?: string | null
        targetSalaryMin?: number | null
        targetSalaryMax?: number | null
        specializationDecision?: any
    }
}

export default function BeastAnalysis({ metadata }: BeastAnalysisProps) {
    if (!metadata) return null

    const roasts = Array.isArray(metadata.roasts) ? metadata.roasts : []
    const strengths = metadata.strengths || []
    const specDecision = metadata.specializationDecision || {}

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Roasts Section - The "Brutal Truth" */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldAlert className="w-24 h-24 text-red-500" />
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                        <h3 className="text-red-500 font-syne font-bold uppercase tracking-widest text-sm">System Roast / Brutal Truth</h3>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <p className="text-text-primary font-medium leading-relaxed italic">
                            &quot;{metadata.bluntTruth}&quot;
                        </p>

                        {roasts.length > 0 && (
                            <ul className="space-y-2">
                                {roasts.slice(0, 3).map((roast: string, i: number) => (
                                    <li key={i} className="text-red-400/80 text-sm flex gap-2">
                                        <span className="text-red-500 font-bold">•</span>
                                        {roast}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </motion.div>

                {/* Strengths Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="w-24 h-24 text-emerald-500" />
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-emerald-500 font-syne font-bold uppercase tracking-widest text-sm">Identified Strengths</h3>
                    </div>

                    <div className="space-y-3 relative z-10">
                        {strengths.length > 0 ? (
                            strengths.map((s, i) => (
                                <div key={i} className="flex items-start gap-3 bg-white/5 border border-white/5 p-3 rounded-2xl">
                                    <Trophy className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                    <p className="text-text-primary text-sm font-medium">{s.content}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-text-secondary text-sm italic">Identifying core assets...</p>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Specialization & Target Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-surface-elevated border border-border-subtle rounded-3xl p-8"
            >
                <div className="flex flex-col md:flex-row gap-8 justify-between">
                    <div className="space-y-6 flex-1">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <BrainCircuit className="w-5 h-5 text-primary" />
                                <h3 className="font-syne font-bold text-lg">Specialization Decision</h3>
                            </div>
                            <p className="text-text-secondary text-sm leading-relaxed max-w-xl">
                                {specDecision.reasoning || `Focusing on ${metadata.specialization || 'Core Fullstack mastery'} for maximum market leverage.`}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest block mb-1">Language</span>
                                <span className="text-text-primary font-bold">{metadata.dsaLanguage || 'Typescript'}</span>
                            </div>
                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest block mb-1">Track</span>
                                <span className="text-text-primary font-bold">{metadata.specialization || 'React Engineer'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-64 bg-primary/10 border border-primary/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-2">
                        <Target className="w-8 h-8 text-primary mb-2" />
                        <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Target Package</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-syne font-bold text-text-primary">
                                {metadata.targetSalaryMin && metadata.targetSalaryMax
                                    ? `${metadata.targetSalaryMin}-${metadata.targetSalaryMax}`
                                    : metadata.targetPackage || '18-24'}
                            </span>
                            <span className="text-primary font-bold">LPA</span>
                        </div>
                        <p className="text-[10px] text-text-secondary/60 italic">Market-adjusted benchmark</p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
