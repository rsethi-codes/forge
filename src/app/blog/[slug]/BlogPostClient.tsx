'use client'

import React, { useEffect, useState, useRef } from 'react'
import { ArrowLeft, Clock, Calendar, Share2, Twitter, Linkedin, Link2, CheckCheck, ChevronRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'

interface BlogPostClientProps {
    post: any
    relatedPosts: any[]
}

function getReadTime(html: string) {
    const words = (html || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(words / 200))
}

export default function BlogPostClient({ post, relatedPosts }: BlogPostClientProps) {
    const [scrollProgress, setScrollProgress] = useState(0)
    const [copied, setCopied] = useState(false)
    const [shareOpen, setShareOpen] = useState(false)
    const articleRef = useRef<HTMLElement>(null)
    const readTime = getReadTime(post.contentHtml || '')

    // Reading progress bar
    useEffect(() => {
        const handleScroll = () => {
            const el = articleRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const docHeight = el.offsetHeight
            const scrolled = Math.max(0, -rect.top)
            const pct = Math.min(100, (scrolled / (docHeight - window.innerHeight)) * 100)
            setScrollProgress(pct)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const pageUrl = typeof window !== 'undefined' ? window.location.href : `https://yoursite.com/blog/${post.slug}`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(pageUrl)}&via=raghav_forged`
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`

    const copyLink = async () => {
        await navigator.clipboard.writeText(pageUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    return (
        <div className="min-h-screen bg-[#080808] text-white selection:bg-primary selection:text-white">
            {/* Reading Progress Bar */}
            <div
                className="fixed top-0 left-0 h-[2px] bg-primary z-[100] transition-all duration-100 shadow-[0_0_8px_rgba(255,49,49,0.6)]"
                style={{ width: `${scrollProgress}%` }}
            />

            {/* Sticky Nav */}
            <nav className="h-16 flex items-center justify-between px-6 md:px-12 fixed top-0 w-full z-50 bg-[#080808]/80 backdrop-blur-xl border-b border-white/5">
                <Link
                    href="/blog"
                    className="flex items-center gap-2 text-text-secondary hover:text-white transition-all group"
                >
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 group-hover:border-primary/30 flex items-center justify-center transition-all">
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">War Logs</span>
                </Link>

                {/* Reading meta */}
                <div className="hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary/60">
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {readTime} min read</span>
                    <div className="w-px h-3 bg-white/10" />
                    <span className="text-primary">{Math.round(scrollProgress)}% read</span>
                </div>

                {/* Share controls */}
                <div className="flex items-center gap-2 relative">
                    <button
                        onClick={() => setShareOpen(!shareOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-primary/40 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:text-primary"
                    >
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                    </button>

                    {shareOpen && (
                        <div className="absolute right-0 top-full mt-3 bg-[#111] border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/60 flex flex-col gap-1 w-48 z-50">
                            <a
                                href={twitterUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-sky-500/10 hover:text-sky-400 text-text-secondary text-[11px] font-bold uppercase tracking-widest transition-all"
                                onClick={() => setShareOpen(false)}
                            >
                                <Twitter className="w-4 h-4" /> Post on X
                            </a>
                            <a
                                href={linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-blue-500/10 hover:text-blue-400 text-text-secondary text-[11px] font-bold uppercase tracking-widest transition-all"
                                onClick={() => setShareOpen(false)}
                            >
                                <Linkedin className="w-4 h-4" /> Share on LinkedIn
                            </a>
                            <button
                                onClick={() => { copyLink(); setShareOpen(false) }}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-primary/10 hover:text-primary text-text-secondary text-[11px] font-bold uppercase tracking-widest transition-all w-full text-left"
                            >
                                {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <article ref={articleRef} className="pt-32 pb-20">
                {/* Header */}
                <header className="max-w-4xl mx-auto px-6 text-center space-y-8">
                    {/* Category & meta */}
                    <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.25em]">
                        <span className="text-primary">{(post.technologies as string[])?.[0] || 'Engineering'}</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-text-secondary flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {post.publishedAt ? format(new Date(post.publishedAt), 'MMMM d, yyyy') : 'Draft'}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-text-secondary flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {readTime} min read
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-syne font-black tracking-tighter leading-[0.95]">
                        {post.title}
                    </h1>

                    {post.excerpt && (
                        <p className="text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-lora, Georgia)' }}>
                            {post.excerpt}
                        </p>
                    )}

                    {/* Author */}
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xl font-black font-syne">
                            R
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black text-white">Raghav Sethi</p>
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Growth Engineer · 60-Day Forge</p>
                        </div>
                        <div className="h-6 w-px bg-white/10 mx-2" />
                        <div className="flex gap-2">
                            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 hover:border-sky-400/30 hover:text-sky-400 flex items-center justify-center text-text-secondary transition-all">
                                <Twitter className="w-3.5 h-3.5" />
                            </a>
                            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 hover:border-blue-400/30 hover:text-blue-400 flex items-center justify-center text-text-secondary transition-all">
                                <Linkedin className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* Tech tags */}
                    {(post.technologies as string[] || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                            {(post.technologies as string[]).map((tag: string) => (
                                <span key={tag} className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </header>

                {/* Hero Image */}
                {post.coverImageUrl && (
                    <div className="w-full max-w-6xl mx-auto px-6 my-16">
                        <div className="relative aspect-video rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
                            <Image
                                src={post.coverImageUrl}
                                alt={post.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>
                )}

                {/* Article body — two-column layout on desktop */}
                <div className="max-w-7xl mx-auto px-6 flex gap-16">
                    {/* Table of contents sidebar (desktop) */}
                    <aside className="hidden xl:block w-56 flex-shrink-0 pt-4">
                        <div className="sticky top-24 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">In this entry</p>
                            <div className="space-y-2 border-l border-white/5 pl-4">
                                <p className="text-xs text-text-secondary/60 italic" style={{ fontFamily: 'var(--font-lora, Georgia)' }}>
                                    {post.excerpt?.slice(0, 80) || 'Technical deep-dive...'}
                                </p>
                            </div>
                            <div className="pt-4 border-t border-white/5 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Share</p>
                                <a
                                    href={twitterUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-[10px] font-bold text-text-secondary hover:text-sky-400 transition-colors uppercase tracking-widest"
                                >
                                    <Twitter className="w-3.5 h-3.5" /> Tweet this
                                </a>
                                <a
                                    href={linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-[10px] font-bold text-text-secondary hover:text-blue-400 transition-colors uppercase tracking-widest"
                                >
                                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                                </a>
                                <button
                                    onClick={copyLink}
                                    className="flex items-center gap-2 text-[10px] font-bold text-text-secondary hover:text-primary transition-colors uppercase tracking-widest"
                                >
                                    {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied!' : 'Copy link'}
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Main content */}
                    <div className="flex-1 max-w-3xl space-y-12">
                        <div
                            className="prose prose-invert prose-lg max-w-none leading-relaxed text-text-secondary
                                       prose-headings:font-syne prose-headings:font-black prose-headings:text-white prose-headings:tracking-tighter
                                       prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
                                       prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                       prose-strong:text-white prose-strong:font-black
                                       prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                                       prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-2xl
                                       prose-blockquote:border-l-primary prose-blockquote:text-text-secondary prose-blockquote:italic
                                       prose-img:rounded-2xl"
                            style={{ fontFamily: 'var(--font-lora, Georgia)' }}
                            dangerouslySetInnerHTML={{ __html: post.contentHtml || '' }}
                        />

                        {/* Resources */}
                        {Array.isArray(post.resources) && (post.resources as any[]).length > 0 && (
                            <div className="pt-12 space-y-6 border-t border-white/5">
                                <h3 className="text-xl font-syne font-black border-l-4 border-primary pl-4 uppercase tracking-wider">
                                    Reference Nodes
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {(post.resources as any[]).map((res: any, i: number) => (
                                        <a
                                            key={i}
                                            href={res.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center justify-between p-4 bg-white/3 hover:bg-primary/5 border border-white/5 hover:border-primary/30 rounded-2xl transition-all"
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{res.title}</span>
                                                <span className="text-[10px] text-text-secondary truncate max-w-md font-mono opacity-50">{res.url}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Post-article share CTA */}
                        <div className="pt-12 border-t border-white/5">
                            <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-3xl p-8 space-y-5">
                                <h4 className="text-lg font-syne font-black uppercase tracking-tight">Found this useful?</h4>
                                <p className="text-sm text-text-secondary" style={{ fontFamily: 'var(--font-lora, Georgia)' }}>
                                    Share it with someone building their career in engineering. Every signal helps grow the archive.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <a
                                        href={twitterUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-5 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40 text-sky-400 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                                    >
                                        <Twitter className="w-3.5 h-3.5" /> Share on X
                                    </a>
                                    <a
                                        href={linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                                    >
                                        <Linkedin className="w-3.5 h-3.5" /> Post on LinkedIn
                                    </a>
                                    <button
                                        onClick={copyLink}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/20 text-text-secondary hover:text-primary rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                                    >
                                        {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                                        {copied ? 'Copied!' : 'Copy Link'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className="bg-[#040404] border-t border-white/5 py-20">
                    <div className="max-w-7xl mx-auto px-6 space-y-12">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">Continue Reading</h4>
                            <Link href="/blog" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-red-400 transition-colors flex items-center gap-1">
                                Full Archive <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {relatedPosts.map((p: any) => (
                                <article key={p.id} className="group space-y-4">
                                    <Link href={`/blog/${p.slug}`} className="block aspect-[16/9] bg-[#111] rounded-2xl overflow-hidden border border-white/5 group-hover:border-primary/20 relative transition-all">
                                        {p.coverImageUrl ? (
                                            <Image
                                                src={p.coverImageUrl}
                                                alt={p.title}
                                                fill
                                                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <BookOpen className="w-8 h-8 text-white/10" />
                                            </div>
                                        )}
                                    </Link>
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-primary">
                                            {(p.technologies as string[])?.[0] || 'Engineering'}
                                        </div>
                                        <h5 className="font-syne font-black text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                            <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                                        </h5>
                                        <p className="text-xs text-text-secondary line-clamp-1" style={{ fontFamily: 'var(--font-lora, Georgia)' }}>
                                            {p.excerpt}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                            <Clock className="w-3 h-3" /> {getReadTime(p.contentHtml || '')} min read
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}
