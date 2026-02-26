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
    Quote,
    MessageSquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

const navItems = [
    { name: 'Command Center', href: '/dashboard', icon: Home, badge: 'Active' },
    { name: 'Mission Roadmap', href: '/tracker', icon: Map },
    { name: 'Strategic Intel', href: '/analytics', icon: BarChart2 },
    { name: 'Forge Chat', href: '/forge-chat', icon: MessageSquare },
    { name: 'Rewards Armory', href: '/rewards', icon: Zap },
    { name: 'Honor Milestones', href: '/milestones', icon: Shield },
    { name: 'Neural Archive', href: '/reflections', icon: Quote },
    { name: 'War Logs', href: '/blog/manage', icon: PenTool },
    { name: 'Forge Nexus', href: '/share', icon: Share2 },
    { name: 'Setup', href: '/setup', icon: Wrench },
    { name: 'Settings', href: '/settings', icon: Settings },
]

import { useQuery, useQueryClient } from '@tanstack/react-query'
import CommandPalette from './CommandPalette'

export default function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
    const supabase = createClient()
    const queryClient = useQueryClient()

    // 1. Proactive Global Prefetching (Background Warmup)
    React.useEffect(() => {
        const prefetchCoreData = async () => {
            const today = format(new Date(), 'yyyy-MM-dd')
            // Dashboard
            queryClient.prefetchQuery({
                queryKey: ['dashboard-data'],
                queryFn: () => fetch(`/api/stats/dashboard?date=${today}`).then(res => res.json()),
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
                queryFn: () => fetch(`/api/roadmap/tracker?month=1&date=${today}`).then(res => res.json()),
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
        if (href === '/dashboard') {
            const today = format(new Date(), 'yyyy-MM-dd')
            queryClient.prefetchQuery({ queryKey: ['dashboard-data'], queryFn: () => fetch(`/api/stats/dashboard?date=${today}`).then(res => res.json()) })
        }
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
            <aside className="hidden md:flex w-64 flex-col border-r border-border-subtle bg-[#111111] h-screen shrink-0">
                <div className="p-6 flex items-center gap-2 shrink-0">
                    <Shield className="w-8 h-8 text-primary" />
                    <span className="text-2xl font-syne font-bold tracking-tighter">FORGE</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
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
                                    "flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all relative overflow-hidden group/nav",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "text-text-secondary hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <div className="flex items-center gap-3 relative z-10 transition-transform group-hover/nav:translate-x-1">
                                    <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-text-secondary group-hover/nav:text-primary")} />
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

                <div className="p-4 space-y-4 flex-shrink-0 border-t border-white/5">
                    {/* Sidebar Meta */}
                    <div className="bg-[#0c0c0c] rounded-2xl p-5 border border-white/5 space-y-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                <span>Day Progress</span>
                                <span className="text-primary">{displayStats.day} / {displayStats.totalDays || 60}</span>
                            </div>
                            <div className="flex gap-1 h-1.5">
                                {[...Array(10)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex-1 rounded-full transition-colors",
                                            (displayStats.day / (displayStats.totalDays || 60)) * 10 >= i + 1
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

                        {displayStats.vanityHandle && (
                            <Link
                                href={`/p/${displayStats.vanityHandle}`}
                                target="_blank"
                                className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-text-secondary hover:bg-white/10 hover:text-white transition-all group"
                            >
                                <Share2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                Public Identity
                            </Link>
                        )}
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-primary transition-colors rounded-xl font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>

                    {/* Command Palette discoverability hint */}
                    <div className="flex items-center justify-center gap-2 text-text-secondary/40 pb-1">
                        <kbd className="text-[8px] font-black bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">Ctrl</kbd>
                        <span className="text-[8px]">+</span>
                        <kbd className="text-[8px] font-black bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">K</kbd>
                        <span className="text-[8px] font-bold uppercase tracking-widest">Command Palette</span>
                    </div>
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

                            <motion.div
                                variants={{
                                    hidden: { opacity: 0 },
                                    show: {
                                        opacity: 1,
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.2
                                        }
                                    }
                                }}
                                initial="hidden"
                                animate="show"
                                className="space-y-4"
                            >
                                {navItems.map((item) => (
                                    <motion.div
                                        key={item.href}
                                        variants={{
                                            hidden: { opacity: 0, x: 20 },
                                            show: { opacity: 1, x: 0 }
                                        }}
                                    >
                                        <Link
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
                                    </motion.div>
                                ))}
                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, y: 10 },
                                        show: { opacity: 1, y: 0 }
                                    }}
                                    className="pt-8 border-t border-border-subtle"
                                >
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-4 py-4 px-4 text-primary w-full text-left"
                                    >
                                        <LogOut className="w-6 h-6" />
                                        <span className="text-lg font-medium">Sign Out</span>
                                    </button>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 w-full h-screen overflow-y-auto pt-16 md:pt-0 overflow-x-hidden relative">
                {children}
            </main>
            <CommandPalette />
        </div>
    )
}
