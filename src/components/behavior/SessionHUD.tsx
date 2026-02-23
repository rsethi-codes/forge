'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Ghost, Power, Pause, Play, Target, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionHUDProps {
    sessionId: string
    onEnd: (stats: { interruptions: number, distractions: number }) => void
    title?: string
}

export default function SessionHUD({ sessionId, onEnd, title }: SessionHUDProps) {
    const [seconds, setSeconds] = useState(0)
    const [interruptions, setInterruptions] = useState(0)
    const [distractions, setDistractions] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)

    useEffect(() => {
        let interval: any
        if (!isPaused) {
            interval = setInterval(() => {
                setSeconds(s => s + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isPaused])

    // Automated Tracking: Tab Switches (Distractions)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                setDistractions(d => d + 1)
            }
        }

        const handleBlur = () => {
            // Window lost focus, usually a distraction
            setInterruptions(i => i + 1)
        }

        window.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('blur', handleBlur)
        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('blur', handleBlur)
        }
    }, [])

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        const sec = s % 60
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    }

    if (isMinimized) {
        return (
            <motion.div
                layoutId="hud"
                className="fixed bottom-8 right-8 bg-primary rounded-full p-4 shadow-2xl cursor-pointer flex items-center gap-4 z-[9999]"
                onClick={() => setIsMinimized(false)}
            >
                <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-white font-mono font-bold">{formatTime(seconds)}</span>
            </motion.div>
        )
    }

    return (
        <motion.div
            layoutId="hud"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-0 right-0 px-4 md:px-8 z-[9999] flex justify-center pointer-events-none"
        >
            <div className="bg-[#0a0a0a]/90 border border-primary/30 rounded-[2.5rem] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden w-full max-w-5xl pointer-events-auto">
                {/* Progress System: Internalized to prevent overflow */}
                <div className="absolute top-0 left-0 w-full px-6 pt-4">
                    <div className="h-1.5 w-full bg-border-subtle/30 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((seconds / 3600) * 100, 100)}%` }}
                            className="h-full bg-gradient-to-r from-primary via-red-400 to-primary shadow-[0_0_15px_rgba(255,49,49,0.4)]"
                        />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10 justify-between">
                    <div className="flex items-center gap-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] block">War Room Protocol</span>
                            <h4 className="text-lg font-syne font-bold text-text-primary max-w-[180px] lg:max-w-[240px] truncate leading-none">
                                {title || "Active Focus"}
                            </h4>
                        </div>

                        <div className="h-12 w-[1px] bg-border-subtle/50 hidden sm:block" />

                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] block">Runtime</span>
                            <span className="text-4xl font-mono font-bold tracking-tighter text-primary">{formatTime(seconds)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 px-5 py-3 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-2">
                                <AlertCircle className={cn("w-4 h-4", interruptions > 0 ? "text-orange-500" : "text-text-secondary")} />
                                <div className="text-left">
                                    <span className="block text-[8px] font-black uppercase tracking-widest opacity-50">Focus Breaks</span>
                                    <span className="text-xs font-bold font-mono">{interruptions}</span>
                                </div>
                            </div>
                            <div className="w-[1px] h-6 bg-white/10" />
                            <div className="flex items-center gap-2">
                                <Ghost className={cn("w-4 h-4", distractions > 0 ? "text-purple-500" : "text-text-secondary")} />
                                <div className="text-left">
                                    <span className="block text-[8px] font-black uppercase tracking-widest opacity-50">Context Drift</span>
                                    <span className="text-xs font-bold font-mono">{distractions}</span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-success uppercase tracking-widest animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-success" />
                            Biometric Sync Active
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className="w-14 h-14 rounded-2xl border border-border-subtle flex items-center justify-center text-text-secondary hover:bg-surface-elevated hover:text-primary transition-all active:scale-90"
                        >
                            {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                        </button>
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="w-14 h-14 rounded-2xl border border-border-subtle flex items-center justify-center text-text-secondary hover:bg-surface-elevated transition-all active:scale-90"
                        >
                            <Minimize2 className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => onEnd({ interruptions, distractions })}
                            className="h-14 px-8 rounded-2xl bg-primary text-white font-bold flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,49,49,0.3)] border border-primary/50"
                        >
                            <Power className="w-5 h-5" />
                            <span className="hidden sm:inline">End Protocol</span>
                            <span className="sm:hidden">End</span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
