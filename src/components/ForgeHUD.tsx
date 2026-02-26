'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Shield, BarChart3, Quote, Info, Settings, Zap, Target, Book, X, MessageSquare, Send, Sparkles } from 'lucide-react'
import PomodoroTimer from './PomodoroTimer'
import { cn } from '@/lib/utils'
import { getAnalyticsData } from '@/lib/actions/analytics'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useChat } from '@ai-sdk/react'
import type { UIMessage } from 'ai'

type HUDMode = 'timer' | 'stats' | 'insight' | 'mentor'

const insights = [
    "Seniority is measured by the complexity of problems you solve, not the years you've spent.",
    "Infrastructure is not a chore. It's the foundation of reliability.",
    "If you can't explain your architecture to a junior, you don't understand it yet.",
    "Shipping code is the only real measure of progress.",
    "Design for the next engineer, not for your ego."
]

import { useQuery } from '@tanstack/react-query'

export default function ForgeHUD() {
    const [mode, setMode] = useState<HUDMode>('timer')
    const [isOpen, setIsOpen] = useState(false)
    const [currentInsight, setCurrentInsight] = useState(insights[0])
    const [chatInput, setChatInput] = useState('')
    const pathname = usePathname()

    const { data: stats } = useQuery({
        queryKey: ['analytics-data'],
        queryFn: async () => {
            const response = await fetch('/api/stats/analytics')
            if (!response.ok) throw new Error('Failed to fetch analytics')
            return response.json()
        },
        staleTime: 60 * 1000,
    })

    const isPublicPage = pathname === '/login' || pathname === '/profile' || pathname === '/'

    const { messages, sendMessage, status } = useChat<UIMessage>({
        id: 'forge-mentor',
        messages: [],
    })

    const isChatLoading = status === 'submitted' || status === 'streaming'

    const sendQuery = (text: string) => {
        if (!text.trim() || isChatLoading) return
        sendMessage({ text }, {
            headers: { 'Content-Type': 'application/json' },
            body: { context: { pathname, timestamp: new Date().toISOString() } }
        })
    }

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        sendQuery(chatInput)
        setChatInput('')
    }

    const FAQ_CHIPS = [
        { label: "What should I focus on today?", icon: "🎯" },
        { label: "Review my current task approach", icon: "🔍" },
        { label: "Explain system design for scale", icon: "🏗️" },
        { label: "How do I stay consistent?", icon: "🔥" },
        { label: "What's the most important skill to build?", icon: "🧠" },
        { label: "Give me a hard technical challenge", icon: "⚡" },
    ]

    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    useEffect(() => {
        setCurrentInsight(insights[Math.floor(Math.random() * insights.length)])
    }, [])

    // Allow external pages (e.g. Analytics) to open the HUD and switch mode
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail
            setIsOpen(true)
            if (detail?.mode) setMode(detail.mode as HUDMode)
        }
        window.addEventListener('forge-hud-open', handler)
        return () => window.removeEventListener('forge-hud-open', handler)
    }, [])

    if (isPublicPage) return null

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-surface-elevated border-2 border-white/5 rounded-[2.5rem] p-4 shadow-2xl backdrop-blur-2xl w-80 space-y-4"
                    >
                        {/* Tabs */}
                        <div className="flex bg-black/40 p-1 rounded-2xl gap-1">
                            {[
                                { id: 'timer', icon: Zap, label: 'Focus Timer' },
                                { id: 'mentor', icon: MessageSquare, label: 'AI Mentor' },
                                { id: 'stats', icon: BarChart3, label: 'Pulse Stats' },
                                { id: 'insight', icon: Quote, label: 'Intel Quote' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    title={tab.label}
                                    onClick={() => setMode(tab.id as HUDMode)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                        mode === tab.id
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "text-text-secondary hover:text-white"
                                    )}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                </button>
                            ))}
                            <button
                                title="Close HUD"
                                onClick={() => setIsOpen(false)}
                                className="shrink-0 w-9 flex items-center justify-center rounded-xl text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="min-h-[300px] flex flex-col justify-center">
                            {mode === 'timer' && (
                                <div className="p-2">
                                    <PomodoroTimer />
                                    <p className="text-[10px] text-center text-text-secondary font-bold uppercase tracking-[0.2em] mt-8">
                                        Focus Session Active
                                    </p>
                                </div>
                            )}

                            {mode === 'mentor' && (
                                <div className="flex flex-col h-[350px]">
                                    <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
                                        {messages.length === 0 && !isChatLoading ? (
                                            <div className="h-full flex flex-col justify-between py-2">
                                                {/* Header */}
                                                <div className="flex flex-col items-center text-center space-y-2 pt-2 opacity-60">
                                                    <Sparkles className="w-6 h-6 text-primary" />
                                                    <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                                                        Forge Intelligence — tap to ask
                                                    </p>
                                                </div>
                                                {/* FAQ chips */}
                                                <div className="flex flex-col gap-1.5 pb-1">
                                                    {FAQ_CHIPS.map((chip) => (
                                                        <motion.button
                                                            key={chip.label}
                                                            whileHover={{ x: 3 }}
                                                            whileTap={{ scale: 0.97 }}
                                                            onClick={() => sendQuery(chip.label)}
                                                            className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl bg-black/30 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                                                        >
                                                            <span className="text-base leading-none shrink-0">{chip.icon}</span>
                                                            <span className="text-[10px] font-bold text-text-secondary group-hover:text-white transition-colors leading-tight">
                                                                {chip.label}
                                                            </span>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {messages.map((m) => (
                                                    <div key={m.id} className={cn("flex flex-col space-y-1", m.role === 'user' ? "items-end" : "items-start")}>
                                                        <span className="text-[8px] font-bold uppercase tracking-widest text-text-secondary">
                                                            {m.role === 'user' ? 'Operator' : 'Forge Intelligence'}
                                                        </span>
                                                        <div className={cn(
                                                            "max-w-[90%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed",
                                                            m.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-surface border border-border-subtle rounded-tl-none font-mono"
                                                        )}>
                                                            {m.parts.map((p, i) => (
                                                                p.type === 'text' ? <span key={i}>{p.text}</span> :
                                                                    p.type === 'reasoning' ? (
                                                                        <div key={i} className="mb-2 p-2 bg-black/20 rounded-lg text-[10px] opacity-60 italic border-l-2 border-primary/30">
                                                                            {p.text}
                                                                        </div>
                                                                    ) : null
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Typing indicator — shows while awaiting/streaming response */}
                                                {isChatLoading && (
                                                    <div className="flex flex-col space-y-1 items-start">
                                                        <span className="text-[8px] font-bold uppercase tracking-widest text-text-secondary">Forge Intelligence</span>
                                                        <div className="px-4 py-3 bg-surface border border-border-subtle rounded-2xl rounded-tl-none flex items-center gap-1.5">
                                                            {[0, 1, 2].map((i) => (
                                                                <motion.div
                                                                    key={i}
                                                                    className="w-1.5 h-1.5 rounded-full bg-primary"
                                                                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                                                                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div ref={chatEndRef} />

                                    </div>
                                    <form onSubmit={handleChatSubmit} className="pt-4">
                                        <div className="relative">
                                            <input
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                placeholder={isChatLoading ? 'Forge is thinking...' : 'Ask Forge...'}
                                                disabled={isChatLoading}
                                                className={cn(
                                                    "w-full bg-black/40 border rounded-xl py-3 pl-4 pr-10 text-[11px] outline-none transition-all",
                                                    isChatLoading
                                                        ? "border-primary/50 animate-pulse placeholder:text-primary/40 cursor-not-allowed"
                                                        : "border-border-subtle focus:border-primary"
                                                )}
                                            />
                                            <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:text-primary transition-colors disabled:opacity-30">
                                                {isChatLoading ? (
                                                    <motion.div
                                                        className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                                    />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {mode === 'stats' && (
                                <div className="space-y-6 p-4">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Daily Progress</span>
                                            <span className="text-xl font-syne font-bold text-primary">{stats?.avgDiscipline || 0}%</span>
                                        </div>
                                        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${stats?.avgDiscipline || 0}%` }} className="h-full bg-primary" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/20 p-4 rounded-3xl border border-white/5">
                                            <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest mb-1">Hours Logged</p>
                                            <p className="text-xl font-syne font-bold">{stats?.weeklySummary?.totalHours || 0}H</p>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-3xl border border-white/5">
                                            <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest mb-1">Weekly Streak</p>
                                            <p className="text-xl font-syne font-bold font-mono">{stats?.streak || 0}D</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                                        <Target className="w-5 h-5 text-primary" />
                                        <p className="text-[10px] font-bold text-primary leading-tight uppercase tracking-wider text-xs">
                                            Continue the build. Milestone ahead.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {mode === 'insight' && (
                                <div className="p-8 text-center space-y-6">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                                        <Quote className="w-6 h-6 text-primary" />
                                    </div>
                                    <p className="text-sm font-medium italic leading-relaxed text-text-secondary">
                                        &quot;{currentInsight}&quot;
                                    </p>
                                    <button
                                        onClick={() => setCurrentInsight(insights[Math.floor(Math.random() * insights.length)])}
                                        className="text-[10px] font-bold text-primary uppercase tracking-widest border-b border-primary/20 hover:border-primary transition-all"
                                    >
                                        Next Intel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">Forge OS 3.0</span>
                            </div>
                            <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">Locked & Loaded</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
