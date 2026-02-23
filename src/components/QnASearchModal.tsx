'use client'

import React, { useState, useTransition, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search,
    X,
    Bot,
    Globe,
    Youtube,
    HelpCircle,
    ExternalLink,
    Loader2,
    MessageCircleQuestion,
    BookOpen,
    ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchQnAs, type QnAEntry, type QnASourceType } from '@/lib/actions/qna'
import Link from 'next/link'

const SOURCE_CONFIG: Record<QnASourceType, { label: string; Icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
    gpt: { label: 'GPT', Icon: Bot, color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/30' },
    blog: { label: 'Blog', Icon: Globe, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
    youtube: { label: 'YouTube', Icon: Youtube, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
    other: { label: 'Other', Icon: HelpCircle, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
}

type SearchResult = QnAEntry & { dayNumber?: string; topicTitle?: string }

interface QnASearchModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function QnASearchModal({ isOpen, onClose }: QnASearchModalProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isPending, startSearch] = useTransition()
    const [hasSearched, setHasSearched] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<NodeJS.Timeout>()

    // Focus on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
        } else {
            setQuery('')
            setResults([])
            setHasSearched(false)
        }
    }, [isOpen])

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            setHasSearched(false)
            return
        }
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setHasSearched(true)
            startSearch(async () => {
                const found = await searchQnAs(query)
                setResults(found)
            })
        }, 400)
        return () => clearTimeout(debounceRef.current)
    }, [query])

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    // Highlight the search term inside text
    const highlight = (text: string, q: string) => {
        if (!q.trim() || !text) return text
        const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
        const parts = text.split(regex)
        return parts.map((part, i) =>
            regex.test(part)
                ? <mark key={i} className="bg-violet-500/30 text-violet-200 rounded px-0.5">{part}</mark>
                : part
        )
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-[#0e0e0e] border border-violet-500/20 rounded-3xl shadow-2xl shadow-violet-900/20 z-50 overflow-hidden"
                        style={{ maxHeight: '80vh' }}
                    >
                        {/* Search header */}
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-border-subtle">
                            <MessageCircleQuestion className="w-5 h-5 text-violet-400 flex-shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search your mind questions & answers..."
                                className="flex-1 bg-transparent text-text-primary text-base outline-none placeholder:text-text-secondary/40 font-lora"
                            />
                            <div className="flex items-center gap-2">
                                {isPending && <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />}
                                {query && (
                                    <button onClick={() => setQuery('')} className="text-text-secondary hover:text-text-primary transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors ml-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 85px)' }}>
                            {!hasSearched && (
                                <div className="flex flex-col items-center justify-center py-16 text-center px-8 space-y-3">
                                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                        <Search className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <h3 className="font-syne font-bold text-lg">Search Your Q&A Archive</h3>
                                    <p className="text-text-secondary text-sm max-w-sm leading-relaxed">
                                        Search across all your questions, GPT answers, blog notes, and YouTube insights stored topic-by-topic.
                                    </p>
                                </div>
                            )}

                            {hasSearched && !isPending && results.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-center px-8 space-y-2">
                                    <p className="font-syne font-bold text-text-secondary">No Q&As found for &ldquo;{query}&rdquo;</p>
                                    <p className="text-xs text-text-secondary/50">Try different keywords from your question or answer text.</p>
                                </div>
                            )}

                            {results.length > 0 && (
                                <div className="p-4 space-y-2">
                                    <p className="text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest px-2 mb-3">
                                        {results.length} result{results.length !== 1 ? 's' : ''} found
                                    </p>
                                    {results.map(qna => {
                                        const cfg = SOURCE_CONFIG[qna.sourceType]
                                        return (
                                            <motion.div
                                                key={qna.id}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={cn(
                                                    "p-4 rounded-2xl border space-y-2 transition-colors",
                                                    cfg.bgColor, cfg.borderColor
                                                )}
                                            >
                                                {/* Meta */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={cn("flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border", cfg.bgColor, cfg.color, cfg.borderColor)}>
                                                        <cfg.Icon className="w-2.5 h-2.5" />
                                                        {cfg.label}
                                                    </span>
                                                    {qna.dayNumber && (
                                                        <Link
                                                            href={`/tracker/day/${qna.dayNumber}`}
                                                            onClick={onClose}
                                                            className="flex items-center gap-1 text-[9px] font-bold text-text-secondary hover:text-primary transition-colors"
                                                        >
                                                            <BookOpen className="w-2.5 h-2.5" />
                                                            Day {qna.dayNumber}
                                                        </Link>
                                                    )}
                                                    {qna.topicTitle && (
                                                        <span className="text-[9px] text-text-secondary/50 font-bold truncate max-w-[160px]">
                                                            → {qna.topicTitle}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Question */}
                                                <p className="text-sm font-bold text-text-primary leading-snug">
                                                    {highlight(qna.question, query)}
                                                </p>

                                                {/* Answer preview */}
                                                {qna.answerText && (
                                                    <p className="text-xs text-text-secondary font-lora italic leading-relaxed line-clamp-2">
                                                        {highlight(qna.answerText, query)}
                                                    </p>
                                                )}

                                                {/* Tags + link */}
                                                <div className="flex items-center justify-between pt-1">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {(qna.tags as string[]).map(tag => (
                                                            <span key={tag} className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", cfg.bgColor, cfg.color, cfg.borderColor)}>
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {qna.sourceUrl && (
                                                        <a
                                                            href={qna.sourceUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={cn("flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border transition-all hover:opacity-80", cfg.bgColor, cfg.color, cfg.borderColor)}
                                                        >
                                                            <ExternalLink className="w-2.5 h-2.5" />
                                                            Open
                                                        </a>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer hint */}
                        <div className="px-6 py-3 border-t border-border-subtle flex items-center gap-4">
                            <span className="text-[9px] text-text-secondary/40 font-bold uppercase tracking-widest">ESC to close</span>
                            <span className="text-[9px] text-text-secondary/40 font-bold uppercase tracking-widest">Search is live across all days & topics</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
