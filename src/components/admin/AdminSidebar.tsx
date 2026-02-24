'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    ShieldAlert,
    Settings,
    LogOut,
    Database,
    Zap,
    Activity,
    Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const navItems = [
    { name: 'Command Center', href: '/admin', icon: LayoutDashboard },
    { name: 'User Ops', href: '/admin/users', icon: Users },
    { name: 'Vault Security', href: '/admin/security', icon: Lock },
    { name: 'System Logs', href: '/admin/logs', icon: Activity },
    { name: 'Database Trace', href: '/admin/db', icon: Database },
]

export default function AdminSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-72 bg-[#050505] border-r border-red-500/20 h-screen sticky top-0 flex flex-col p-6 z-50">
            <div className="flex items-center gap-3 mb-12 px-2">
                <div className="w-10 h-10 bg-red-500 flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                    <ShieldAlert className="text-white w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-white font-syne font-black tracking-tighter text-lg leading-none">OVERSEER</h1>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Admin Authorization</span>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group relative overflow-hidden",
                                isActive
                                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                    : "text-text-secondary hover:text-white hover:bg-white/5 border border-transparent"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="admin-nav-glow"
                                    className="absolute left-0 top-0 w-1 h-full bg-red-500 shadow-[0_0_15px_#ef4444]"
                                />
                            )}
                            <item.icon className={cn("w-5 h-5", isActive ? "text-red-500" : "group-hover:text-red-400")} />
                            <span className="font-syne font-bold text-sm tracking-tight">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-auto space-y-4">
                <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3 h-3 text-red-500" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">System Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-text-secondary uppercase">All Nodes Operational</span>
                    </div>
                </div>

                <Link
                    href="/"
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-text-secondary hover:text-white transition-all group border border-transparent hover:border-white/10"
                >
                    <LogOut className="w-5 h-5 group-hover:text-primary" />
                    <span className="font-syne font-bold text-sm">Exit Overseer</span>
                </Link>
            </div>
        </aside>
    )
}
