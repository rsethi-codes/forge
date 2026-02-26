'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    Search,
    Home,
    Map,
    BarChart2,
    Zap,
    MessageSquare,
    Shield,
    Settings,
    PenTool,
    Wrench,
    LogOut,
    Command as CommandIcon,
    History,
    Quote
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandItem {
    id: string
    title: string
    subtitle?: string
    icon: React.ElementType
    href?: string
    action?: () => void
    shortcut?: string[]
}

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    const items: CommandItem[] = [
        { id: 'dashboard', title: 'Command Center', subtitle: 'View dashboard and live stats', icon: Home, href: '/dashboard', shortcut: ['⌘', 'D'] },
        { id: 'tracker', title: 'Mission Roadmap', subtitle: 'Strategic timeline and day progress', icon: Map, href: '/tracker', shortcut: ['⌘', 'T'] },
        { id: 'analytics', title: 'Strategic Intel', subtitle: 'Detailed performance analytics', icon: BarChart2, href: '/analytics', shortcut: ['⌘', 'A'] },
        { id: 'forge-chat', title: 'Forge Chat', subtitle: 'Full-screen mentor mode', icon: MessageSquare, href: '/forge-chat', shortcut: ['⌘', 'I'] },
        { id: 'rewards', title: 'Rewards Armory', subtitle: 'Redeem coins for perks', icon: Zap, href: '/rewards', shortcut: ['⌘', 'R'] },
        { id: 'milestones', title: 'Honor Milestones', subtitle: 'Achievements and trophies', icon: Shield, href: '/milestones', shortcut: ['⌘', 'M'] },
        { id: 'reflections', title: 'Neural Archive', subtitle: 'Historical daily reflections', icon: Quote, href: '/reflections', shortcut: ['⌘', 'J'] },
        { id: 'blog', title: 'War Logs', subtitle: 'Manage your blog posts', icon: PenTool, href: '/blog/manage', shortcut: ['⌘', 'B'] },
        { id: 'setup', title: 'Forge Armor', subtitle: 'Manage roadmaps and uploads', icon: Wrench, href: '/setup', shortcut: ['⌘', 'U'] },
        { id: 'settings', title: 'System Settings', subtitle: 'Profile and preferences', icon: Settings, href: '/settings', shortcut: ['⌘', ','] },
        { id: 'logout', title: 'Sign Out', icon: LogOut, action: () => { window.location.href = '/login' } },
    ]

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(query.toLowerCase())
    )

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(prev => !prev)
            }
            if (e.key === 'Escape') setIsOpen(false)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0)
            setQuery('')
            setTimeout(() => inputRef.current?.focus(), 10)
        }
    }, [isOpen])

    const handleSelect = (item: CommandItem) => {
        if (item.href) router.push(item.href)
        if (item.action) item.action()
        setIsOpen(false)
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => (prev + 1) % filteredItems.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length)
        } else if (e.key === 'Enter') {
            const item = filteredItems[selectedIndex]
            if (item) handleSelect(item)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="fixed left-1/2 top-[15%] -translate-x-1/2 w-full max-w-xl bg-[#111111] border border-white/10 rounded-3xl shadow-2xl z-[101] overflow-hidden"
                    >
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
                            <Search className="w-5 h-5 text-text-secondary" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder="Type a command or search..."
                                className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm placeholder:text-text-secondary/50"
                            />
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
                                <span className="text-[10px] font-bold text-text-secondary">ESC</span>
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-none">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item, idx) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        className={cn(
                                            "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-left",
                                            idx === selectedIndex ? "bg-primary/10 text-primary" : "text-text-secondary hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                            idx === selectedIndex ? "bg-primary/20 text-primary" : "bg-white/5 text-text-secondary"
                                        )}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="font-bold text-sm block">{item.title}</span>
                                                {item.shortcut && (
                                                    <div className="flex gap-1">
                                                        {item.shortcut.map(s => (
                                                            <span key={s} className="text-[8px] font-bold px-1.5 py-0.5 bg-white/5 border border-white/10 rounded uppercase leading-none min-w-[1.2rem] text-center">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {item.subtitle && <span className="text-[10px] text-text-secondary block truncate mt-0.5 font-medium">{item.subtitle}</span>}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="py-12 text-center text-text-secondary space-y-2">
                                    <History className="w-8 h-8 mx-auto opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No matching commands</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-[#0c0c0c] px-6 py-3 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold text-text-secondary bg-white/5 border border-white/10 px-1 rounded uppercase">↑↓</span>
                                    <span className="text-[9px] font-bold text-text-secondary uppercase">Navigate</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold text-text-secondary bg-white/5 border border-white/10 px-1 rounded uppercase">Enter</span>
                                    <span className="text-[9px] font-bold text-text-secondary uppercase">Select</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <CommandIcon className="w-3.5 h-3.5 text-text-secondary" />
                                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Global Search Active</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
