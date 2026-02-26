import React from 'react'
import { ArrowRight, Calendar, Clock, Github, Twitter, Linkedin, Rss, BookOpen, Code2, Layers, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { getPublicBlogPosts } from '@/lib/actions/blog'
import { cn } from '@/lib/utils'

// ISR: Regenerate the public blog listing every 60 seconds
export const revalidate = 60

function getReadTime(html: string) {
    const words = (html || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(words / 200))
}

const CATEGORY_ICONS: Record<string, any> = {
    'React': Code2,
    'TypeScript': Code2,
    'Architecture': Layers,
    'Next.js': Zap,
    'default': BookOpen
}

export default async function PublicBlogPage({
    searchParams
}: {
    searchParams: { tag?: string }
}) {
    const allPosts = await getPublicBlogPosts()
    const selectedTag = searchParams.tag

    const posts = selectedTag
        ? allPosts.filter((p: any) => (p.technologies as string[] || []).includes(selectedTag))
        : allPosts

    const featuredPost = posts[0]
    const remainingPosts = posts.slice(1)

    // Collect all unique tech tags across all public posts for the filter bar
    const allTags = Array.from(new Set(
        allPosts.flatMap((p: any) => (p.technologies as string[]) || [])
    )).slice(0, 12)

    return (
        <div className="min-h-screen bg-[#080808] text-white selection:bg-primary selection:text-white font-sans">
            {/* Sticky Editorial Nav */}
            <nav className="h-20 border-b border-white/5 flex items-center justify-between px-6 md:px-16 fixed top-0 w-full bg-[#080808]/90 backdrop-blur-xl z-50">
                <Link href="/" className="text-2xl font-syne font-black tracking-tighter flex items-center gap-2">
                    <span className="text-primary">F</span>ORGE
                </Link>
                <div className="flex items-center gap-6 md:gap-10">
                    <Link href="/blog" className="text-[11px] font-black uppercase tracking-[0.25em] text-primary border-b-2 border-primary pb-1">
                        War Logs
                    </Link>
                    <a
                        href="https://github.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-white transition-colors"
                        aria-label="GitHub"
                    >
                        <Github className="w-4 h-4" />
                    </a>
                    <a
                        href="https://linkedin.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-primary transition-colors"
                        aria-label="LinkedIn"
                    >
                        <Linkedin className="w-4 h-4" />
                    </a>
                    <Link
                        href="/login"
                        className="text-[11px] font-black uppercase tracking-[0.2em] bg-primary hover:bg-red-600 text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-primary/20"
                    >
                        Dashboard
                    </Link>
                </div>
            </nav>

            <main className="pt-28 pb-24 px-6 md:px-16 max-w-7xl mx-auto">

                {/* Hero Copy */}
                <section className="mb-16 space-y-6 max-w-4xl">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Live Chronicle</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-syne font-black tracking-tighter leading-[0.9] uppercase">
                        The War
                        <br />
                        <span className="italic font-normal text-text-secondary" style={{ fontFamily: 'var(--font-lora, Georgia)' }}>
                            Logs.
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl" style={{ fontFamily: 'var(--font-lora, Georgia)' }}>
                        A documented, real-time transformation from mid-level to senior engineer —
                        covering system design, architecture decisions, and the hard lessons shipping production code teaches you.
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-6 pt-2">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold">{posts.length} article{posts.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <div className="flex items-center gap-2">
                            <Rss className="w-4 h-4 text-text-secondary" />
                            <span className="text-sm font-bold text-text-secondary">Updated weekly</span>
                        </div>
                    </div>
                </section>

                {/* Tech Tag Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 mb-12">
                    <Link
                        href="/blog"
                        className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all border",
                            !selectedTag ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "text-text-secondary bg-white/5 border-white/5 hover:border-white/20"
                        )}
                    >
                        All Entries
                    </Link>
                    {allTags.map((tag: string) => (
                        <Link
                            key={tag}
                            href={`/blog?tag=${tag}`}
                            className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all border",
                                selectedTag === tag
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                    : "text-text-secondary bg-white/5 border-white/5 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                            )}
                        >
                            #{tag}
                        </Link>
                    ))}
                </div>

                {/* Featured Post */}
                {featuredPost ? (
                    <Link
                        href={`/blog/${featuredPost.slug}`}
                        className="group relative block h-[520px] mb-24 rounded-[3rem] overflow-hidden border border-white/10 hover:border-primary/40 transition-all duration-500 shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/50 to-transparent z-10" />
                        <Image
                            src={featuredPost.coverImageUrl || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                            alt={featuredPost.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-1000"
                            priority
                        />
                        {/* Featured badge */}
                        <div className="absolute top-8 left-8 z-20">
                            <span className="bg-primary text-white text-[10px] font-black uppercase tracking-[0.25em] px-4 py-1.5 rounded-full shadow-lg shadow-primary/30">
                                Latest Entry
                            </span>
                        </div>
                        <div className="absolute bottom-10 left-10 right-10 z-20 space-y-4">
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                                <Calendar className="w-3.5 h-3.5" />
                                {featuredPost.publishedAt ? format(new Date(featuredPost.publishedAt), 'MMM d, yyyy') : 'New'}
                                <div className="w-1 h-1 rounded-full bg-white/30" />
                                <Clock className="w-3.5 h-3.5" />
                                {getReadTime(featuredPost.contentHtml || '')} min read
                            </div>
                            <h2 className="text-3xl md:text-5xl font-syne font-black tracking-tighter leading-tight max-w-3xl text-white drop-shadow-lg">
                                {featuredPost.title}
                            </h2>
                            {featuredPost.excerpt && (
                                <p className="text-white/70 text-base max-w-xl leading-relaxed hidden md:block" style={{ fontFamily: 'var(--font-lora, Georgia)' }}>
                                    {featuredPost.excerpt.slice(0, 140)}{featuredPost.excerpt.length > 140 ? '...' : ''}
                                </p>
                            )}
                            <div className="flex items-center gap-3 pt-2">
                                <span className="inline-flex items-center gap-2 bg-white text-black font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-full group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
                                    Read the Entry <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                                {(featuredPost.technologies as string[] || []).slice(0, 3).map((t: string) => (
                                    <span key={t} className="text-[9px] font-black uppercase tracking-widest text-white/50 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[3rem] mb-24 space-y-4 text-center px-8">
                        <BookOpen className="w-10 h-10 text-white/10" />
                        <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">
                            The chronicle begins soon. The grind is already underway.
                        </p>
                    </div>
                )}

                {/* Post Grid */}
                {remainingPosts.length > 0 && (
                    <>
                        <div className="flex items-center gap-4 mb-12">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">All Entries</h2>
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{remainingPosts.length} posts</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
                            {remainingPosts.map((post: any) => {
                                const readTime = getReadTime(post.contentHtml || '')
                                const tags = (post.technologies as string[]) || []
                                return (
                                    <article key={post.id} className="group space-y-5">
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="block aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/5 group-hover:border-primary/30 bg-[#111] relative transition-all duration-500 shadow-xl"
                                        >
                                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
                                                <span className="text-[10px] font-black text-white bg-primary px-6 py-2.5 rounded-full shadow-2xl translate-y-2 group-hover:translate-y-0 transition-transform uppercase tracking-widest">
                                                    Read Entry
                                                </span>
                                            </div>
                                            <Image
                                                src={post.coverImageUrl || `https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2031`}
                                                alt={post.title}
                                                fill
                                                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                                            />
                                        </Link>
                                        <div className="space-y-3 px-1">
                                            {/* Meta row */}
                                            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                                                <span className="text-primary font-black">
                                                    {tags[0] || 'Engineering'}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-white/20" />
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : 'Draft'}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-white/20" />
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {readTime} min
                                                </span>
                                            </div>
                                            {/* Title */}
                                            <h3 className="text-xl font-syne font-black leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                                            </h3>
                                            {/* Excerpt */}
                                            <p className="text-text-secondary text-sm leading-relaxed line-clamp-2" style={{ fontFamily: 'var(--font-lora, Georgia)' }}>
                                                {post.excerpt || 'Read the full story...'}
                                            </p>
                                            {/* Tech tags */}
                                            {tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {tags.slice(0, 3).map((t: string) => (
                                                        <span key={t} className="text-[9px] font-black uppercase tracking-widest text-text-secondary bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                                                            #{t}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <Link
                                                href={`/blog/${post.slug}`}
                                                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary/70 group-hover:text-primary group-hover:gap-3 transition-all pt-1"
                                            >
                                                Full Story <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* Author CTA Section */}
                <section className="mt-24 bg-gradient-to-br from-white/3 to-white/0 border border-white/10 rounded-[3rem] p-12 md:p-16 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-3xl font-black font-syne">
                            R
                        </div>
                    </div>
                    <div className="flex-1 space-y-3 text-center md:text-left">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Author</div>
                        <h3 className="text-2xl font-syne font-black tracking-tighter">Raghav Sethi</h3>
                        <p className="text-text-secondary leading-relaxed" style={{ fontFamily: 'var(--font-lora, Georgia)' }}>
                            Software engineer on an aggressive 60-day track to senior. Writing about real system design, architecture patterns, and what it actually takes to ship production-grade code.
                        </p>
                        <div className="flex items-center gap-4 justify-center md:justify-start pt-2">
                            <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-white transition-colors">
                                <Github className="w-4 h-4" /> GitHub
                            </a>
                            <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-colors">
                                <Linkedin className="w-4 h-4" /> LinkedIn
                            </a>
                            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-sky-400 transition-colors">
                                <Twitter className="w-4 h-4" /> Twitter
                            </a>
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col gap-3">
                        <Link
                            href="/login"
                            className="bg-primary hover:bg-red-600 text-white font-black text-[11px] uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 text-center whitespace-nowrap"
                        >
                            Follow the Journey
                        </Link>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary text-center">
                            {posts.length} entries published
                        </span>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-16 px-6 md:px-16 bg-[#050505]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
                    <div className="space-y-4 max-w-sm">
                        <h2 className="text-3xl font-syne font-black tracking-tighter">FORGE.</h2>
                        <p className="text-text-secondary text-sm leading-relaxed" style={{ fontFamily: 'var(--font-lora, Georgia)' }}>
                            A professional record of excellence. Designed by a software engineer, for software engineers who refuse to stay average.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-text-secondary hover:text-sky-400 hover:border-sky-400/30 transition-all">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-text-secondary hover:text-white hover:border-white/20 transition-all">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/30 transition-all">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 text-sm">
                        <div className="space-y-4">
                            <p className="font-black text-white uppercase tracking-widest text-[10px]">The Archive</p>
                            <ul className="space-y-3 text-text-secondary">
                                <li><Link href="/blog" className="hover:text-primary transition-colors">All Entries</Link></li>
                                <li><span className="opacity-40 cursor-default">System Design</span></li>
                                <li><span className="opacity-40 cursor-default">TypeScript Deep Dives</span></li>
                                <li><span className="opacity-40 cursor-default">Real-time Architecture</span></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <p className="font-black text-white uppercase tracking-widest text-[10px]">Mission</p>
                            <ul className="space-y-3 text-text-secondary">
                                <li><Link href="/login" className="hover:text-primary transition-colors">Access Dashboard</Link></li>
                                <li><span className="opacity-40 cursor-default">The 60-Day Map</span></li>
                                <li><a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">LinkedIn Profile</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/40">
                        © {new Date().getFullYear()} Forge — Engineered in the Dark
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/40">
                        Built with Next.js · Supabase · Drizzle
                    </p>
                </div>
            </footer>
        </div>
    )
}
