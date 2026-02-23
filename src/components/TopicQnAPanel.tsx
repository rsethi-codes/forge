'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    MessageCircleQuestion,
    Plus,
    Trash2,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Bot,
    Globe,
    Youtube,
    HelpCircle,
    X,
    Check,
    Loader2,
    Edit3,
    Tag,
    Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { addQnA, deleteQnA, updateQnA, type QnAEntry, type QnASourceType } from '@/lib/actions/qna'

// ── Source type config ────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<QnASourceType, { label: string; Icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
    gpt: { label: 'GPT Answer', Icon: Bot, color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/30' },
    blog: { label: 'Blog Post', Icon: Globe, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
    youtube: { label: 'YouTube', Icon: Youtube, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
    other: { label: 'Other', Icon: HelpCircle, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
}

// ── Add QnA Form ──────────────────────────────────────────────────────────────

interface AddQnAFormProps {
    dayId: string
    topicId?: string | null
    onAdded: (qna: QnAEntry) => void
    onCancel: () => void
}

function AddQnAForm({ dayId, topicId, onAdded, onCancel }: AddQnAFormProps) {
    const [isPending, startTransition] = useTransition()
    const [question, setQuestion] = useState('')
    const [answerText, setAnswerText] = useState('')
    const [sourceType, setSourceType] = useState<QnASourceType>('gpt')
    const [sourceUrl, setSourceUrl] = useState('')
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [error, setError] = useState('')

    const handleAddTag = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
            e.preventDefault()
            const newTag = tagInput.trim().toLowerCase().replace(/,/g, '')
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag])
            }
            setTagInput('')
        }
    }

    const handleSubmit = () => {
        if (!question.trim()) { setError('Question is required.'); return }
        setError('')
        startTransition(async () => {
            const result = await addQnA({
                dayId,
                topicId: topicId || null,
                question,
                answerText: answerText || undefined,
                sourceType,
                sourceUrl: sourceUrl || undefined,
                tags,
            })
            if (result.success && result.qna) {
                onAdded(result.qna)
            } else {
                setError(result.error || 'Failed to save.')
            }
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-[#0e0e0e] border border-violet-500/20 rounded-2xl p-5 space-y-4"
        >
            <div className="flex items-center gap-2 mb-1">
                <MessageCircleQuestion className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-violet-400">New Mind Question</span>
            </div>

            {/* Question */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Your Question</label>
                <textarea
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Why does React re-render on every state change?"
                    rows={2}
                    className="w-full bg-surface border border-border-subtle rounded-xl p-3 text-sm text-text-primary outline-none focus:border-violet-500/60 transition-all resize-none font-lora"
                    autoFocus
                />
            </div>

            {/* Source type selector */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Answer Source</label>
                <div className="flex gap-2 flex-wrap">
                    {(Object.keys(SOURCE_CONFIG) as QnASourceType[]).map(type => {
                        const cfg = SOURCE_CONFIG[type]
                        return (
                            <button
                                key={type}
                                onClick={() => setSourceType(type)}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all',
                                    sourceType === type
                                        ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`
                                        : 'bg-surface border-border-subtle text-text-secondary hover:text-text-primary'
                                )}
                            >
                                <cfg.Icon className="w-3 h-3" />
                                {cfg.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Answer / URL */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                    {sourceType === 'gpt' ? 'GPT Answer / Summary' : sourceType === 'blog' ? 'Blog URL + Notes' : sourceType === 'youtube' ? 'YouTube URL + Notes' : 'Notes'}
                </label>
                <textarea
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    placeholder={sourceType === 'gpt' ? 'Paste the GPT explanation here...' : 'Write your key takeaways...'}
                    rows={3}
                    className="w-full bg-surface border border-border-subtle rounded-xl p-3 text-sm text-text-primary outline-none focus:border-violet-500/60 transition-all resize-none font-lora"
                />
            </div>

            {(sourceType === 'blog' || sourceType === 'youtube' || sourceType === 'other') && (
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Source URL (optional)</label>
                    <input
                        type="url"
                        value={sourceUrl}
                        onChange={e => setSourceUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-violet-500/60 transition-all"
                    />
                </div>
            )}

            {/* Tags */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Tags (press Enter to add)</label>
                <div className="flex flex-wrap gap-1.5 min-h-[32px] bg-surface border border-border-subtle rounded-xl px-3 py-2 focus-within:border-violet-500/40 transition-all">
                    {tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {tag}
                            <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-red-400 transition-colors"><X className="w-2.5 h-2.5" /></button>
                        </span>
                    ))}
                    <input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder={tags.length === 0 ? 'reconciliation, rendering...' : ''}
                        className="bg-transparent text-xs outline-none flex-1 min-w-[80px] text-text-primary placeholder:text-text-secondary/40"
                    />
                </div>
            </div>

            {error && <p className="text-xs text-red-400 font-bold">{error}</p>}

            <div className="flex gap-2 pt-1">
                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Q&A
                </button>
                <button
                    onClick={onCancel}
                    disabled={isPending}
                    className="px-4 py-2.5 bg-surface border border-border-subtle hover:border-red-500/30 text-text-secondary hover:text-red-400 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    )
}

// ── QnA Card ──────────────────────────────────────────────────────────────────

interface QnACardProps {
    qna: QnAEntry
    onDeleted: (id: string) => void
}

function QnACard({ qna, onDeleted }: QnACardProps) {
    const [expanded, setExpanded] = useState(false)
    const [isDeleting, startDelete] = useTransition()
    const cfg = SOURCE_CONFIG[qna.sourceType]

    const handleDelete = () => {
        if (!confirm('Delete this Q&A entry?')) return
        startDelete(async () => {
            const result = await deleteQnA(qna.id)
            if (result.success) onDeleted(qna.id)
        })
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className={cn(
                "border rounded-xl overflow-hidden transition-colors",
                cfg.borderColor,
                cfg.bgColor
            )}
        >
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-left flex items-start gap-3 p-4"
            >
                <cfg.Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", cfg.color)} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary leading-snug line-clamp-2">{qna.question}</p>
                    {(qna.tags as string[]).length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1.5">
                            {(qna.tags as string[]).map(tag => (
                                <span key={tag} className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", cfg.bgColor, cfg.color, cfg.borderColor)}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {expanded ? <ChevronUp className="w-3.5 h-3.5 text-text-secondary" /> : <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />}
                </div>
            </button>

            {/* Expanded content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                            {qna.answerText && (
                                <p className="text-sm text-text-secondary leading-relaxed font-lora italic whitespace-pre-wrap">
                                    {qna.answerText}
                                </p>
                            )}
                            {qna.sourceUrl && (
                                <a
                                    href={qna.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all hover:opacity-80", cfg.bgColor, cfg.color, cfg.borderColor)}
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Open Source
                                </a>
                            )}
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-[9px] text-text-secondary/50 font-bold uppercase tracking-widest">
                                    {new Date(qna.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-1 text-[9px] font-bold text-red-500/50 hover:text-red-400 transition-colors uppercase tracking-widest"
                                >
                                    {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    Delete
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// ── Main TopicQnAPanel ────────────────────────────────────────────────────────

interface TopicQnAPanelProps {
    dayId: string
    topicId?: string | null
    topicTitle?: string
    initialQnAs: QnAEntry[]
    compact?: boolean
}

export default function TopicQnAPanel({ dayId, topicId, topicTitle, initialQnAs, compact = false }: TopicQnAPanelProps) {
    const [qnas, setQnAs] = useState<QnAEntry[]>(initialQnAs)
    const [isOpen, setIsOpen] = useState(false)
    const [showForm, setShowForm] = useState(false)

    const handleAdded = (qna: QnAEntry) => {
        setQnAs(prev => [qna, ...prev])
        setShowForm(false)
    }

    const handleDeleted = (id: string) => {
        setQnAs(prev => prev.filter(q => q.id !== id))
    }

    return (
        <div className="space-y-2">
            {/* Toggle button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border transition-all group",
                    isOpen
                        ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                        : "bg-surface border-border-subtle hover:border-violet-500/20 text-text-secondary hover:text-violet-300"
                )}
            >
                <div className="flex items-center gap-2">
                    <MessageCircleQuestion className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                        Mind Q&As
                    </span>
                    {qnas.length > 0 && (
                        <span className="bg-violet-500/20 text-violet-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-violet-500/20">
                            {qnas.length}
                        </span>
                    )}
                </div>
                {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 pt-1">
                            {/* Add button */}
                            {!showForm && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-violet-500/20 hover:border-violet-500/50 text-violet-400/60 hover:text-violet-400 text-[10px] font-bold uppercase tracking-widest transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add a Mind Question
                                </button>
                            )}

                            <AnimatePresence>
                                {showForm && (
                                    <AddQnAForm
                                        dayId={dayId}
                                        topicId={topicId}
                                        onAdded={handleAdded}
                                        onCancel={() => setShowForm(false)}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Q&A list */}
                            <div className="space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {qnas.map(qna => (
                                        <QnACard key={qna.id} qna={qna} onDeleted={handleDeleted} />
                                    ))}
                                </AnimatePresence>
                                {qnas.length === 0 && !showForm && (
                                    <p className="text-center text-[10px] text-text-secondary/40 py-3 italic">
                                        No questions yet. Your curious mind will fill this up.
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
