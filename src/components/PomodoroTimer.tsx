'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, RotateCcw, Coffee, Zap, X, Minus, Maximize2, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { createPomodoroSession, completePomodoroSession } from '@/lib/actions/pomodoro'

const MODES = {
    work: { label: 'Focus', time: 25 * 60, color: '#ff3131', icon: Zap },
    short_break: { label: 'Short Break', time: 5 * 60, color: '#00d68f', icon: Coffee },
    long_break: { label: 'Long Break', time: 15 * 60, color: '#3b82f6', icon: Target },
}

export default function PomodoroTimer() {
    const [mode, setMode] = useState<keyof typeof MODES>('work')
    const [timeLeft, setTimeLeft] = useState(MODES.work.time)
    const [isActive, setIsActive] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [zenEnabled, setZenEnabled] = useState(true)
    const [sessionId, setSessionId] = useState<string | null>(null)

    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        const savedZen = localStorage.getItem('pomodoro_zen_fullscreen')
        if (savedZen !== null) setZenEnabled(savedZen === 'true')

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false)
            }
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    const switchMode = useCallback((newMode: keyof typeof MODES) => {
        setMode(newMode)
        setTimeLeft(MODES[newMode].time)
        setIsActive(false)
    }, [])

    const handleComplete = useCallback(async () => {
        setIsActive(false)
        if (sessionId) {
            await completePomodoroSession(sessionId)
            setSessionId(null)
        }

        if (typeof window !== 'undefined') {
            const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
            beep.play().catch(() => { })
        }

        if (mode === 'work') switchMode('short_break')
        else switchMode('work')
    }, [sessionId, mode, switchMode])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1)
            }, 1000)
        } else if (timeLeft === 0) {
            handleComplete()
        }
        return () => clearInterval(interval)
    }, [isActive, timeLeft, handleComplete])

    const handleStart = async () => {
        if (!isActive && mode === 'work' && !sessionId) {
            const session = await createPomodoroSession({
                type: 'work',
                durationMinutes: 25
            })
            setSessionId(session.id)
        }
        setIsActive(!isActive)
    }

    const resetTimer = () => {
        setIsActive(false)
        setTimeLeft(MODES[mode].time)
        setSessionId(null)
    }

    const toggleFullscreen = async () => {
        if (!zenEnabled) {
            setIsFullscreen(!isFullscreen)
            return
        }

        if (!isFullscreen) {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen()
                }
                setIsFullscreen(true)
            } catch (err) {
                console.error('Fullscreen failed:', err)
                setIsFullscreen(true)
            }
        } else {
            if (document.fullscreenElement) {
                await document.exitFullscreen()
            }
            setIsFullscreen(false)
        }
    }

    const Icon = MODES[mode].icon

    return (
        <div className="relative">
            <AnimatePresence>
                {isFullscreen && (
                    <motion.div
                        initial={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
                        animate={{ clipPath: 'circle(150% at 50% 50%)', opacity: 1 }}
                        exit={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
                        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
                    >
                        {/* Background Ambiance */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full blur-[120px] mix-blend-screen animate-pulse"
                                style={{ backgroundColor: MODES[mode].color + '30' }} />
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        </div>

                        <button
                            onClick={toggleFullscreen}
                            className="absolute top-10 right-10 p-6 bg-white/5 border border-white/10 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all hover:rotate-90 group z-50"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        <motion.div
                            layout
                            className="relative z-10 flex flex-col items-center space-y-20 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                                layoutId="pomodoro-timer"
                                className="text-[25rem] md:text-[32rem] font-syne font-black tracking-tighter leading-none tabular-nums select-none cursor-default"
                                style={{ color: 'white', textShadow: `0 0 100px ${MODES[mode].color}40, 0 0 200px ${MODES[mode].color}20` }}
                            >
                                {formatTime(timeLeft)}
                            </motion.div>

                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="flex items-center gap-12"
                            >
                                <button
                                    onClick={resetTimer}
                                    className="p-4 bg-white/5 border border-white/10 rounded-2xl text-text-secondary hover:text-white transition-all hover:scale-110 active:scale-90"
                                >
                                    <RotateCcw className="w-8 h-8" />
                                </button>
                                <button
                                    onClick={handleStart}
                                    className="w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xl"
                                    style={{ borderColor: MODES[mode].color, backgroundColor: isActive ? 'transparent' : MODES[mode].color }}
                                >
                                    {isActive ? (
                                        <Pause className="w-10 h-10 text-white fill-current" />
                                    ) : (
                                        <Play className="w-10 h-10 text-white fill-current translate-x-1" />
                                    )}
                                </button>
                                <button
                                    onClick={() => switchMode(mode === 'work' ? 'short_break' : 'work')}
                                    className="p-4 bg-white/5 border border-white/10 rounded-2xl text-text-secondary hover:text-white transition-all hover:scale-110 active:scale-95"
                                >
                                    <RotateCcw className="w-8 h-8 rotate-180" />
                                </button>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            transition={{ delay: 1 }}
                            className="absolute bottom-12 text-[10px] font-bold uppercase tracking-[0.5em] text-text-secondary"
                        >
                            Focus Protocol Engaged — Deep Work Mode
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full bg-[#111] border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={toggleFullscreen} className="p-2 hover:bg-white/5 rounded-lg text-text-secondary">
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                            <Icon className="w-5 h-5 text-primary" style={{ color: MODES[mode].color }} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">{MODES[mode].label}</span>
                            <span className="text-[8px] font-bold text-primary uppercase tracking-widest opacity-50" style={{ color: MODES[mode].color }}>Forge Active</span>
                        </div>
                    </div>
                </div>

                <div className="text-center space-y-6 mb-8">
                    <motion.div
                        layoutId="pomodoro-timer"
                        className="text-7xl font-syne font-bold tracking-tighter tabular-nums text-white"
                    >
                        {formatTime(timeLeft)}
                    </motion.div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
                            style={{ backgroundColor: MODES[mode].color }}
                            initial={false}
                            animate={{ width: `${(timeLeft / MODES[mode].time) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={resetTimer}
                        className="p-4 bg-white/5 border border-white/10 rounded-2xl text-text-secondary hover:text-white transition-colors"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleStart}
                        className="flex-1 py-4 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: MODES[mode].color, boxShadow: `0 10px 30px ${MODES[mode].color}20` }}
                    >
                        {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                        {isActive ? 'Freeze' : 'Ignite'}
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-8">
                    {Object.entries(MODES).map(([k, v]) => (
                        <button
                            key={k}
                            onClick={() => switchMode(k as any)}
                            className={cn(
                                "py-2.5 rounded-xl text-[8px] font-bold uppercase tracking-widest border transition-all",
                                mode === k
                                    ? "bg-white/10 border-white/20 text-white shadow-sm"
                                    : "bg-transparent border-transparent text-text-secondary hover:text-white"
                            )}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
