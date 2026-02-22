'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const dynamic = 'force-dynamic'
import { Plus, Search, Filter, MoreVertical, Eye, Edit2, Trash2, Globe, Lock, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { getBlogPostsForManagement, deleteBlogPost } from '@/lib/actions/blog'

export default function BlogManagementPage() {
    const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all')
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadPosts()
    }, [])

    const loadPosts = async () => {
        setLoading(true)
        const data = await getBlogPostsForManagement()
        setPosts(data)
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this post?')) {
            await deleteBlogPost(id)
            loadPosts()
        }
    }

    const filteredPosts = posts.filter(post => {
        const matchesType = filter === 'all' || post.visibility === filter
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesType && matchesSearch
    })

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-syne font-bold tracking-tighter">Blog Lab</h1>
                    <p className="text-text-secondary">Manage your internal reflections and public legacy.</p>
                </div>
                <Link
                    href="/blog/manage/new"
                    className="bg-primary hover:bg-red-600 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20 w-fit"
                >
                    <Plus className="w-5 h-5" />
                    Compose Post
                </Link>
            </header>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface border border-border-subtle p-4 rounded-2xl">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-border-subtle rounded-xl py-2 px-10 text-sm focus:border-primary outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Filter className="w-4 h-4 text-text-secondary mr-2" />
                    {(['all', 'public', 'private'] as const).map((opt) => (
                        <button
                            key={opt}
                            onClick={() => setFilter(opt)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                                filter === opt ? "bg-primary text-white" : "bg-[#0a0a0a] border border-border-subtle text-text-secondary"
                            )}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">Accessing Archives...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredPosts.map((post) => (
                            <motion.div
                                key={post.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="group bg-surface border border-border-subtle p-6 rounded-3xl hover:border-primary/30 transition-all"
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            {post.visibility === 'public' ? (
                                                <Globe className="w-3 h-3 text-success" />
                                            ) : (
                                                <Lock className="w-3 h-3 text-secondary" />
                                            )}
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest",
                                                post.visibility === 'public' ? "text-success" : "text-secondary"
                                            )}>
                                                {post.visibility}
                                            </span>
                                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {format(new Date(post.updatedAt), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-syne font-bold group-hover:text-primary transition-colors cursor-pointer">
                                            {post.title}
                                        </h3>
                                        <p className="text-sm text-text-secondary line-clamp-2">
                                            {post.excerpt}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-border-subtle pt-4 md:pt-0 md:pl-6">
                                        <div className="text-center px-4">
                                            <p className="text-xl font-syne font-bold">{post.viewCount || 0}</p>
                                            <p className="text-[10px] text-text-secondary font-bold uppercase">Views</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/blog/manage/${post.id}`} className="p-3 bg-surface-elevated hover:bg-primary/20 hover:text-primary rounded-xl transition-all">
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <Link href={`/blog/${post.slug}`} target="_blank" className="p-3 bg-surface-elevated hover:bg-success/20 hover:text-success rounded-xl transition-all">
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="p-3 bg-surface-elevated hover:bg-red-500/20 hover:text-red-500 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredPosts.length === 0 && (
                        <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-border-subtle">
                            <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">No entries found matching filters.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
