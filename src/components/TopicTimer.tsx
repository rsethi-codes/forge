'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, Timer, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { syncTimerState } from '@/lib/actions/day'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TimerSession {
    start: string   // ISO string
    end: string     // ISO string
}

export interface TimerResult {
    grossSeconds: number    // wall-clock total from first start to stop
    netSeconds: number      // only active (non-paused) seconds
    startedAt: Date
    sessions: TimerSession[]
}

type TimerState = 'idle' | 'running' | 'paused'

interface TopicTimerProps {
    /** Unique ID for the item */
    id: string
    /** Item type */
    type: 'task' | 'topic'
    /** Current day progress ID */
    progressId: string
    /** Initial status from server */
    initialStatus?: TimerState
    /** Initial sessions from server */
    initialSessions?: TimerSession[]
    /** Initial startedAt from server */
    initialStartedAt?: Date | null
    /** Already-stored seconds (gross) from DB — shown as baseline on idle */
    storedGross?: number
    /** Already-stored seconds (net) from DB — shown as baseline on idle */
    storedNet?: number
    /** Called when user stops the timer. Always called, even if paused. */
    onStop: (result: TimerResult) => void
    /** Optional label */
    label?: string
    /** Compact mode for task items */
    compact?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatHuman(totalSeconds: number): string {
    if (totalSeconds < 60) return `${totalSeconds}s`
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

// ── Timer Component ───────────────────────────────────────────────────────────

export default function TopicTimer({
    id,
    type,
    progressId,
    initialStatus = 'idle',
    initialSessions = [],
    initialStartedAt = null,
    storedGross = 0,
    storedNet = 0,
    onStop,
    label,
    compact = false
}: TopicTimerProps) {
    const [state, setState] = useState<TimerState>(initialStatus)
    const [displayGross, setDisplayGross] = useState(0)   // wall-clock ticking
    const [displayNet, setDisplayNet] = useState(0)       // active-only ticking
    const [isSyncing, setIsSyncing] = useState(false)

    const storedGrossRef = useRef<number>(storedGross)
    const storedNetRef = useRef<number>(storedNet)

    // Refs — used for accurate computation without stale closures
    const startedAtRef = useRef<Date | null>(initialStartedAt ? new Date(initialStartedAt) : null)
    const sessionsRef = useRef<TimerSession[]>(initialSessions)
    const segmentStartRef = useRef<Date | null>(null)  // start of current running segment
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const sync = useCallback(async (
        status: TimerState,
        override?: {
            timeSpent?: number
            timeSpentNet?: number
            sessions?: TimerSession[]
        }
    ) => {
        const now = Date.now()
        const sessionGross = startedAtRef.current
            ? Math.floor((now - startedAtRef.current.getTime()) / 1000)
            : 0
        // Net: sum of completed segments + current segment
        const completedNet = sessionsRef.current.reduce((acc, s) => {
            return acc + Math.floor((new Date(s.end).getTime() - new Date(s.start).getTime()) / 1000)
        }, 0)
        const currentSegNet = segmentStartRef.current
            ? Math.floor((now - segmentStartRef.current.getTime()) / 1000)
            : 0

        const totalGross = storedGrossRef.current + sessionGross
        const totalNet = storedNetRef.current + completedNet + currentSegNet

        setIsSyncing(true)
        try {
            await syncTimerState(type, id, progressId, status, {
                timeSpent: override?.timeSpent ?? totalGross,
                timeSpentNet: override?.timeSpentNet ?? totalNet,
                sessions: override?.sessions ?? sessionsRef.current
            })
        } finally {
            setTimeout(() => setIsSyncing(false), 2000)
        }
    }, [id, type, progressId])

    const lastSyncRef = useRef<number>(Date.now())

    // Tick every second while running
    const tick = useCallback(() => {
        const now = Date.now()
        const sessionGross = startedAtRef.current
            ? Math.floor((now - startedAtRef.current.getTime()) / 1000)
            : 0
        // Net: sum of completed segments + current segment
        const completedNet = sessionsRef.current.reduce((acc, s) => {
            return acc + Math.floor((new Date(s.end).getTime() - new Date(s.start).getTime()) / 1000)
        }, 0)
        const currentSegNet = segmentStartRef.current
            ? Math.floor((now - segmentStartRef.current.getTime()) / 1000)
            : 0
        setDisplayGross(storedGrossRef.current + sessionGross)
        setDisplayNet(storedNetRef.current + completedNet + currentSegNet)

        // Heartbeat: sync every 30 seconds
        if (now - lastSyncRef.current > 30000) {
            sync('running')
            lastSyncRef.current = now
        }
    }, [sync])

    const startInterval = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(tick, 1000)
    }, [tick])

