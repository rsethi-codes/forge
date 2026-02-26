'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Zap,
    Shield,
    Sparkles,
    Paintbrush,
    Lock,
    Check,
    ShoppingCart,
    Loader2,
    Star,
    Coins,
    Tv,
    Pizza,
    MapPin,
    Coffee,
    Calendar,
    Clock,
    Medal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import { purchaseReward, getRewardInventory, useReward as redeemReward } from '@/lib/actions/rewards'
import { format } from 'date-fns'

interface Perk {
    id: string
    name: string
    description: string
    cost: number
    icon: any
    color: string
    type: 'daily' | 'weekly' | 'consistency'
}

const perks: Perk[] = [
    {
        id: 'snooker_session',
        name: 'The Rack Attack',
        description: '1 Hour of intense Pool or Snooker. Maximum focus reset for the day.',
        cost: 50,
        icon: Medal,
        color: '#00d68f',
        type: 'daily'
    },
    {
        id: 'series_episode',
        name: 'The Cinematic Protocol',
        description: 'Watch one episode of your favorite series without guilt.',
        cost: 30,
        icon: Tv,
        color: '#3b82f6',
        type: 'daily'
    },
    {
        id: 'cheat_meal',
        name: 'The Cheat Vault',
        description: 'High-calorie strategic refueling. One cheat meal of your choice.',
        cost: 200,
        icon: Pizza,
        color: '#ff3131',
        type: 'weekly'
    },
    {
        id: 'urban_explorer',
        name: 'Urban Explorer',
        description: 'Roam around the city. New inputs for new neural patterns.',
        cost: 150,
        icon: MapPin,
        color: '#f0b429',
        type: 'weekly'
    },
    {
        id: 'day_off',
        name: 'Mandatory Blackout',
        description: 'A full 24-hour cycle of disconnection. The ultimate reward for consistency.',
        cost: 750,
        icon: Calendar,
        color: '#a855f7',
        type: 'consistency'
    },
    {
        id: 'extended_break',
        name: 'Hyper-Focus Coffee',
        description: 'Go to a premium cafe. Change of environment for 2 hours.',
        cost: 40,
        icon: Coffee,
        color: '#94a3b8',
        type: 'daily'
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

    const { data: inventory = [] } = useQuery({
        queryKey: ['reward-inventory'],
        queryFn: () => getRewardInventory(),
    })

    const coinsBalance = stats?.coinsBalance ?? 0

    const mutation = useMutation({
        mutationFn: (perk: Perk) => purchaseReward(perk.id, perk.name, perk.type, perk.cost),
        onSuccess: (data, variables) => {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: [variables.color, '#ffffff']
            })
            toast.success(`${variables.name} Acquired and Primed.`)
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] })
            queryClient.invalidateQueries({ queryKey: ['reward-inventory'] })
            setPurchasing(null)
        },
        onError: (err: any) => {
            toast.error(err.message || "Encryption failed. Armory access denied.")
            setPurchasing(null)
        }
    })

    const useRewardMutation = useMutation({
        mutationFn: (id: string) => redeemReward(id),
        onSuccess: () => {
            toast.success("Reward Redeemed. Enjoy your leisure time.")
            queryClient.invalidateQueries({ queryKey: ['reward-inventory'] })
        }
    })

    const handlePurchase = async (perk: Perk) => {
        if (coinsBalance < perk.cost) {
            toast.error("Insufficient Coins. Continue the build to earn more.")
            return
        }
        setPurchasing(perk.id)
        mutation.mutate(perk)
    }

    if (loadingStats) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">Accessing Armory Vault...</p>
            </div>
        )
    }

    const categories = [
        { id: 'daily', title: 'Daily Wins', subtitle: 'Micro-rewards for consistent execution' },
        { id: 'weekly', title: 'Strategic Resets', subtitle: 'Earned through weekly discipline' },
        { id: 'consistency', title: 'Epic Achievements', subtitle: 'The rewards of long-term consistency' }
    ]

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-16">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-subtle">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-syne font-black tracking-tighter uppercase whitespace-nowrap">Rewards Armory</h1>
                    <p className="text-text-secondary text-lg">Earn your leisure. Tactical breaks for peak neural performance.</p>
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

            {categories.map((cat) => (
                <section key={cat.id} className="space-y-8">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black uppercase tracking-widest text-text-primary">{cat.title}</h2>
                        <span className="text-xs text-text-secondary font-bold uppercase tracking-widest opacity-40">{cat.subtitle}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {perks.filter(p => p.type === cat.id).map((perk, idx) => {
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
                                                    Unlock Reward
                                                </>
                                            )}
                                        </button>
                                    </div>

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
                </section>
            ))}

            {/* Inventory Section */}
            <section className="space-y-8 pt-10">
                <div className="flex flex-col border-t border-white/5 pt-10">
                    <h2 className="text-xl font-black uppercase tracking-widest text-text-primary">Acquired Assets</h2>
                    <span className="text-xs text-text-secondary font-bold uppercase tracking-widest opacity-40">Tactical rewards ready for deployment</span>
                </div>

                {inventory.length === 0 ? (
                    <div className="py-20 text-center bg-surface-elevated/5 rounded-[3rem] border border-dashed border-white/10">
                        <Lock className="w-10 h-10 text-white/10 mx-auto mb-4" />
                        <p className="text-text-secondary text-sm font-bold uppercase tracking-widest">Inventory Empty</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {inventory.map((item: any) => (
                            <div key={item.id} className={cn(
                                "flex items-center justify-between p-6 rounded-[1.5rem] border transition-all",
                                item.isUsed ? "bg-black/20 border-white/5 opacity-40" : "bg-[#0c0c0c] border-white/10"
                            )}>
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center",
                                        item.isUsed ? "bg-white/5" : "bg-primary/20 text-primary"
                                    )}>
                                        {item.rewardType === 'daily' ? <Clock className="w-6 h-6" /> : <Medal className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm uppercase">{item.rewardName}</h4>
                                        <p className="text-[10px] text-text-secondary font-medium">Acquired {format(new Date(item.purchasedAt), 'MMM dd, HH:mm')}</p>
                                    </div>
                                </div>
                                {!item.isUsed && (
                                    <button
                                        onClick={() => useRewardMutation.mutate(item.id)}
                                        className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Redeem Now
                                    </button>
                                )}
                                {item.isUsed && (
                                    <span className="text-[10px] font-black uppercase text-success">Deployed</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="bg-primary/5 border-2 border-primary/20 rounded-[3rem] p-10 relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <div className="w-24 h-24 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 flex-shrink-0 animate-pulse">
                        <Zap className="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-syne font-black uppercase tracking-tighter leading-none">The Leisure Discipline</h2>
                        <p className="text-text-secondary font-medium italic max-w-2xl leading-relaxed">
                            &quot;Rewards are not indulgences; they are strategic resets. By earning your leisure, you eliminate the guilt of disconnection and return to the forge with higher cognitive clarity.&quot;
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
