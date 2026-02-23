'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    Play, Pause, RotateCcw, Coffee, Zap, X, Target, Sparkles,
    Maximize2, Volume2, VolumeX, Settings, ChevronRight,
    Trophy, Flame, TrendingUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { createPomodoroSession, completePomodoroSession } from '@/lib/actions/pomodoro'
import { createPortal } from 'react-dom'

const MODES = {
    work: { label: 'Focus', time: 25 * 60, color: '#ff3131', icon: Zap, message: 'Deep Work Protocol' },
    short_break: { label: 'Short Break', time: 5 * 60, color: '#00d68f', icon: Coffee, message: 'Neural Recharge' },
    long_break: { label: 'Long Break', time: 15 * 60, color: '#3b82f6', icon: Target, message: 'Strategic Reset' },
}

type ExitStage = null | 'first' | 'second'
type AmbientSound = 'none' | 'focus' | 'rain' | 'noise'

const MANTRAS = [
    "Discipline compounds.",
    "Stay in the fire.",
    "This is where others quit.",
    "Momentum is fragile. Protect it.",
    "Your future self is watching.",
    "The struggle is the shortcut.",
    "Deep work is the only real leverage.",
    "Distraction is the enemy of mastery.",
    "Forge the mind, the skill will follow.",
    "One more minute beats an hour of regret."
]

