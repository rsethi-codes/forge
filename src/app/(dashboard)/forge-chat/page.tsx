'use client'

import React from 'react'
import { useChat } from '@ai-sdk/react'
import type { UIMessage } from 'ai'
import { motion } from 'framer-motion'
import { Send, Sparkles } from 'lucide-react'

import PageWrapper from '@/components/PageWrapper'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

export default function ForgeChatPage() {
    const pathname = usePathname()
    const [chatInput, setChatInput] = React.useState('')
    const [suggestions, setSuggestions] = React.useState<string[]>([])
    const [isSuggesting, setIsSuggesting] = React.useState(false)
    const [showSuggestions, setShowSuggestions] = React.useState(false)
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = React.useState(0)
    const suggestAbortRef = React.useRef<AbortController | null>(null)
    const suggestTimerRef = React.useRef<number | null>(null)

    const { messages, sendMessage, status } = useChat<UIMessage>({
        id: 'forge-chat',
        messages: [],
    })

    const isChatLoading = status === 'submitted' || status === 'streaming'

    const QUICK_ASKS = React.useMemo(
        () => [
            'What should I focus on today?',
            'Review my current task approach and suggest the next step.',
            'What is the riskiest part of my roadmap right now?',
            'Help me break my top task into 3 steps.',
            'Give me a hard technical challenge aligned with my current phase.',
            'Audit my discipline patterns and tell me what to fix first.',
        ],
        []
    )

    const sendQuery = (text: string) => {
        if (!text.trim() || isChatLoading) return
        sendMessage(
            { text },
            {
                headers: { 'Content-Type': 'application/json' },
                body: { context: { pathname, timestamp: new Date().toISOString() } },
            }
        )
    }

    const closeSuggestions = () => {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(0)
    }

    const requestSuggestions = React.useCallback(async (q: string) => {
        const query = q.trim()
        if (!query) {
            setSuggestions([])
            setIsSuggesting(false)
            closeSuggestions()
            return
        }

        // Cancel any in-flight request
        if (suggestAbortRef.current) suggestAbortRef.current.abort()
        const controller = new AbortController()
        suggestAbortRef.current = controller

        setIsSuggesting(true)
        try {
            const res = await fetch('/api/chat/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, context: { pathname } }),
                signal: controller.signal,
            })

            if (!res.ok) throw new Error('suggest_failed')
            const json = await res.json()
            const next = Array.isArray(json?.suggestions) ? json.suggestions : []
            setSuggestions(next)
            setShowSuggestions(next.length > 0)
            setSelectedSuggestionIndex(0)
        } catch (e: any) {
            if (e?.name === 'AbortError') return
            setSuggestions([])
            closeSuggestions()
        } finally {
            setIsSuggesting(false)
        }
    }, [pathname])

    React.useEffect(() => {
        // Debounce for typing
        if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current)

        if (!chatInput.trim() || isChatLoading) {
            setSuggestions([])
            closeSuggestions()
            return
        }

        suggestTimerRef.current = window.setTimeout(() => {
            requestSuggestions(chatInput)
        }, 400)

        return () => {
            if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current)
        }
    }, [chatInput, isChatLoading, requestSuggestions])

    React.useEffect(() => {
        // cleanup abort on unmount
        return () => {
            if (suggestAbortRef.current) suggestAbortRef.current.abort()
        }
    }, [])

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        closeSuggestions()
        sendQuery(chatInput)
        setChatInput('')
    }

    const applySuggestion = (s: string) => {
        setChatInput(s)
        setShowSuggestions(false)
        setSelectedSuggestionIndex(0)
    }

    return (
        <PageWrapper>
            <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
                <div className="flex items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">
                                Forge Intelligence
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-syne font-black tracking-tighter">
                            Forge Chat
                        </h1>
                        <p className="text-text-secondary text-sm font-medium max-w-2xl">
                            Full-screen mentor mode. Context-aware responses based on your live roadmap.
                        </p>
                    </div>
                </div>

                <div className="bg-surface border border-border-subtle rounded-[2.5rem] overflow-hidden">
                    <div className="h-[60vh] min-h-[420px] overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {messages.length === 0 && !isChatLoading ? (
                            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center gap-4 opacity-70">
                                <Sparkles className="w-10 h-10 text-primary" />
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-widest text-text-secondary">
                                        Ask anything
                                    </p>
                                    <p className="text-sm font-medium text-text-secondary max-w-md">
                                        Example: “What should I focus on today?” or “Review my approach for the current task.”
                                    </p>
                                </div>
                                <div className="w-full max-w-xl pt-6 flex flex-wrap justify-center gap-2 opacity-100">
                                    {QUICK_ASKS.slice(0, 4).map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => {
                                                closeSuggestions()
                                                sendQuery(q)
                                            }}
                                            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-white hover:border-primary/30 hover:bg-primary/5 transition-all"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((m) => (
                                    <div
                                        key={m.id}
                                        className={cn(
                                            'flex flex-col space-y-1',
                                            m.role === 'user' ? 'items-end' : 'items-start'
                                        )}
                                    >
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">
                                            {m.role === 'user' ? 'Operator' : 'Forge Intelligence'}
                                        </span>
                                        <div
                                            className={cn(
                                                'max-w-[85%] px-4 py-3 rounded-3xl text-[12px] leading-relaxed',
                                                m.role === 'user'
                                                    ? 'bg-primary text-white rounded-tr-none'
                                                    : 'bg-surface-elevated border border-border-subtle rounded-tl-none font-mono'
                                            )}
                                        >
                                            {m.parts.map((p, i) =>
                                                p.type === 'text' ? (
                                                    <span key={i}>{p.text}</span>
                                                ) : p.type === 'reasoning' ? (
                                                    <div
                                                        key={i}
                                                        className="mb-3 p-3 bg-black/20 rounded-2xl text-[11px] opacity-60 italic border-l-2 border-primary/30"
                                                    >
                                                        {p.text}
                                                    </div>
                                                ) : null
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isChatLoading && (
                                    <div className="flex flex-col space-y-1 items-start">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">
                                            Forge Intelligence
                                        </span>
                                        <div className="px-4 py-3 bg-surface-elevated border border-border-subtle rounded-3xl rounded-tl-none flex items-center gap-2">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-2 h-2 rounded-full bg-primary"
                                                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                                                    transition={{
                                                        duration: 1.2,
                                                        repeat: Infinity,
                                                        delay: i * 0.2,
                                                        ease: 'easeInOut',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="border-t border-white/5 p-4 md:p-6 bg-black/10">
                        {messages.length === 0 && (
                            <div className="pb-3 flex flex-wrap gap-2">
                                {QUICK_ASKS.map((q) => (
                                    <button
                                        key={q}
                                        type="button"
                                        onClick={() => {
                                            closeSuggestions()
                                            sendQuery(q)
                                        }}
                                        disabled={isChatLoading}
                                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-text-secondary hover:text-white hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-40"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                        <form onSubmit={handleChatSubmit} className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onFocus={() => {
                                        if (suggestions.length > 0) setShowSuggestions(true)
                                    }}
                                    onBlur={() => {
                                        // allow click selection
                                        window.setTimeout(() => closeSuggestions(), 120)
                                    }}
                                    onKeyDown={(e) => {
                                        if (!showSuggestions || suggestions.length === 0) return

                                        if (e.key === 'ArrowDown') {
                                            e.preventDefault()
                                            setSelectedSuggestionIndex((i) => (i + 1) % suggestions.length)
                                        } else if (e.key === 'ArrowUp') {
                                            e.preventDefault()
                                            setSelectedSuggestionIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
                                        } else if (e.key === 'Tab') {
                                            e.preventDefault()
                                            const s = suggestions[selectedSuggestionIndex]
                                            if (s) applySuggestion(s)
                                        } else if (e.key === 'Escape') {
                                            e.preventDefault()
                                            closeSuggestions()
                                        } else if (e.key === 'Enter') {
                                            // If the user is navigating suggestions, Enter applies the selected one.
                                            // A second Enter (form submit) will send it.
                                            const s = suggestions[selectedSuggestionIndex]
                                            if (s && chatInput.trim() !== s.trim()) {
                                                e.preventDefault()
                                                applySuggestion(s)
                                            }
                                        }
                                    }}
                                    placeholder={isChatLoading ? 'Forge is thinking...' : 'Ask Forge...'}
                                    disabled={isChatLoading}
                                    className={cn(
                                        'w-full bg-black/40 border rounded-2xl py-4 px-5 text-[12px] outline-none transition-all',
                                        isChatLoading
                                            ? 'border-primary/50 animate-pulse placeholder:text-primary/40 cursor-not-allowed'
                                            : 'border-border-subtle focus:border-primary'
                                    )}
                                />

                                {showSuggestions && suggestions.length > 0 && !isChatLoading && (
                                    <div className="absolute left-0 right-0 bottom-[calc(100%+10px)] bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                                        <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">
                                                Autocomplete
                                            </span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary/50">
                                                {isSuggesting ? 'Thinking…' : 'Tab to accept'}
                                            </span>
                                        </div>
                                        <div className="max-h-56 overflow-y-auto custom-scrollbar">
                                            {suggestions.map((s, idx) => (
                                                <button
                                                    key={`${s}-${idx}`}
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault()
                                                        applySuggestion(s)
                                                    }}
                                                    onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                                                    className={cn(
                                                        'w-full text-left px-4 py-3 text-[11px] font-bold transition-colors border-l-2',
                                                        idx === selectedSuggestionIndex
                                                            ? 'bg-primary/10 text-white border-primary'
                                                            : 'bg-transparent text-text-secondary border-transparent hover:bg-white/5 hover:text-white'
                                                    )}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={isChatLoading || !chatInput.trim()}
                                className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-40 disabled:hover:bg-primary"
                                aria-label="Send"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </PageWrapper>
    )
}
