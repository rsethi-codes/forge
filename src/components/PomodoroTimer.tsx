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
    const [sessionId, setSessionId] = useState<string | null>(null)

    const audioRef = useRef<HTMLAudioElement | null>(null)

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

        // Play sound if possible
        if (typeof window !== 'undefined') {
            const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
            beep.play().catch(() => { })
        }

        // Auto transition logic
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

    const Icon = MODES[mode].icon


    return (
        <div
            className="w-full bg-black/20 border border-white/5 rounded-[2rem] p-6 backdrop-blur-xl"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{MODES[mode].label}</span>
                </div>
            </div>

            <div className="text-center space-y-2 mb-8">
                <div className="text-5xl font-syne font-bold tracking-tighter tabular-nums text-white">
                    {formatTime(timeLeft)}
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary"
                        initial={false}
                        animate={{ width: `${(timeLeft / MODES[mode].time) * 100}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-center gap-4">
                <button
                    onClick={resetTimer}
                    className="p-3 bg-white/5 border border-white/10 rounded-2xl text-text-secondary hover:text-white transition-colors"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
                <button
                    onClick={handleStart}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-red-600 transition-all"
                >
                    {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                    {isActive ? 'Pause' : 'Start Focus'}
                </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6">
                {Object.entries(MODES).map(([k, v]) => (
                    <button
                        key={k}
                        onClick={() => switchMode(k as any)}
                        className={cn(
                            "py-2 rounded-xl text-[8px] font-bold uppercase tracking-widest border transition-all",
                            mode === k
                                ? "bg-white/10 border-white/20 text-white"
                                : "bg-transparent border-transparent text-text-secondary hover:text-white"
                        )}
                    >
                        {v.label.split(' ')[0]}
                    </button>
                ))}
            </div>
        </div>
    )
}
