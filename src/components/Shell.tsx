'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home,
    Map,
    BarChart2,
    PenTool,
    Share2,
    Settings,
    LogOut,
    Shield,
    Menu,
    X,
    Wrench,
    Zap,
    Terminal,
    Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
    { name: 'Command Center', href: '/dashboard', icon: Home, badge: 'Active' },
    { name: 'Mission Roadmap', href: '/tracker', icon: Map },
    { name: 'Strategic Intel', href: '/analytics', icon: BarChart2 },
    { name: 'Rewards Armory', href: '/rewards', icon: Zap },
    { name: 'Honor Milestones', href: '/milestones', icon: Shield },
    { name: 'War Logs', href: '/blog/manage', icon: PenTool },
    { name: 'Setup', href: '/setup', icon: Wrench },
    { name: 'Settings', href: '/settings', icon: Settings },
]

import { useQuery, useQueryClient } from '@tanstack/react-query'

export default function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
    const supabase = createClient()
    const queryClient = useQueryClient()

    // 1. Proactive Global Prefetching (Background Warmup)
    React.useEffect(() => {
        const prefetchCoreData = async () => {
            // Dashboard
            queryClient.prefetchQuery({
                queryKey: ['dashboard-data'],
                queryFn: () => fetch('/api/stats/dashboard').then(res => res.json()),
                staleTime: 60 * 1000
            })
            // Analytics
            queryClient.prefetchQuery({
                queryKey: ['analytics-data'],
                queryFn: () => fetch('/api/stats/analytics').then(res => res.json()),
                staleTime: 60 * 1000
            })
            // Milestones
            queryClient.prefetchQuery({
                queryKey: ['milestones-list'],
                queryFn: () => fetch('/api/milestones/list').then(res => res.json()),
                staleTime: 5 * 60 * 1000
            })
            // Roadmap Essentials
            queryClient.prefetchQuery({
                queryKey: ['roadmaps-list'],
                queryFn: () => fetch('/api/roadmap/list').then(res => res.json())
            })
            queryClient.prefetchQuery({
                queryKey: ['tracker', 1],
                queryFn: () => fetch('/api/roadmap/tracker?month=1').then(res => res.json()),
                staleTime: 5 * 60 * 1000
            })
        }

        // Delay slightly to prioritize initial shell render
        const timer = setTimeout(prefetchCoreData, 1000)
        return () => clearTimeout(timer)
    }, [queryClient])

    const { data: stats } = useQuery({
        queryKey: ['sidebar-stats'],
        queryFn: async () => {
            const response = await fetch('/api/stats/sidebar')
            if (response.status === 401) {
                window.location.href = '/login'
                return { day: 1, streak: 0 }
            }
            if (!response.ok) throw new Error('Failed to fetch stats')
            return response.json()
        },
        staleTime: 5 * 60 * 1000,
    })

    const displayStats = stats || { day: 1, streak: 0 }

    // Hover-intent prefetching for specific tabs
    const prefetchTab = (href: string) => {
        if (href === '/dashboard') queryClient.prefetchQuery({ queryKey: ['dashboard-data'], queryFn: () => fetch('/api/stats/dashboard').then(res => res.json()) })
        if (href === '/analytics') queryClient.prefetchQuery({ queryKey: ['analytics-data'], queryFn: () => fetch('/api/stats/analytics').then(res => res.json()) })
        if (href === '/milestones') queryClient.prefetchQuery({ queryKey: ['milestones-list'], queryFn: () => fetch('/api/milestones/list').then(res => res.json()) })
        if (href === '/tracker') queryClient.prefetchQuery({ queryKey: ['tracker', 1], queryFn: () => fetch('/api/roadmap/tracker?month=1').then(res => res.json()) })
    }

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut()
        } catch (e) {
            console.error('Supabase sign-out error:', e)
        }
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
        } catch { }
        window.location.href = '/login'
    }

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-text-primary">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex w-64 flex-col border-r border-border-subtle bg-[#111111] sticky top-0 h-screen">
                <div className="p-6 flex items-center gap-2">
                    <Shield className="w-8 h-8 text-primary" />
                    <span className="text-2xl font-syne font-bold tracking-tighter">FORGE</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onMouseEnter={() => prefetchTab(item.href)}
                                className={cn(
                                    "flex items-center justify-between px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary/10 text-primary border border-primary/20"
                                        : "text-text-secondary hover:bg-white/5 hover:text-text-primary border border-transparent"
                                )}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-primary" : "group-hover:text-primary")} />
                                    <span className="font-bold text-xs uppercase tracking-widest">{item.name}</span>
                                </div>

                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pulse"
                                        className="absolute inset-0 bg-primary/5 z-0"
                                        initial={false}
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    />
                                )}

                                {(item as any).badge && (
                                    <span className="text-[8px] font-black bg-primary text-white px-1.5 py-0.5 rounded leading-none relative z-10">
                                        {(item as any).badge}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 space-y-4">
                    {/* Sidebar Meta */}
                    <div className="bg-[#0c0c0c] rounded-2xl p-5 border border-white/5 space-y-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                <span>Day Progress</span>
                                <span className="text-primary">{displayStats.day} / 60</span>
                            </div>
                            <div className="flex gap-1 h-1.5">
                                {[...Array(10)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex-1 rounded-full transition-colors",
                                            (displayStats.day / 60) * 10 >= i + 1
                                                ? "bg-primary shadow-[0_0_5px_#ff3131]"
                                                : "bg-white/5"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                                    <Zap className="w-5 h-5 fill-current" />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="block text-[8px] font-black text-text-secondary uppercase tracking-widest leading-none">Velocity</span>
                                    <span className="block text-sm font-black text-text-primary leading-none">{displayStats.streak} Days</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HUD Launcher */}
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('forge-hud-open'))}
                        className="group relative w-full bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-2xl p-4 transition-all overflow-hidden"
                    >
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Terminal className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <span className="block text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">Engage Intelligence</span>
                                <span className="block text-[10px] font-bold text-text-secondary group-hover:text-primary transition-colors">Forge HUD System</span>
                            </div>
                        </div>
                        <Sparkles className="absolute -top-1 -right-1 w-12 h-12 text-primary opacity-10 group-hover:opacity-20 transition-opacity" />
                    </button>

                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-primary transition-colors rounded-xl font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Nav Top Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#111111] border-b border-border-subtle flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" />
                    <span className="text-xl font-syne font-bold tracking-tighter">FORGE</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu className="w-6 h-6 text-text-primary" />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="absolute right-0 top-0 bottom-0 w-80 bg-[#111111] p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-12">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-8 h-8 text-primary" />
                                    <span className="text-2xl font-syne font-bold tracking-tighter">FORGE</span>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)}>
                                    <X className="w-6 h-6 text-text-primary" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-4 py-4 px-4 rounded-xl",
                                            (item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href))
                                                ? "bg-primary text-white"
                                                : "text-text-secondary"
                                        )}
                                    >
                                        <item.icon className="w-6 h-6" />
                                        <span className="text-lg font-medium">{item.name}</span>
                                    </Link>
                                ))}
                                <div className="pt-8 border-t border-border-subtle">
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-4 py-4 px-4 text-primary w-full text-left"
                                    >
                                        <LogOut className="w-6 h-6" />
                                        <span className="text-lg font-medium">Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 w-full pt-16 md:pt-0 overflow-x-hidden">
                {children}
            </main>
        </div>
    )
}