    const stopInterval = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => () => stopInterval(), [stopInterval])

    // Resume from server session if needed
    useEffect(() => {
        storedGrossRef.current = storedGross
        storedNetRef.current = storedNet

        if (initialStatus === 'running') {
            // Re-center display before starting interval
            tick()
            segmentStartRef.current = new Date()
            startInterval()
        } else if (initialStatus === 'paused') {
            tick() // Initial calculation for paused state
        }
    }, [initialStatus, startInterval, tick, storedGross, storedNet])

    const handleStart = () => {
        const now = new Date()
        startedAtRef.current = now
        segmentStartRef.current = now
        sessionsRef.current = []
        setState('running')
        startInterval()
        sync('running')
    }

    const handlePause = () => {
        // close current segment
        const now = new Date()
        if (segmentStartRef.current) {
            sessionsRef.current = [
                ...sessionsRef.current,
                { start: segmentStartRef.current.toISOString(), end: now.toISOString() }
            ]
            segmentStartRef.current = null
        }
        setState('paused')
        stopInterval()
        sync('paused')
    }

    const handleResume = () => {
        segmentStartRef.current = new Date()
        setState('running')
        startInterval()
        sync('running')
    }

    const handleStop = () => {
        stopInterval()
        // Close any open segment
        const now = new Date()
        let sessions = [...sessionsRef.current]
        if (segmentStartRef.current) {
            sessions = [...sessions, { start: segmentStartRef.current.toISOString(), end: now.toISOString() }]
            segmentStartRef.current = null
        }

        const sessionGrossSeconds = startedAtRef.current
            ? Math.floor((now.getTime() - startedAtRef.current.getTime()) / 1000)
            : 0
        const sessionNetSeconds = sessions.reduce((acc, s) => {
            return acc + Math.floor((new Date(s.end).getTime() - new Date(s.start).getTime()) / 1000)
        }, 0)

        const totalGrossSeconds = storedGrossRef.current + sessionGrossSeconds
        const totalNetSeconds = storedNetRef.current + sessionNetSeconds

        const result: TimerResult = {
            grossSeconds: sessionGrossSeconds,
            netSeconds: sessionNetSeconds,
            startedAt: startedAtRef.current ?? now,
            sessions,
        }

        sync('idle', {
            timeSpent: totalGrossSeconds,
            timeSpentNet: totalNetSeconds,
            sessions,
        })

        // Reset local state
        sessionsRef.current = []
        startedAtRef.current = null
        setState('idle')
        setDisplayGross(0)
        setDisplayNet(0)

        onStop(result)
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    const isIdle = state === 'idle'
    const isRunning = state === 'running'
    const isPaused = state === 'paused'

    const pauseCount = sessionsRef.current.length
    const pausedSeconds = displayGross - displayNet

    if (compact) {
        // Compact row for Action Items
        return (
            <div className="flex items-center gap-2">
                {/* Time display */}
                <div className={cn(
                    'font-mono text-sm font-bold tabular-nums min-w-[56px] text-center transition-colors',
                    isRunning ? 'text-emerald-400' : isPaused ? 'text-amber-400' : 'text-text-secondary'
                )}>
                    {isIdle
                        ? (storedGross > 0 ? formatTime(storedGross) : '--:--')
                        : formatTime(displayNet)
                    }
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1">
                    {isIdle && (
                        <button
                            onClick={handleStart}
                            title="Start timer"
                            className="w-7 h-7 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 flex items-center justify-center transition-all"
                        >
                            <Play className="w-3 h-3 fill-current" />
                        </button>
                    )}
                    {isRunning && (
                        <>
                            <button onClick={handlePause} title="Pause" className="w-7 h-7 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 flex items-center justify-center transition-all">
                                <Pause className="w-3 h-3 fill-current" />
                            </button>
                            <button onClick={handleStop} title="Stop & save" className="w-7 h-7 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 flex items-center justify-center transition-all">
                                <Square className="w-3 h-3 fill-current" />
                            </button>
                        </>
                    )}
                    {isPaused && (
                        <>
                            <button onClick={handleResume} title="Resume" className="w-7 h-7 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 flex items-center justify-center transition-all">
                                <Play className="w-3 h-3 fill-current" />
                            </button>
                            <button onClick={handleStop} title="Stop & save" className="w-7 h-7 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 flex items-center justify-center transition-all">
                                <Square className="w-3 h-3 fill-current" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        )
    }

    // ── Full-size timer card ───────────────────────────────────────────────────
    return (
        <div className={cn(
            'rounded-2xl border p-4 space-y-3 transition-all',
            isRunning ? 'bg-emerald-500/5 border-emerald-500/20' :
                isPaused ? 'bg-amber-500/5 border-amber-500/20' :
                    'bg-[#0c0c0c] border-white/8'
        )}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center',
                        isRunning ? 'bg-emerald-500' : isPaused ? 'bg-amber-500' : 'bg-white/10'
                    )}>
                        {isSyncing ? (
                            <div className="w-2.5 h-2.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : isRunning ? (
                            <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-white" />
                        ) : isPaused ? (
                            <Pause className="w-2.5 h-2.5 text-white fill-current" />
                        ) : (
                            <Timer className="w-2.5 h-2.5 text-text-secondary" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className={cn(
                            'text-[9px] font-bold uppercase tracking-widest',
                            isRunning ? 'text-emerald-400' : isPaused ? 'text-amber-400' : 'text-text-secondary/50'
                        )}>
                            {isSyncing ? 'Syncing...' : isRunning ? 'Tracking...' : isPaused ? `Paused (${pauseCount} pause${pauseCount !== 1 ? 's' : ''})` : 'Timer'}
                        </span>
                    </div>
                </div>
                {label && <span className="text-[9px] text-text-secondary/40 font-bold truncate max-w-[120px]">{label}</span>}
            </div>

            {/* Time displays */}
            {!isIdle && (
                <div className="grid grid-cols-2 gap-3">
                    <div className={cn('rounded-xl p-3 space-y-0.5', 'bg-emerald-500/10 border border-emerald-500/20')}>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400/70">Active Time</span>
                        <div className="font-mono text-2xl font-black tabular-nums text-emerald-400 leading-none">
                            {formatTime(displayNet)}
                        </div>
                        <span className="text-[8px] text-emerald-400/50">pauses excluded</span>
                    </div>
                    <div className={cn('rounded-xl p-3 space-y-0.5', 'bg-white/5 border border-white/8')}>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-text-secondary/50">Total Elapsed</span>
                        <div className="font-mono text-2xl font-black tabular-nums text-text-secondary leading-none">
                            {formatTime(displayGross)}
                        </div>
                        <span className="text-[8px] text-text-secondary/40">
                            {pausedSeconds > 0 ? `${formatHuman(pausedSeconds)} paused` : 'no pauses yet'}
                        </span>
                    </div>
                </div>
            )}

            {/* Stored time (idle, has prior data) */}
            {isIdle && storedGross > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3 space-y-0.5 bg-emerald-500/5 border border-emerald-500/15">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400/60">Last Active</span>
                        <div className="font-mono text-xl font-black tabular-nums text-emerald-400/70 leading-none">{formatTime(storedNet)}</div>
                        <span className="text-[8px] text-emerald-400/40">net time</span>
                    </div>
                    <div className="rounded-xl p-3 space-y-0.5 bg-white/3 border border-white/6">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-text-secondary/40">Last Total</span>
                        <div className="font-mono text-xl font-black tabular-nums text-text-secondary/50 leading-none">{formatTime(storedGross)}</div>
                        <span className="text-[8px] text-text-secondary/30">with pauses</span>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2">
                {isIdle && (
                    <button
                        onClick={handleStart}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {storedGross > 0 ? 'Start New Session' : 'Start Timer'}
                    </button>
                )}
                {isRunning && (
                    <>
                        <button
                            onClick={handlePause}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            Pause
                        </button>
                        <button
                            onClick={handleStop}
                            className="px-5 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            <Square className="w-3.5 h-3.5 fill-current" />
                        </button>
                    </>
                )}
                {isPaused && (
                    <>
                        <button
                            onClick={handleResume}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Resume
                        </button>
                        <button
                            onClick={handleStop}
                            className="px-5 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            <Square className="w-3.5 h-3.5 fill-current" />
                        </button>
                    </>
                )}
            </div>

            {/* Session segments log */}
            <AnimatePresence>
                {sessionsRef.current.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1 pt-1 border-t border-white/5"
                    >
                        <span className="text-[8px] font-bold uppercase tracking-widest text-text-secondary/30">Work Segments</span>
                        {sessionsRef.current.map((seg, i) => {
                            const dur = Math.floor((new Date(seg.end).getTime() - new Date(seg.start).getTime()) / 1000)
                            return (
                                <div key={i} className="flex items-center justify-between text-[9px] text-text-secondary/40">
                                    <span>Segment {i + 1}</span>
                                    <span className="font-mono font-bold">{formatTime(dur)}</span>
                                </div>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
