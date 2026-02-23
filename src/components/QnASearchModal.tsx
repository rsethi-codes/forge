'use client'

import React, { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, X, Loader2, MessageCircleQuestion, BookOpen,
    ArrowRight, Bot, Globe, Youtube, HelpCircle, ExternalLink, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchQnAs, type QnAEntry, type QnASourceType } from '@/lib/actions/qna'
import Link from 'next/link'

const SOURCE_CONFIG: Record<QnASourceType, {
    label: string; Icon: React.ElementType; color: string; bg: string; border: string
}> = {
    gpt: { label: 'GPT', Icon: Bot, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
    blog: { label: 'Blog', Icon: Globe, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
    youtube: { label: 'YouTube', Icon: Youtube, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
    other: { label: 'Other', Icon: HelpCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
}

type SearchResult = QnAEntry & { dayNumber?: string; topicTitle?: string }

interface QnASearchModalProps {
    isOpen: boolean
    onClose: () => void
    /** Called when user selects a result — caller can open the drawer to that day/topic */
    onSelect?: (result: SearchResult) => void
}

// Highlight matched terms in text
function Highlighted({ text, q }: { text: string; q: string }) {
    if (!q.trim() || !text) return <>{text}</>
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return (
        <>
            {parts.map((p, i) =>
                regex.test(p)
                    ? <mark key={i} className="bg-violet-500/30 text-violet-200 rounded-sm px-0.5 not-italic">{p}</mark>
                    : p
            )}
        </>
    )
}

export default function QnASearchModal({ isOpen, onClose, onSelect }: QnASearchModalProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isPending, startSearch] = useTransition()
    const [hasSearched, setHasSearched] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<NodeJS.Timeout>()

    // Focus on open
    useEffect(() => {
        if (isOpen) {
            setQuery(''); setResults([]); setHasSearched(false); setSelectedIndex(0)
            setTimeout(() => inputRef.current?.focus(), 80)
        }
    }, [isOpen])

    // Debounced search
    useEffect(() => {
        if (!query.trim()) { setResults([]); setHasSearched(false); setSelectedIndex(0); return }
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setHasSearched(true)
            setSelectedIndex(0)
            startSearch(async () => {
                const found = await searchQnAs(query)
                setResults(found)
            })
        }, 350)
        return () => clearTimeout(debounceRef.current)
    }, [query])

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!isOpen) return
            if (e.key === 'Escape') { onClose(); return }
            if (results.length === 0) return
            if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
            if (e.key === 'Enter' && results[selectedIndex]) {
                handleSelect(results[selectedIndex])
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [isOpen, results, selectedIndex])

    const handleSelect = (result: SearchResult) => {
        if (onSelect) {
            onSelect(result)
            onClose()
        }
    }

    const groupedByDay: Record<string, SearchResult[]> = {}
    for (const r of results) {
        const key = r.dayNumber ?? 'unknown'
        if (!groupedByDay[key]) groupedByDay[key] = []
        groupedByDay[key].push(r)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -16 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="fixed top-[8%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 flex flex-col"
                        style={{ maxHeight: '82vh' }}
                    >
                        <div className="bg-[#0e0e0e] border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col">

                            {/* Search input */}
                            <div className="flex items-center gap-4 px-6 py-5 border-b border-white/8">
                                <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
                                    {isPending
                                        ? <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                                        : <Search className="w-3.5 h-3.5 text-violet-400" />
                                    }
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search your mind questions and answers..."
                                    className="flex-1 bg-transparent text-text-primary text-base outline-none placeholder:text-text-secondary/30 font-lora"
                                />
                                {query && (
                                    <button onClick={() => setQuery('')} className="text-text-secondary hover:text-text-primary transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors pl-2 border-l border-white/10">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Results */}
                            <div className="overflow-y-auto flex-1">

                                {/* Empty state */}
                                {!hasSearched && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center px-8 space-y-4">
                                        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                            <MessageCircleQuestion className="w-7 h-7 text-violet-400/60" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-syne font-bold text-lg text-text-primary">Search Your Q&amp;A Archive</h3>
                                            <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
                                                Find any question you asked, any GPT answer, blog note, or YouTube insight — across all days and topics.
                                            </p>
                                        </div>
                                        <div className="flex gap-3 mt-2">
                                            {['reconciliation', 'closure', 'useEffect', 'async'].map(t => (
                                                <button key={t} onClick={() => setQuery(t)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-text-secondary hover:text-text-primary hover:border-white/20 transition-all">
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {hasSearched && !isPending && results.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center px-8 space-y-2">
                                        <p className="font-syne font-bold text-text-secondary">No results for &ldquo;{query}&rdquo;</p>
                                        <p className="text-xs text-text-secondary/40">Try different keywords from your question or answer text.</p>
                                    </div>
                                )}

                                {results.length > 0 && (
                                    <div className="p-4 space-y-4">
                                        <div className="flex items-center gap-2 px-2">
                                            <span className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest">{results.length} result{results.length !== 1 ? 's' : ''}</span>
                                            {onSelect && <span className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest">· ↑↓ to navigate · Enter to open</span>}
                                        </div>

                                        {Object.entries(groupedByDay).map(([dayNum, dayResults]) => (
                                            <div key={dayNum} className="space-y-1.5">
                                                {/* Day group header */}
                                                <div className="flex items-center gap-2 px-2 py-1">
                                                    <BookOpen className="w-3 h-3 text-text-secondary/40" />
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary/40">Day {dayNum}</span>
                                                    <div className="flex-1 h-px bg-white/5" />
                                                </div>

                                                {dayResults.map((result, localIdx) => {
                                                    const globalIdx = results.indexOf(result)
                                                    const cfg = SOURCE_CONFIG[result.sourceType]
                                                    const isSelected = globalIdx === selectedIndex
                                                    return (
                                                        <motion.button
                                                            key={result.id}
                                                            onClick={() => handleSelect(result)}
                                                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                            className={cn(
                                                                'w-full text-left rounded-2xl border p-4 space-y-2.5 transition-all cursor-pointer group',
                                                                isSelected
                                                                    ? `${cfg.bg} ${cfg.border} shadow-lg`
                                                                    : 'bg-[#111] border-white/8 hover:border-white/15'
                                                            )}
                                                            initial={{ opacity: 0, y: 4 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: localIdx * 0.04 }}
                                                        >
                                                            {/* Meta row */}
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={cn('flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border', cfg.bg, cfg.color, cfg.border)}>
                                                                    <cfg.Icon className="w-2.5 h-2.5" />
                                                                    {cfg.label}
                                                                </span>
                                                                {result.topicTitle && (
                                                                    <span className="text-[9px] font-bold text-text-secondary/50 truncate max-w-[200px]">
                                                                        {result.topicTitle}
                                                                    </span>
                                                                )}
                                                                <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-text-secondary/30 group-hover:text-violet-400 transition-colors">
                                                                    {onSelect ? 'Open in drawer' : 'View Day'}
                                                                    <ChevronRight className="w-3 h-3" />
                                                                </span>
                                                            </div>

                                                            {/* Question */}
                                                            <p className="text-sm font-bold text-text-primary leading-snug text-left">
                                                                <Highlighted text={result.question} q={query} />
                                                            </p>

                                                            {/* Answer preview */}
                                                            {result.answerText && (
                                                                <p className="text-xs text-text-secondary font-lora italic leading-relaxed line-clamp-2 text-left">
                                                                    <Highlighted text={result.answerText} q={query} />
                                                                </p>
                                                            )}

                                                            {/* Tags + source link */}
                                                            {((result.tags as string[]).length > 0 || result.sourceUrl) && (
                                                                <div className="flex items-center justify-between pt-0.5">
                                                                    <div className="flex gap-1 flex-wrap">
                                                                        {(result.tags as string[]).map(tag => (
                                                                            <span key={tag} className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border', cfg.bg, cfg.color, cfg.border)}>
                                                                                #{tag}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    {result.sourceUrl && (
                                                                        <a
                                                                            href={result.sourceUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={e => e.stopPropagation()}
                                                                            className={cn('flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border transition-all hover:opacity-70', cfg.bg, cfg.color, cfg.border)}
                                                                        >
                                                                            <ExternalLink className="w-2.5 h-2.5" />
                                                                            Open
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </motion.button>
                                                    )
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-3 border-t border-white/8 flex items-center gap-4 bg-[#0b0b0b]">
                                <kbd className="text-[9px] font-bold text-text-secondary/30 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
                                <span className="text-[9px] text-text-secondary/30 font-bold">close</span>
                                <kbd className="text-[9px] font-bold text-text-secondary/30 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">↑↓</kbd>
                                <span className="text-[9px] text-text-secondary/30 font-bold">navigate</span>
                                <kbd className="text-[9px] font-bold text-text-secondary/30 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">↵</kbd>
                                <span className="text-[9px] text-text-secondary/30 font-bold">select</span>
                                <span className="ml-auto text-[9px] text-text-secondary/20 font-bold">Searches all days &amp; topics</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
