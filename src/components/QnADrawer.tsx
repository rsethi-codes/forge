'use client'

import React, { useState, useTransition, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, Plus, Bot, Globe, Youtube, HelpCircle, ExternalLink,
    Check, Loader2, Trash2, Edit3, Tag, ChevronDown, MessageCircleQuestion,
    Save, RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { addQnA, updateQnA, deleteQnA, type QnAEntry, type QnASourceType } from '@/lib/actions/qna'

// ── Source type config ────────────────────────────────────────────────────────

export const SOURCE_CONFIG: Record<QnASourceType, {
    label: string; Icon: React.ElementType
    color: string; bg: string; border: string; ring: string
}> = {
    gpt: { label: 'GPT Answer', Icon: Bot, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', ring: 'ring-violet-500/30' },
    blog: { label: 'Blog Post', Icon: Globe, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', ring: 'ring-sky-500/30' },
    youtube: { label: 'YouTube', Icon: Youtube, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', ring: 'ring-rose-500/30' },
    other: { label: 'Other', Icon: HelpCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', ring: 'ring-amber-500/30' },
}

// ── Tag input helper ──────────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
    const [input, setInput] = useState('')
    const handleKey = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
            e.preventDefault()
            const t = input.trim().toLowerCase().replace(/,/g, '')
            if (t && !tags.includes(t)) onChange([...tags, t])
            setInput('')
        }
        if (e.key === 'Backspace' && !input && tags.length) {
            onChange(tags.slice(0, -1))
        }
    }
    return (
        <div className="flex flex-wrap gap-1.5 min-h-[40px] bg-[#0c0c0c] border border-white/10 rounded-xl px-3 py-2 focus-within:border-violet-500/50 transition-all">
            {tags.map(t => (
                <span key={t} className="flex items-center gap-1 bg-violet-500/15 text-violet-300 border border-violet-500/25 text-xs font-bold px-2 py-0.5 rounded-full">
                    #{t}
                    <button onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-red-400 transition-colors ml-0.5">
                        <X className="w-2.5 h-2.5" />
                    </button>
                </span>
            ))}
            <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={tags.length === 0 ? 'Add tags (Enter to confirm)...' : ''}
                className="bg-transparent text-sm outline-none flex-1 min-w-[120px] text-text-primary placeholder:text-text-secondary/30"
            />
        </div>
    )
}

// ── QnA Form (used for both Add and Edit) ────────────────────────────────────

interface QnAFormProps {
    dayId: string
    topicId?: string | null
    initial?: Partial<QnAEntry>
    onSaved: (qna: QnAEntry) => void
    onCancel: () => void
    isEditMode?: boolean
}

export function QnAForm({ dayId, topicId, initial, onSaved, onCancel, isEditMode = false }: QnAFormProps) {
    const [isPending, startTransition] = useTransition()
    const [question, setQuestion] = useState(initial?.question ?? '')
    const [answer, setAnswer] = useState(initial?.answerText ?? '')
    const [sourceType, setSourceType] = useState<QnASourceType>(initial?.sourceType ?? 'gpt')
    const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl ?? '')
    const [tags, setTags] = useState<string[]>((initial?.tags as string[]) ?? [])
    const [error, setError] = useState('')
    const questionRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => { questionRef.current?.focus() }, [])

    const handleSave = () => {
        if (!question.trim()) { setError('Please write your question first.'); return }
        setError('')
        startTransition(async () => {
            if (isEditMode && initial?.id) {
                const res = await updateQnA(initial.id, { question, answerText: answer, sourceType, sourceUrl, tags })
                if (res.success) {
                    onSaved({ ...(initial as QnAEntry), question, answerText: answer, sourceType, sourceUrl: sourceUrl || null, tags, updatedAt: new Date() })
                } else { setError(res.error ?? 'Save failed.') }
            } else {
                const res = await addQnA({ dayId, topicId, question, answerText: answer, sourceType, sourceUrl, tags })
                if (res.success && res.qna) { onSaved(res.qna) }
                else { setError(res.error ?? 'Save failed.') }
            }
        })
    }

    const cfg = SOURCE_CONFIG[sourceType]

    return (
        <div className="space-y-5">
            {/* Question */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Your Question / Doubt</label>
                <textarea
                    ref={questionRef}
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Why does React re-render even when state value is the same?"
                    rows={3}
                    className="w-full bg-[#0c0c0c] border border-white/10 rounded-xl p-4 text-base text-text-primary outline-none focus:border-violet-500/60 transition-all resize-none font-lora leading-relaxed"
                />
            </div>

            {/* Source selector */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Where did you find the answer?</label>
                <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(SOURCE_CONFIG) as QnASourceType[]).map(type => {
                        const c = SOURCE_CONFIG[type]
                        const active = sourceType === type
                        return (
                            <button
                                key={type}
                                onClick={() => setSourceType(type)}
                                className={cn(
                                    'flex flex-col items-center gap-1.5 py-3 rounded-xl border text-center transition-all',
                                    active ? `${c.bg} ${c.border} ${c.color}` : 'bg-[#0c0c0c] border-white/10 text-text-secondary hover:text-text-primary hover:border-white/20'
                                )}
                            >
                                <c.Icon className="w-4 h-4" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">{c.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Answer / notes */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                    {sourceType === 'gpt' ? 'GPT Answer / Explanation' : 'Key Takeaways / Notes'}
                </label>
                <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder={
                        sourceType === 'gpt' ? 'Paste the GPT explanation here. You can summarise it in your own words too...' :
                            sourceType === 'blog' ? 'Summarise the main insight from the blog...' :
                                sourceType === 'youtube' ? 'Note the timestamp + key concept from the video...' :
                                    'Write your notes or explanation here...'
                    }
                    rows={5}
                    className="w-full bg-[#0c0c0c] border border-white/10 rounded-xl p-4 text-sm text-text-primary outline-none focus:border-violet-500/60 transition-all resize-none font-lora leading-relaxed"
                />
            </div>

            {/* Source URL */}
            {(sourceType === 'blog' || sourceType === 'youtube' || sourceType === 'other') && (
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Source URL</label>
                    <input
                        type="url"
                        value={sourceUrl}
                        onChange={e => setSourceUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-[#0c0c0c] border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-violet-500/60 transition-all"
                    />
                </div>
            )}

            {/* Tags */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Tags <span className="normal-case font-normal opacity-50">(press Enter to add)</span></label>
                <TagInput tags={tags} onChange={setTags} />
            </div>

            {error && (
                <p className="text-sm text-red-400 font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50',
                        cfg.bg, cfg.border, cfg.color, 'border hover:opacity-80'
                    )}
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditMode ? <Save className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    {isEditMode ? 'Save Changes' : 'Save Q&A'}
                </button>
                <button
                    onClick={onCancel}
                    disabled={isPending}
                    className="px-5 py-3.5 bg-[#0c0c0c] border border-white/10 hover:border-red-500/30 text-text-secondary hover:text-red-400 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

// ── QnA Card (with inline edit) ───────────────────────────────────────────────

interface QnACardProps {
    qna: QnAEntry
    onUpdated: (updated: QnAEntry) => void
    onDeleted: (id: string) => void
}

export function QnACard({ qna, onUpdated, onDeleted }: QnACardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isDeleting, startDelete] = useTransition()
    const cfg = SOURCE_CONFIG[qna.sourceType]

    const handleDelete = () => {
        if (!confirm('Delete this Q&A?')) return
        startDelete(async () => {
            const res = await deleteQnA(qna.id)
            if (res.success) onDeleted(qna.id)
        })
    }

    if (isEditing) {
        return (
            <motion.div layout className={cn('rounded-2xl border p-5', cfg.bg, cfg.border)}>
                <div className="flex items-center gap-2 mb-4">
                    <Edit3 className={cn('w-3.5 h-3.5', cfg.color)} />
                    <span className={cn('text-[10px] font-bold uppercase tracking-widest', cfg.color)}>Editing Q&amp;A</span>
                </div>
                <QnAForm
                    dayId={qna.dayId}
                    topicId={qna.topicId}
                    initial={qna}
                    isEditMode
                    onSaved={(updated) => { onUpdated(updated); setIsEditing(false) }}
                    onCancel={() => setIsEditing(false)}
                />
            </motion.div>
        )
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className={cn('rounded-2xl border overflow-hidden transition-shadow hover:shadow-lg', cfg.border)}
        >
            {/* Card header — always visible */}
            <div
                className={cn('p-5 cursor-pointer', cfg.bg)}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start gap-3">
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border', cfg.bg, cfg.border)}>
                        <cfg.Icon className={cn('w-4 h-4', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-text-primary leading-snug text-sm">{qna.question}</p>
                        {!isExpanded && qna.answerText && (
                            <p className="text-xs text-text-secondary mt-1.5 font-lora italic line-clamp-1 opacity-70">{qna.answerText}</p>
                        )}
                        {(qna.tags as string[]).length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-2">
                                {(qna.tags as string[]).map(t => (
                                    <span key={t} className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border', cfg.bg, cfg.color, cfg.border)}>#{t}</span>
                                ))}
                            </div>
                        )}
                    </div>
                    <ChevronDown className={cn('w-4 h-4 text-text-secondary flex-shrink-0 transition-transform mt-1', isExpanded && 'rotate-180')} />
                </div>
            </div>

            {/* Expanded body */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-3 space-y-4 bg-[#0a0a0a] border-t border-white/5">
                            {qna.answerText && (
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary/50">Answer / Notes</span>
                                    <p className="text-sm text-text-secondary font-lora italic leading-relaxed whitespace-pre-wrap">{qna.answerText}</p>
                                </div>
                            )}

                            {qna.sourceUrl && (
                                <a
                                    href={qna.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className={cn('inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border transition-all hover:opacity-80', cfg.bg, cfg.color, cfg.border)}
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Open {cfg.label}
                                </a>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                <span className="text-[9px] text-text-secondary/40 font-bold uppercase tracking-widest">
                                    {new Date(qna.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    {qna.updatedAt !== qna.createdAt && ' · edited'}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsExpanded(false) }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-text-secondary hover:text-violet-400 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 transition-all uppercase tracking-wider"
                                    >
                                        <Edit3 className="w-3 h-3" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete() }}
                                        disabled={isDeleting}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-text-secondary hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all uppercase tracking-wider"
                                    >
                                        {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

export interface DrawerTopic {
    id: string | null   // null = general/day-level
    title: string
    topicNumber?: string
    qnas: QnAEntry[]
}

interface QnADrawerProps {
    isOpen: boolean
    onClose: () => void
    dayId: string
    dayTitle: string
    dayNumber: string | number
    topics: DrawerTopic[]
    defaultTopicId?: string | null  // which tab to open by default
}

export default function QnADrawer({ isOpen, onClose, dayId, dayTitle, dayNumber, topics: initialTopics, defaultTopicId }: QnADrawerProps) {
    const [topics, setTopics] = useState<DrawerTopic[]>(initialTopics)
    const [activeTopicId, setActiveTopicId] = useState<string | null>(defaultTopicId ?? initialTopics[0]?.id ?? null)
    const [showForm, setShowForm] = useState(false)

    // Sync default tab when opened externally (e.g. from search)
    useEffect(() => {
        if (isOpen && defaultTopicId !== undefined) {
            setActiveTopicId(defaultTopicId)
        }
    }, [isOpen, defaultTopicId])

    // Close on Escape
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); setShowForm(false) } }
        window.addEventListener('keydown', h)
        return () => window.removeEventListener('keydown', h)
    }, [onClose])

    const activeTopic = topics.find(t => t.id === activeTopicId) ?? topics[0]
    const totalQnAs = topics.reduce((s, t) => s + t.qnas.length, 0)

    const handleAdded = (qna: QnAEntry) => {
        setTopics(prev => prev.map(t =>
            t.id === activeTopicId ? { ...t, qnas: [qna, ...t.qnas] } : t
        ))
        setShowForm(false)
    }

    const handleUpdated = (updated: QnAEntry) => {
        setTopics(prev => prev.map(t => ({
            ...t,
            qnas: t.qnas.map(q => q.id === updated.id ? updated : q)
        })))
    }

    const handleDeleted = (id: string) => {
        setTopics(prev => prev.map(t => ({ ...t, qnas: t.qnas.filter(q => q.id !== id) })))
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
                        onClick={() => { onClose(); setShowForm(false) }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Drawer panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[#0d0d0d] border-l border-white/10 z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between px-7 py-6 border-b border-white/8 flex-shrink-0">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <MessageCircleQuestion className="w-4 h-4 text-violet-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Mind Q&amp;As</span>
                                    {totalQnAs > 0 && (
                                        <span className="bg-violet-500/20 text-violet-400 border border-violet-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full">{totalQnAs} saved</span>
                                    )}
                                </div>
                                <h2 className="text-lg font-syne font-bold tracking-tight text-text-primary line-clamp-1">Day {dayNumber}: {dayTitle}</h2>
                            </div>
                            <button onClick={() => { onClose(); setShowForm(false) }} className="p-2 rounded-xl hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Topic tabs */}
                        <div className="flex gap-1 px-4 py-3 overflow-x-auto border-b border-white/8 flex-shrink-0 scrollbar-hide">
                            {topics.map(topic => {
                                const isActive = topic.id === activeTopicId
                                return (
                                    <button
                                        key={topic.id ?? '__general__'}
                                        onClick={() => { setActiveTopicId(topic.id); setShowForm(false) }}
                                        className={cn(
                                            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex-shrink-0',
                                            isActive
                                                ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                                                : 'bg-transparent text-text-secondary hover:text-text-primary border-transparent hover:border-white/10'
                                        )}
                                    >
                                        {topic.topicNumber && <span className="text-[9px] opacity-70">{topic.topicNumber}</span>}
                                        <span className="max-w-[120px] truncate">{topic.title}</span>
                                        {topic.qnas.length > 0 && (
                                            <span className={cn('text-[9px] font-bold rounded-full px-1.5 py-0.5',
                                                isActive ? 'bg-violet-500/30 text-violet-400' : 'bg-white/10 text-text-secondary'
                                            )}>
                                                {topic.qnas.length}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
                            {/* Active topic context */}
                            {activeTopic?.topicNumber && (
                                <div className="flex items-center gap-2 pb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                    <span className="text-xs font-bold text-text-secondary">{activeTopic.topicNumber}: {activeTopic.title}</span>
                                </div>
                            )}

                            {/* Add form or add button */}
                            <AnimatePresence mode="wait">
                                {showForm ? (
                                    <motion.div
                                        key="form"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="bg-[#111] border border-violet-500/20 rounded-2xl p-6"
                                    >
                                        <div className="flex items-center gap-2 mb-5">
                                            <Plus className="w-4 h-4 text-violet-400" />
                                            <span className="text-xs font-bold uppercase tracking-widest text-violet-400">New Question</span>
                                            {activeTopic && <span className="text-xs text-text-secondary/50 ml-auto truncate max-w-[180px]">→ {activeTopic.title}</span>}
                                        </div>
                                        <QnAForm
                                            dayId={dayId}
                                            topicId={activeTopicId}
                                            onSaved={handleAdded}
                                            onCancel={() => setShowForm(false)}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        key="add-btn"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setShowForm(true)}
                                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-violet-500/20 hover:border-violet-500/50 text-violet-400/60 hover:text-violet-400 text-sm font-bold uppercase tracking-widest transition-all group"
                                    >
                                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                                        Add a Mind Question
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            {/* Q&A list */}
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {activeTopic?.qnas.map(qna => (
                                        <QnACard
                                            key={qna.id}
                                            qna={qna}
                                            onUpdated={handleUpdated}
                                            onDeleted={handleDeleted}
                                        />
                                    ))}
                                </AnimatePresence>

                                {(activeTopic?.qnas.length ?? 0) === 0 && !showForm && (
                                    <div className="text-center py-12 space-y-3">
                                        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                                            <MessageCircleQuestion className="w-5 h-5 text-violet-400/50" />
                                        </div>
                                        <p className="text-sm text-text-secondary/40 italic">No questions yet for this topic.</p>
                                        <p className="text-xs text-text-secondary/30">Every "why?" is worth capturing.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-7 py-4 border-t border-white/8 flex-shrink-0 flex items-center gap-4">
                            <span className="text-[9px] font-bold text-text-secondary/30 uppercase tracking-widest">ESC to close</span>
                            <span className="text-[9px] font-bold text-text-secondary/30 uppercase tracking-widest">·</span>
                            <span className="text-[9px] font-bold text-text-secondary/30 uppercase tracking-widest">All Q&amp;As linked to Day {dayNumber}</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
