'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
    Smartphone,
    Download,
    Share2,
    Copy,
    Check,
    Globe,
    Link as LinkIcon,
    FileText,
    Linkedin,
    Terminal,
    ExternalLink
} from 'lucide-react'
import QRCode from 'qrcode'
import { cn } from '@/lib/utils'

export default function SharePage() {
    const [qrCode, setQrCode] = useState('')
    const [copied, setCopied] = useState(false)
    const [activeView, setActiveView] = useState<'sync' | 'snippets' | 'profile'>('profile')
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://forge-2026.vercel.app'
    const profileUrl = `${appUrl}/profile`

    useEffect(() => {
        QRCode.toDataURL(profileUrl, {
            margin: 2,
            width: 400,
            color: {
                dark: '#ff3131', // Forge Red
                light: '#ffffff'
            }
        }).then(setQrCode)
    }, [profileUrl])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const resumeSnippet = `• FORGE Program (60-Day Engineering Sprint): 
Successfully completing an aggressive technical roadmap focused on Senior-level React internals, System Design, and Performance Architecture. 
Current Discipline Velocity: 92% across consistent daily deep-work sessions.`

    const linkedinSnippet = `🔥 Day 14 of "The Forge" completed. 

Today's focus was on RSC Serialization and the technical hurdles of streaming data across the wire. Consistency is the only variable that matters.

Follow the journey: ${profileUrl}`

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-12">
            <header className="text-center space-y-6">
                <div className="flex bg-surface p-1 rounded-2xl border border-border-subtle w-fit mx-auto">
                    <button
                        onClick={() => setActiveView('profile')}
                        className={cn("px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", activeView === 'profile' ? "bg-primary text-white shadow-lg" : "text-text-secondary")}
                    >
                        Showcase Profile
                    </button>
                    <button
                        onClick={() => setActiveView('sync')}
                        className={cn("px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", activeView === 'sync' ? "bg-primary text-white shadow-lg" : "text-text-secondary")}
                    >
                        Sync
                    </button>
                    <button
                        onClick={() => setActiveView('snippets')}
                        className={cn("px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", activeView === 'snippets' ? "bg-primary text-white shadow-lg" : "text-text-secondary")}
                    >
                        Snippets
                    </button>
                </div>
                <div>
                    <h1 className="text-4xl md:text-5xl font-syne font-bold tracking-tighter">Forge Nexus</h1>
                    <p className="text-text-secondary text-lg max-w-xl mx-auto">
                        Bridge your private grind with your professional legacy.
                    </p>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {activeView === 'profile' && (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-surface border border-border-subtle p-8 rounded-[3rem] space-y-8"
                    >
                        <div className="flex flex-col md:flex-row gap-10 items-center">
                            <div className="flex-1 space-y-6">
                                <div className="flex items-center gap-3 text-primary">
                                    <Globe className="w-8 h-8" />
                                    <h3 className="text-3xl font-syne font-bold uppercase tracking-tighter">Public Showcase</h3>
                                </div>
                                <p className="text-lg text-text-secondary leading-relaxed">
                                    Your live engineering profile. Show recruiters your consistency, discipline score, and technical write-ups in real-time.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-[#0a0a0a] border border-border-subtle rounded-2xl group">
                                        <LinkIcon className="w-5 h-5 text-text-secondary shrink-0" />
                                        <code className="text-xs text-text-secondary flex-1 truncate">{profileUrl}</code>
                                        <button
                                            onClick={() => copyToClipboard(profileUrl)}
                                            className="p-2.5 bg-surface-elevated hover:bg-primary/20 hover:text-primary rounded-xl transition-all"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <Link
                                        href="/profile"
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:bg-red-600 transition-all"
                                    >
                                        <ExternalLink className="w-4 h-4" /> View Live Profile
                                    </Link>
                                </div>
                            </div>
                            <div className="w-full md:w-80 aspect-square bg-white p-6 rounded-[2rem] shadow-2xl relative group overflow-hidden">
                                {qrCode && (
                                    <Image
                                        src={qrCode}
                                        alt="Profile QR Code"
                                        width={400}
                                        height={400}
                                        className="w-full h-full"
                                        unoptimized
                                    />
                                )}
                                <div className="absolute inset-0 bg-primary/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                    <p className="text-white font-bold text-center px-6">Scan to share your <br /> Engineering Legacy</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeView === 'sync' && (
                    <motion.div
                        key="sync"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
                    >
                        <div className="flex justify-center">
                            <motion.div
                                initial={{ rotateY: -20, rotateX: 10, y: 20 }}
                                animate={{ rotateY: 0, rotateX: 0, y: 0 }}
                                className="relative bg-white p-8 rounded-[3rem] shadow-[0_0_50px_rgba(255,49,49,0.2)] border-8 border-[#111111]"
                            >
                                {qrCode ? (
                                    <Image
                                        src={qrCode}
                                        alt="App QR Code"
                                        width={256}
                                        height={256}
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-64 h-64 bg-surface-elevated animate-pulse rounded-2xl" />
                                )}
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl">
                                    Scan to Install
                                </div>
                            </motion.div>
                        </div>

                        <div className="space-y-8">
                            <section className="bg-surface border border-border-subtle p-8 rounded-3xl space-y-6">
                                <div className="flex items-center gap-4 text-primary">
                                    <Smartphone className="w-8 h-8" />
                                    <h3 className="text-2xl font-syne font-bold font-bold uppercase tracking-tighter">Mobile Pulse</h3>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    Add FORGE to your homescreen. Track progress from the gym, your commute, or away from your desk.
                                </p>

                                <div className="flex items-center gap-3 p-4 bg-[#0a0a0a] border border-border-subtle rounded-2xl">
                                    <LinkIcon className="w-5 h-5 text-text-secondary shrink-0" />
                                    <code className="text-xs text-text-secondary flex-1 truncate">{appUrl}</code>
                                    <button
                                        onClick={() => copyToClipboard(appUrl)}
                                        className="p-2.5 bg-surface-elevated hover:bg-primary/20 hover:text-primary rounded-xl transition-all"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </section>
                        </div>
                    </motion.div>
                )}

                {activeView === 'snippets' && (
                    <motion.div
                        key="snippets"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        <div className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] space-y-6">
                            <div className="flex items-center gap-3 text-primary">
                                <FileText className="w-6 h-6" />
                                <h3 className="text-xl font-syne font-bold uppercase tracking-widest">Resume Block</h3>
                            </div>
                            <div className="bg-[#0a0a0a] border border-border-subtle p-6 rounded-2xl font-mono text-xs text-text-secondary relative group">
                                <pre className="whitespace-pre-wrap">{resumeSnippet}</pre>
                                <button
                                    onClick={() => copyToClipboard(resumeSnippet)}
                                    className="absolute top-4 right-4 p-2 bg-surface hover:bg-primary/10 rounded-lg transition-all"
                                >
                                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-text-secondary font-bold uppercase">Optimized for ATS & Lead Engineers.</p>
                        </div>

                        <div className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] space-y-6">
                            <div className="flex items-center gap-3 text-[#0077b5]">
                                <Linkedin className="w-6 h-6" />
                                <h3 className="text-xl font-syne font-bold uppercase tracking-widest">LinkedIn Update</h3>
                            </div>
                            <div className="bg-[#0a0a0a] border border-border-subtle p-6 rounded-2xl font-mono text-xs text-text-secondary relative group">
                                <pre className="whitespace-pre-wrap">{linkedinSnippet}</pre>
                                <button
                                    onClick={() => copyToClipboard(linkedinSnippet)}
                                    className="absolute top-4 right-4 p-2 bg-surface hover:bg-[#0077b5]/10 rounded-lg transition-all"
                                >
                                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-text-secondary font-bold uppercase">Crafted for Maximum Engagement.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col items-center gap-6 pt-10">
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em]">Secure Forge Nexus Active</p>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 bg-surface border border-border-subtle rounded-2xl text-xs font-bold hover:border-primary/50 transition-all">
                        <Download className="w-4 h-4 text-primary" /> Export Data Orbit
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-surface border border-border-subtle rounded-2xl text-xs font-bold hover:border-primary/50 transition-all">
                        <Terminal className="w-4 h-4 text-primary" /> API Access Keys
                    </button>
                </div>
            </div>
        </div>
    )
}
