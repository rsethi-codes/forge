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
    Target
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Roadmap', href: '/tracker', icon: Map },
    // { name: 'JANE', href: '/jane', icon: Target },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    { name: 'Milestones', href: '/milestones', icon: Shield },
    { name: 'Blog', href: '/blog/manage', icon: PenTool },
    { name: 'Setup', href: '/setup', icon: Shield }, // Added for easy access
    { name: 'Share', href: '/share', icon: Share2 },
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
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-primary")} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 space-y-4">
                    {/* Sidebar Meta */}
                    <div className="bg-surface-elevated rounded-2xl p-4 border border-border-subtle">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-text-secondary uppercase tracking-wider">Progress</span>
                            <span className="text-xs font-bold text-primary">Day {displayStats.day}/60</span>
                        </div>
                        <div className="w-full bg-border-subtle rounded-full h-1.5 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(displayStats.day / 60) * 100}%` }}
                                className="bg-primary h-full"
                            />
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-lg">🔥</span>
                            <span className="text-sm font-bold text-text-primary">{displayStats.streak} day streak</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-primary transition-colors rounded-xl font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>

                    <Link
                        href="/settings"
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                            pathname === '/settings' ? "bg-surface-elevated text-text-primary" : "text-text-secondary hover:text-text-primary"
                        )}
                    >
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </Link>
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
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="absolute right-0 top-0 bottom-0 w-80 bg-[#111111] p-6 shadow-2xl"
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
                                <div className="pt-8 border-t border-border-subtle space-y-4">
                                    <Link
                                        href="/settings"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-4 py-4 px-4 text-text-secondary"
                                    >
                                        <Settings className="w-6 h-6" />
                                        <span className="text-lg font-medium">Settings</span>
                                    </Link>
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
