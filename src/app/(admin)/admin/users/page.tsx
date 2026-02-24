'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllUsers } from '@/lib/actions/admin'
import {
    Users,
    ChevronRight,
    Search,
    Shield,
    ExternalLink,
    Mail,
    Clock
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AdminUsersPage() {
    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-all-users'],
        queryFn: () => getAllUsers()
    })

    if (isLoading) return <div className="p-20 text-center">Loading Directory...</div>

    return (
        <div className="space-y-12">
            <header className="space-y-2">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.4em]">Section: Personnel Management</p>
                <h1 className="text-5xl font-syne font-black tracking-tighter">OPERATIVE DIRECTORY</h1>
            </header>

            <div className="relative group max-w-md">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-red-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search by Identity or Email..."
                    className="w-full bg-[#0c0c0c] border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-red-500/30 transition-all font-syne text-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {users?.map((user: any, i: number) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={user.id}
                        className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:border-red-500/20 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl font-black text-red-500">
                                {user.fullName?.[0] || user.email[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-syne font-bold text-lg truncate">{user.fullName || 'Unknown Operative'}</h3>
                                <div className="flex items-center gap-2 text-text-secondary text-[10px] font-bold uppercase tracking-widest">
                                    <Mail className="w-3 h-3" /> {user.email}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-[8px] font-black text-text-secondary uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Clock className="w-2 h-2" /> Registered
                                </p>
                                <p className="text-xs font-bold font-mono">
                                    {new Date(user.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-[8px] font-black text-text-secondary uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Shield className="w-2 h-2" /> Auth Level
                                </p>
                                <p className="text-xs font-bold text-success uppercase tracking-widest">General</p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Link
                                href={`/admin/users/${user.id}`}
                                className="w-full py-4 rounded-xl bg-white/5 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                            >
                                Inspect Profile <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