export default function PomodoroTimer() {
    // --- Core State ---
    const [mode, setMode] = useState<keyof typeof MODES>('work')
    const [timeLeft, setTimeLeft] = useState(MODES.work.time)
    const [isActive, setIsActive] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [zenEnabled, setZenEnabled] = useState(true)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [exitStage, setExitStage] = useState<ExitStage>(null)
    const [isCompleted, setIsCompleted] = useState(false)
    const [ambientSound, setAmbientSound] = useState<AmbientSound>('none')
    const [mantraIndex, setMantraIndex] = useState(0)

    // --- Audio Handles ---
    const ambientAudioRef = useRef<HTMLAudioElement | null>(null)

    // --- Settings Sync ---
    const refreshZenSetting = useCallback(() => {
        if (typeof window === 'undefined') return
        const saved = localStorage.getItem('pomodoro_zen_fullscreen')
        setZenEnabled(saved === 'true')
    }, [])

    useEffect(() => {
        refreshZenSetting()
        const onStorage = () => refreshZenSetting()
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [refreshZenSetting])

    // --- Fullscreen Manager ---
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false)
                setExitStage(null)
            }
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // --- Timer Logic ---
    const switchMode = useCallback((newMode: keyof typeof MODES) => {
        setMode(newMode)
        setTimeLeft(MODES[newMode].time)
        setIsActive(false)
        setIsCompleted(false)
    }, [])

    const handleComplete = useCallback(async () => {
        setIsActive(false)
        if (sessionId) {
            await completePomodoroSession(sessionId)
            setSessionId(null)
        }

        // Victory Tone
        if (typeof window !== 'undefined') {
            const victory = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3')
            victory.volume = 0.4
            victory.play().catch(() => { })
        }

        setIsCompleted(true)
    }, [sessionId])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1)
            }, 1000)
        } else if (timeLeft === 0 && isActive) {
            handleComplete()
        }
        return () => clearInterval(interval)
    }, [isActive, timeLeft, handleComplete])

    // --- Ambient Sound Engine ---
    useEffect(() => {
        if (!ambientAudioRef.current && typeof window !== 'undefined') {
            ambientAudioRef.current = new Audio()
            ambientAudioRef.current.loop = true
        }

        if (ambientAudioRef.current) {
            const sounds = {
                focus: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_3d1f057771.mp3?filename=deep-meditation-109040.mp3', // Calming meditation
                rain: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c0c806509a.mp3?filename=rain-on-window-109050.mp3', // Soft rain
                noise: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_51d4f95d86.mp3?filename=white-noise-103350.mp3', // Soft white noise
                none: ''
            }

            if (ambientSound !== 'none' && isActive && !isCompleted) {
                ambientAudioRef.current.src = sounds[ambientSound]
                ambientAudioRef.current.volume = 0.2
                ambientAudioRef.current.play().catch(() => { })
            } else {
                ambientAudioRef.current.pause()
            }
        }
    }, [ambientSound, isActive, isCompleted])

    // --- Mantra Engine ---
    useEffect(() => {
        if (isFullscreen && isActive) {
            const interval = setInterval(() => {
                setMantraIndex(prev => (prev + 1) % MANTRAS.length)
            }, 10000)
            return () => clearInterval(interval)
        }
    }, [isFullscreen, isActive])

    // --- User Actions ---
    const handleStart = async () => {
        const starting = !isActive
        if (starting && mode === 'work' && !sessionId) {
            const session = await createPomodoroSession({
                type: 'work',
                durationMinutes: 25
            })
            setSessionId(session.id)
        }

        setIsActive(starting)

        // Ignition Sound
        if (starting && typeof window !== 'undefined') {
            const ignite = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3')
            ignite.volume = 0.3
            ignite.play().catch(() => { })
        }

        if (starting && zenEnabled && !isFullscreen) {
            await toggleFullscreen()
        }
    }

    const resetTimer = () => {
        setIsActive(false)
        setTimeLeft(MODES[mode].time)
        setSessionId(null)
        setExitStage(null)
        setIsCompleted(false)
    }

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen()
                }
                setIsFullscreen(true)
                setExitStage(null)
            } catch (err) {
                setIsFullscreen(true)
            }
        } else {
            if (document.fullscreenElement) {
                await document.exitFullscreen()
            }
            setIsFullscreen(false)
            setExitStage(null)
        }
    }

    const handleExitClick = () => {
        if (!isActive || isCompleted) {
            toggleFullscreen()
            return
        }
        setExitStage('first')
    }

    // --- Formatting ---
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    const progressPercentage = ((MODES[mode].time - timeLeft) / MODES[mode].time) * 100
    const strokeDasharray = 2 * Math.PI * 45 // radius 45

    // --- ZEN MODE 2.0 PORTAL ---
    const zenPortal = typeof document !== 'undefined' && isFullscreen && createPortal(
        <AnimatePresence mode="wait">
            <motion.div
                key="zen-container-v2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] bg-[#020202] flex flex-col items-center justify-center overflow-hidden font-syne select-none"
            >
                {/* 1. Cinematic Background Atmosphere */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                        animate={{
                            opacity: [0.08, 0.12, 0.08],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-x-0 top-[-20%] h-[140%] w-full"
                        style={{
                            background: `radial-gradient(circle at center, ${MODES[mode].color}15 0%, transparent 60%)`
                        }}
                    />

                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />

                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                x: Math.random() * 100 + '%',
                                y: Math.random() * 100 + '%',
                                opacity: 0
                            }}
                            animate={{
                                y: ['0%', '-100%'],
                                opacity: [0, 0.3, 0],
                                scale: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 10 + Math.random() * 20,
                                repeat: Infinity,
                                delay: Math.random() * 10,
                                ease: 'linear'
                            }}
                            className="absolute w-1 h-1 rounded-full bg-white blur-[1px]"
                            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                        />
                    ))}
                </div>

                {/* 2. Top Navigation / Metrics */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute top-12 px-12 w-full flex justify-between items-center z-50 text-[10px] font-bold uppercase tracking-[0.5em] text-white/20"
                >
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Flame className="w-3 h-3 text-primary" />
                            <span>Streak: 5 days</span>
                        </div>
                        <div className="w-px h-4 bg-white/5" />
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-white/40" />
                            <span>Daily: 4.2h</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <motion.div
                            animate={{ opacity: isActive ? [0.2, 1, 0.2] : 0.5 }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-primary"
                            style={{ filter: `drop-shadow(0 0 8px ${MODES[mode].color})` }}
                        />
                        <span>{mode.replace('_', ' ')} state</span>
                    </div>
                </motion.div>

                {/* 3. The Central Clock Complex */}
                <div className="relative flex flex-col items-center justify-center mt-[-40px]">
                    <AnimatePresence mode="wait">
                        {!isCompleted ? (
                            <motion.div
                                key="clock-active"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.1, opacity: 0 }}
                                className="relative flex items-center justify-center p-20"
                            >
                                <svg className="absolute w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] -rotate-90 group" viewBox="0 0 100 100">
                                    <defs>
                                        <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#ff3131" />
                                            <stop offset="50%" stopColor="#ff9a31" />
                                            <stop offset="100%" stopColor="#00d68f" />
                                        </linearGradient>
                                        <filter id="glow">
                                            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                                            <feMerge>
                                                <feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>
                                    <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" fill="none" />

                                    {[...Array(12)].map((_, i) => (
                                        <line
                                            key={i}
                                            x1="50" y1="5" x2="50" y2="7.5"
                                            stroke="rgba(255,255,255,0.08)"
                                            strokeWidth="0.2"
                                            style={{ transformOrigin: '50% 50%', transform: `rotate(${i * 30}deg)` }}
                                        />
                                    ))}

                                    <motion.circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        stroke="url(#timer-gradient)"
                                        strokeWidth="2.5"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeDasharray={strokeDasharray}
                                        initial={{ strokeDashoffset: strokeDasharray }}
                                        animate={{ strokeDashoffset: strokeDasharray - (strokeDasharray * progressPercentage) / 100 }}
                                        transition={{ duration: 1, ease: 'linear' }}
                                        filter="url(#glow)"
                                    />

                                    <motion.circle
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                        cx="50" cy="50" r="48"
                                        stroke="rgba(255,255,255,0.02)"
                                        strokeWidth="0.2"
                                        strokeDasharray="1 10"
                                        fill="none"
                                    />
                                </svg>

                                <div className="relative z-10 text-center flex flex-col items-center">
                                    <motion.div
                                        animate={{
                                            textShadow: isActive ? [
                                                `0 0 40px ${MODES[mode].color}03`,
                                                `0 0 60px ${MODES[mode].color}08`,
                                                `0 0 40px ${MODES[mode].color}03`,
                                            ] : `0 0 0px transparent`
                                        }}
                                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                                        className="text-white font-black leading-none tracking-tighter select-none"
                                        style={{
                                            fontSize: 'clamp(5rem, 15vw, 12rem)',
                                            fontVariantNumeric: 'tabular-nums'
                                        }}
                                    >
                                        {formatTime(timeLeft)}
                                    </motion.div>

                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={mantraIndex}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 2 }}
                                            className="mt-8 text-[11px] font-bold uppercase tracking-[0.5em] text-white/20 italic max-w-sm px-4"
                                        >
                                            {MANTRAS[mantraIndex]}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="completion-screen"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center text-center space-y-12"
                            >
                                <div className="relative">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                        className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full border border-primary/20 flex items-center justify-center"
                                        style={{ boxShadow: `0 0 100px ${MODES[mode].color}20` }}
                                    >
                                        <Trophy className="w-16 h-16 sm:w-24 sm:h-24 text-primary opacity-50" />
                                    </motion.div>
                                    <div className="absolute inset-x-0 bottom-[-20px] bg-black px-6 py-2 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                                        Protocol Secured
                                    </div>
                                </div>

                                <div className="space-y-4 px-6">
                                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase italic">You kept your word.</h2>
                                    <p className="text-white/40 font-lora text-base sm:text-xl italic max-w-md mx-auto">
                                        A session completed is a neural link strengthened. Momentum is now on your side.
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-4 sm:gap-8 w-full max-w-lg pt-4">
                                    {[
                                        { label: 'Time Spent', val: '25:00', icon: Zap },
                                        { label: 'Work Streak', val: '5x', icon: Target },
                                        { label: 'Gain', val: '+4.2', icon: TrendingUp },
                                    ].map((m, i) => (
                                        <div key={i} className="space-y-2">
                                            <m.icon className="w-4 h-4 mx-auto text-white/20" />
                                            <div className="text-base sm:text-lg font-black text-white">{m.val}</div>
                                            <div className="text-[8px] font-bold uppercase tracking-widest text-white/20">{m.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-10 px-6">
                                    <button
                                        onClick={() => switchMode('work')}
                                        className="px-10 py-5 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                                    >
                                        Execute Next Session
                                    </button>
                                    <button
                                        onClick={() => switchMode('short_break')}
                                        className="px-10 py-5 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-white/10 transition-all w-full sm:w-auto"
                                    >
                                        Take Recharge
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 4. Controls Islet */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-12 sm:bottom-16 h-24 sm:h-28 flex items-center gap-3 sm:gap-4 px-6 sm:px-8 bg-white/[0.03] border border-white/5 rounded-[3rem] backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] group/controls z-50"
                >
                    <button
                        onClick={resetTimer}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-all"
                        title="Reset Protocol"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>

                    <div className="w-px h-10 bg-white/5 mx-1" />

                    <button
                        onClick={handleStart}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center relative group/btn"
                    >
                        <motion.div
                            animate={{ scale: isActive ? [1, 1.15, 1] : 1, opacity: isActive ? [0.1, 0.2, 0.1] : 0 }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-full bg-white"
                        />
                        <div className="z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-white/5 border border-white/10 group-hover/btn:border-white/30 transition-all">
                            {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                        </div>
                    </button>

                    <div className="w-px h-10 bg-white/5 mx-1" />

                    <div className="hidden sm:flex items-center gap-1">
                        {[
                            { id: 'none', icon: VolumeX },
                            { id: 'focus', icon: Volume2 },
                            { id: 'rain', icon: Coffee },
                            { id: 'noise', icon: Target },
                        ].map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setAmbientSound(s.id as AmbientSound)}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                    ambientSound === s.id ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40 hover:bg-white/5"
                                )}
                            >
                                <s.icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-10 bg-white/5 mx-1 hidden sm:block" />

                    <button
                        onClick={handleExitClick}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white/20 hover:text-primary hover:bg-white/5 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </motion.div>

                {/* 5. Friction Gates */}
                <AnimatePresence>
                    {exitStage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[100] flex items-center justify-center p-8 bg-black/95 backdrop-blur-2xl"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 30, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                className="max-w-md w-full space-y-10 text-center"
                            >
                                <div className="space-y-6">
                                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                                        Momentum At Risk
                                    </div>
                                    <h2 className="text-4xl font-black tracking-tight text-white leading-[0.9]">
                                        {exitStage === 'first' ? 'ARE YOU BREAKING MOMENTUM?' : 'THIS LOWERS YOUR DISCIPLINE.'}
                                    </h2>
                                    <p className="text-white/50 font-lora text-lg italic leading-relaxed">
                                        {exitStage === 'first'
                                            ? `You are ${Math.floor((MODES[mode].time - timeLeft) / 60)} minutes in. Quitting now weakens the neural habit loop.`
                                            : "Only the top 1% choose to stay when the friction is highest. Your future self is waiting."}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={() => setExitStage(null)}
                                        className="w-full py-5 bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Return to Focus
                                    </button>
                                    <button
                                        onClick={exitStage === 'first' ? () => setExitStage('second') : toggleFullscreen}
                                        className="w-full py-4 text-white/20 text-[10px] font-bold uppercase tracking-[0.3em] hover:text-white transition-all"
                                    >
                                        {exitStage === 'first' ? 'I need to leave' : 'End Session Anyway'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 6. Subtle Branding Footer */}
                <div className="absolute bottom-8 flex flex-col items-center gap-3 opacity-20">
                    <span className="text-[7px] font-black uppercase tracking-[1.5em] text-white">Forge / Zen Protocol 2.0 / Committed</span>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )

    const Icon = MODES[mode].icon

    return (
        <div className="relative">
            {zenPortal}

            <div className="w-full bg-[#111] border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={toggleFullscreen} className="p-2 hover:bg-white/5 rounded-lg text-text-secondary" title="Fullscreen">
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
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: MODES[mode].color }}
                            initial={false}
                            animate={{ width: `${(timeLeft / MODES[mode].time) * 100}%` }}
                            transition={{ duration: 0.5 }}
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
                            onClick={() => switchMode(k as keyof typeof MODES)}
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
