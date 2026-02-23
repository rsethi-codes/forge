'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Shield, Sparkles, Paintbrush, Lock, Check, ShoppingCart, Loader2, Star, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'

interface Perk {
    id: string
    name: string
    description: string
    cost: number
    icon: any
    color: string
}

const perks: Perk[] = [
    {
        id: 'distraction_shield',
        name: 'Focus Shield',
        description: 'Passive protection against focus breaks. Higher resilience during deep work sessions.',
        cost: 150,
        icon: Shield,
        color: '#ff3131'
    },
    {
        id: 'ai_priority',
        name: 'Consultant Protocol',
        description: 'Priority Forge Mentor response times and more in-depth architectural reasoning.',
        cost: 300,
        icon: Sparkles,
        color: '#f0b429'
    },
    {
        id: 'custom_theme',
        name: 'The Vulcan Palette',
        description: 'Unlock a high-fidelity amber theme for your entire Command Center.',
        cost: 600,
        icon: Paintbrush,
        color: '#3b82f6'
    },
    {
        id: 'neural_burst',
        name: 'Neural Synchronizer',
        description: 'Instantly generate a deep-view audit of your most complex roadmap topics.',
        cost: 1000,
        icon: Zap,
        color: '#00d68f'
    }
]

export default function RewardsArmory() {
    const queryClient = useQueryClient()
    const [purchasing, setPurchasing] = useState<string | null>(null)

    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['dashboard-data'],
        queryFn: async () => {
            const response = await fetch('/api/stats/dashboard')
            if (!response.ok) throw new Error('Failed to fetch balance')
            return response.json()
        },
    })

    const coinsBalance = stats?.coinsBalance ?? 0

    const handlePurchase = async (perk: Perk) => {
        if (coinsBalance < perk.cost) {
            toast.error("Insufficient Coins. Continue the build to earn more.")
            return
        }

        setPurchasing(perk.id)

        // Simulate purchase (Since we don't have an inventory DB yet, we just show the effect)
        // In a real app, this would be a server action deducting coins and adding to inventory
        await new Promise(r => setTimeout(r, 1500))

        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: [perk.color, '#ffffff']
        })

        toast.success(`${perk.name} Acquired and Primed.`)
        setPurchasing(null)
    }

    if (loadingStats) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">Accessing Armory Vault...</p>
            </div>
        )
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-subtle">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-syne font-bold tracking-tighter uppercase whitespace-nowrap">Rewards Armory</h1>
                    <p className="text-text-secondary text-lg">Exchange Forge Coins for tactical upgrades and cosmetic perks.</p>
                </motion.div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#0c0c0c] border-2 border-primary/20 p-6 rounded-[2.5rem] flex items-center gap-6 shadow-2xl shadow-primary/10"
                >
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                        <Coins className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">Available Credits</p>
                        <p className="text-4xl font-syne font-black text-primary leading-none tabular-nums">{coinsBalance}</p>
                    </div>
                </motion.div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {perks.map((perk, idx) => {
                    const canAfford = coinsBalance >= perk.cost
                    const isPurchasing = purchasing === perk.id

                    return (
                        <motion.div
                            key={perk.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                                "group relative bg-surface border-2 rounded-[2.5rem] p-8 transition-all flex flex-col justify-between overflow-hidden",
                                canAfford ? "border-white/5 hover:border-primary/40" : "border-white/5 opacity-60 grayscale-[0.8]"
                            )}
                        >
                            <div className="space-y-6 relative z-10">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500"
                                    style={{ backgroundColor: `${perk.color}15`, color: perk.color, border: `1px solid ${perk.color}30` }}>
                                    <perk.icon className="w-8 h-8" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-syne font-bold uppercase tracking-tighter">{perk.name}</h3>
                                    <p className="text-xs text-text-secondary leading-relaxed font-medium">
                                        {perk.description}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 space-y-4 relative z-10">
                                <div className="flex items-center gap-2">
                                    <Star className="w-3 h-3 text-primary fill-current" />
                                    <span className="text-sm font-black font-syne">{perk.cost} Credits</span>
                                </div>

                                <button
                                    onClick={() => handlePurchase(perk)}
                                    disabled={!canAfford || !!purchasing}
                                    className={cn(
                                        "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                        canAfford
                                            ? "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95"
                                            : "bg-surface-elevated text-text-secondary cursor-not-allowed"
                                    )}
                                >
                                    {isPurchasing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <ShoppingCart className="w-3.5 h-3.5" />
                                            Acquire Perk
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Background Elements */}
                            <div
                                className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[80px] opacity-10 pointer-events-none transition-all group-hover:opacity-20"
                                style={{ backgroundColor: perk.color }}
                            />
                            {!canAfford && (
                                <div className="absolute top-6 right-6">
                                    <Lock className="w-4 h-4 text-text-secondary opacity-40" />
                                </div>
                            )}
                        </motion.div>
                    )
                })}
            </div>

            <section className="bg-primary/5 border-2 border-primary/20 rounded-[3rem] p-10 relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <div className="w-24 h-24 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 flex-shrink-0 animate-bounce">
                        <Zap className="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-syne font-black uppercase tracking-tighter leading-none">The Burn Rate</h2>
                        <p className="text-text-secondary font-medium italic max-w-2xl leading-relaxed">
                            "Every coin is a testament to your discipline. Spend them wisely to fortify your cognitive environment. The armory updates as you achieve higher tiers of focus."
                        </p>
                    </div>
                </div>

                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none overflow-hidden">
                    <div className="grid grid-cols-4 gap-4 rotate-12 -translate-y-10">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="aspect-square bg-primary rounded-lg" />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
