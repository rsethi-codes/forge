'use client'

import React, { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, X } from 'lucide-react'

export interface Milestone {
    id: string
    title: string
    description: string
    icon: string
}

export default function Celebration() {
    const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null)

    useEffect(() => {
        // Check for newly unlocked milestones every 30s or on page load
        const check = async () => {
            try {
                const res = await fetch('/api/milestones/new')
                if (res.ok) {
                    const milestones = await res.json()
                    if (milestones.length > 0) {
                        triggerCelebration(milestones[0])
                    }
                }
            } catch (e) {
                console.error("Failed to check milestones", e)
            }
        }

        check()
        const interval = setInterval(check, 30000)
        return () => clearInterval(interval)
    }, [])

    const triggerCelebration = (m: Milestone) => {
        setActiveMilestone(m)

        // Confetti burst
        const duration = 5 * 1000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
        }, 250)
    }

    return (
        <AnimatePresence>
            {activeMilestone && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-none">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setActiveMilestone(null)} />

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        className="relative bg-surface border-2 border-primary/30 p-10 rounded-[3rem] max-w-lg w-full text-center space-y-8 shadow-[0_0_100px_rgba(255,49,49,0.2)] pointer-events-auto"
                    >
                        <button
                            onClick={() => setActiveMilestone(null)}
                            className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-text-secondary" />
                        </button>

                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 text-5xl">
                            {activeMilestone.icon || '🎖️'}
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-primary">Milestone Unlocked</h2>
                            <h3 className="text-4xl font-syne font-bold tracking-tighter">{activeMilestone.title}</h3>
                        </div>

                        <p className="text-text-secondary text-lg font-lora italic">
                            &quot;{activeMilestone.description}&quot;
                        </p>

                        <div className="pt-4">
                            <button
                                onClick={() => setActiveMilestone(null)}
                                className="w-full bg-primary hover:bg-red-600 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-xs"
                            >
                                The Grind Continues
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
