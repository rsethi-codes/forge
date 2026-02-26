'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, MessageSquare, AlertTriangle, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DayOffModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string) => void
}

export default function DayOffModal({ isOpen, onClose, onConfirm }: DayOffModalProps) {
    const [reason, setReason] = React.useState('')
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reason.trim()) return

        setIsSubmitting(true)
        try {
            await onConfirm(reason)
            setReason('')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                    >
                        <div className="p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-2xl font-syne font-black uppercase tracking-tighter italic">Schedule Recalibration</h2>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-text-secondary" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-4">
                                    <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0" />
                                    <p className="text-xs text-text-secondary font-medium leading-relaxed">
                                        Taking a day off will shift your linear trajectory by <span className="text-blue-400 font-bold">+1 day</span>.
                                        Forge Intelligence requires a justification for this break to calibrate your discipline index.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3 text-primary" />
                                        Justification for Neural Sync Suspension
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Why is it necessary to pause the mission today? (Be honest, the AI knows...)"
                                        className="w-full h-32 bg-surface-elevated border border-white/5 rounded-2xl p-4 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-colors resize-none placeholder:text-text-secondary/30"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={!reason.trim() || isSubmitting}
                                    className="w-full h-14 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Analyzing Strategy...' : 'Confirm Recalibration'}
                                    <ShieldCheck className="w-4 h-4" />
                                </button>
                                <p className="text-center text-[10px] text-text-secondary uppercase tracking-[0.2em] font-medium">
                                    The discipline AI matches excuses against your historical frequency.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
