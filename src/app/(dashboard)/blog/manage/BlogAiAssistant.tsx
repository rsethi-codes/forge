'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Wand2, FileText, Layout, Copy, Check, Loader2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BlogAiAssistantProps {
    isOpen: boolean
    onClose: () => void
    title: string
    content: string
    onApply: (type: 'title' | 'content' | 'excerpt', value: string) => void
}

export default function BlogAiAssistant({ isOpen, onClose, title, content, onApply }: BlogAiAssistantProps) {
    const [activeAction, setActiveAction] = useState<'generate-title' | 'polish' | 'summarize' | 'outline' | null>(null)
    const [result, setResult] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleAction = async (action: 'generate-title' | 'polish' | 'summarize' | 'outline') => {
        setIsGenerating(true)
        setResult('')
        setActiveAction(action)
        try {
            const response = await fetch('/api/blog/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, title, content })
            })

            if (!response.ok) throw new Error('AI failed to respond')

            // Note: In a production environment with proper SDK, you'd use useCompletion or similar
            // Here we'll manually handle the data stream for simplicity in this artifact
            const reader = response.body?.getReader()
            if (!reader) return

            const decoder = new TextDecoder()

            // Simple handling of the data stream response (Vercel AI SDK format)
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                setResult(prev => prev + chunk)
            }
        } catch (error) {
            console.error(error)
            setResult('Error: Failed to ignite Forge AI. Check Neural Link.')
        } finally {
            setIsGenerating(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const actions = [
        { id: 'generate-title', label: 'Inspire Title', icon: Layout, desc: 'Generate 5 high-impact titles' },
        { id: 'polish', label: 'Architect Polish', icon: Wand2, desc: 'Refine tone to Senior level' },
        { id: 'summarize', label: 'Brief Summary', icon: FileText, desc: 'Generate punchy excerpt' },
        { id: 'outline', label: 'Logic Outline', icon: Zap, desc: 'Expand notes into structure' },
    ]

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
                    />
                    <motion.aside
                        initial={{ x: -400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -400, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 w-[400px] h-screen bg-[#080808] border-r border-white/10 p-8 z-[80] overflow-y-auto custom-scrollbar shadow-2xl"
                    >
                        <header className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                </div>
                                <h2 className="text-xl font-black italic tracking-tighter uppercase">Forge AI Co-Pilot</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <X className="w-5 h-5 text-text-secondary" />
                            </button>
                        </header>

                        <div className="space-y-8">
                            <div className="grid grid-cols-1 gap-4">
                                {actions.map((action) => (
                                    <button
                                        key={action.id}
                                        onClick={() => handleAction(action.id as any)}
                                        disabled={isGenerating}
                                        className={cn(
                                            "flex items-start gap-4 p-4 rounded-2xl border transition-all text-left group",
                                            activeAction === action.id
                                                ? "bg-primary/10 border-primary/50"
                                                : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.08]"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                                            activeAction === action.id ? "bg-primary text-white" : "bg-white/5 text-text-secondary group-hover:text-primary"
                                        )}>
                                            <action.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest mb-1">{action.label}</p>
                                            <p className="text-[10px] text-text-secondary font-medium tracking-wider">{action.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">AI Intelligence Output</label>
                                    {result && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={copyToClipboard} className="p-1.5 hover:bg-white/5 rounded-lg transition-all" title="Copy Output">
                                                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-text-secondary" />}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="min-h-[300px] w-full bg-black/40 border border-white/5 rounded-[2rem] p-6 relative group overflow-hidden">
                                    {isGenerating && !result && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-primary/40">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">Calculating...</span>
                                        </div>
                                    )}

                                    {!result && !isGenerating && (
                                        <div className="absolute inset-0 flex items-center justify-center text-white/5 text-[10px] font-black uppercase tracking-[0.5em] select-none">
                                            Awaiting Input
                                        </div>
                                    )}

                                    <div className="text-sm text-text-secondary font-medium leading-relaxed whitespace-pre-wrap font-mono">
                                        {result}
                                        {isGenerating && result && <span className="w-2 h-4 bg-primary inline-block ml-1 animate-pulse" />}
                                    </div>
                                </div>

                                {result && !isGenerating && (
                                    <div className="grid grid-cols-1 gap-3">
                                        {activeAction === 'generate-title' && (
                                            <p className="text-[10px] text-text-secondary italic text-center mb-2">Copy your favorite title and paste it in the header.</p>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (activeAction === 'polish') onApply('content', result)
                                                else if (activeAction === 'summarize') onApply('excerpt', result)
                                                // titles are manual for now to avoid overwriting wrong field without selection
                                            }}
                                            className="w-full py-4 bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-xl hover:bg-primary hover:text-white transition-all transform hover:scale-[1.02] shadow-xl"
                                        >
                                            {activeAction === 'outline' ? 'Apply as Template' : 'Push to Production'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <footer className="mt-12 pt-8 border-t border-white/5">
                            <p className="text-[9px] text-white/20 font-medium uppercase tracking-[0.2em] leading-relaxed">
                                Forge AI is a predictive text engine. Verify all technical claims before publication.
                                <br />Internal Use Only // Build 0.8.4
                            </p>
                        </footer>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    )
}
