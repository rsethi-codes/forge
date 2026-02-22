import React from 'react'
import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import {
    ArrowLeft,
    Clock,
    Calendar,
    Share2,
    Bookmark,
    Twitter,
    Linkedin,
    Facebook
} from 'lucide-react'
import { Metadata } from 'next'
import Image from 'next/image'
import { getBlogPost } from '@/lib/actions/blog'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const [post] = await db
        .select()
        .from(schema.blogPosts)
        .where(eq(schema.blogPosts.slug, params.slug))
        .limit(1)

    if (!post) return { title: 'Post Not Found' }

    return {
        title: `${post.title} | FORGE Blog`,
        description: post.excerpt || `Read ${post.title} on the FORGE Dev Blog.`,
        openGraph: {
            title: post.title,
            description: post.excerpt || undefined,
            images: post.coverImageUrl ? [post.coverImageUrl] : [],
            type: 'article',
            publishedTime: post.publishedAt?.toISOString(),
        }
    }
}

export default async function BlogPostDetail({
    params,
}: {
    params: { slug: string }
}) {
    const post = await getBlogPost(params.slug)

    if (!post) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-text-primary selection:bg-primary selection:text-white">
            {/* Editorial Header */}
            <nav className="h-20 flex items-center justify-between px-6 md:px-12 fixed top-0 w-full z-50 bg-[#0a0a0a]/50 backdrop-blur-xl">
                <Link href="/blog" className="flex items-center gap-2 text-text-secondary hover:text-white transition-all bg-black px-4 py-2 rounded-full border border-white/5">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Back to Archive</span>
                </Link>
                <div className="flex items-center gap-4">
                    <button className="p-2.5 bg-black border border-white/5 rounded-full hover:border-primary/50 transition-colors"><Share2 className="w-4 h-4" /></button>
                    <button className="p-2.5 bg-black border border-white/5 rounded-full hover:border-primary/50 transition-colors"><Bookmark className="w-4 h-4" /></button>
                </div>
            </nav>

            <article className="pt-40 pb-20">
                <header className="max-w-4xl mx-auto px-6 text-center space-y-8">
                    <div className="flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                        <span>ENGINEERING</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <span className="text-text-secondary">{post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : 'Draft'}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <span className="text-text-secondary">{(post.contentHtml?.length || 0) / 200 > 0 ? Math.ceil((post.contentHtml?.length || 0) / 1000) : 5} Min Read</span>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-syne font-bold tracking-tighter leading-tight animate-in fade-in slide-in-from-bottom-5 duration-700">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-center gap-4 animate-in fade-in delay-200">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">R</div>
                        <div className="text-left">
                            <p className="text-sm font-bold">Raghav</p>
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Growth Engineer @ Forge</p>
                        </div>
                    </div>
                </header>

                {/* Hero Image */}
                {post.coverImageUrl && (
                    <div className="w-full max-w-6xl mx-auto px-6 my-16">
                        <div className="relative aspect-video">
                            <Image
                                src={post.coverImageUrl}
                                alt={post.title}
                                fill
                                className="object-cover rounded-[3rem] border border-white/10 shadow-2xl"
                                priority
                            />
                        </div>
                    </div>
                )}

                {/* Main Content Body */}
                <div className="max-w-3xl mx-auto px-6 space-y-12">
                    <div
                        className="prose prose-invert prose-lg max-w-none font-lora leading-relaxed text-text-secondary selection:text-white"
                        dangerouslySetInnerHTML={{ __html: post.contentHtml || '' }}
                    />

                    {/* Resources Section */}
                    {post.resources && (post.resources as any[]).length > 0 && (
                        <div className="pt-12 space-y-6">
                            <h3 className="text-xl font-syne font-bold border-l-4 border-primary pl-4 uppercase tracking-wider">Useful Resources</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {(post.resources as any[]).map((res: any, i: number) => (
                                    <a
                                        key={i}
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/50 transition-all"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{res.title}</span>
                                            <span className="text-[10px] text-text-secondary truncate max-w-md">{res.url}</span>
                                        </div>
                                        <Share2 className="w-4 h-4 text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Post Footer / Share */}
                    <footer className="pt-20 border-t border-white/5 space-y-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex gap-4">
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#111111] border border-white/5 rounded-full text-xs font-bold hover:bg-primary/10 transition-colors">
                                    <Twitter className="w-3 h-3" /> Tweet
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#111111] border border-white/5 rounded-full text-xs font-bold hover:bg-primary/10 transition-colors">
                                    <Linkedin className="w-3 h-3" /> Share
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-end">
                                {(post.technologies as string[] || []).map((tag: any) => (
                                    <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md">
                                        #{tag.toLowerCase()}
                                    </span>
                                ))}
                                {(!post.technologies || (post.technologies as string[]).length === 0) && ["ENGINEERING"].map((tag) => (
                                    <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-text-secondary bg-white/5 px-2.5 py-1 rounded-md">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </footer>
                </div>
            </article>

            {/* Recommended Posts (Static for now) */}
            <section className="bg-[#0c0c0c] py-20 border-t border-white/5">
                <div className="max-w-4xl mx-auto px-6 space-y-12">
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-center text-text-secondary">Keep Reading</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="group space-y-4 cursor-pointer">
                            <div className="aspect-[16/9] bg-surface rounded-2xl overflow-hidden border border-white/5 relative">
                                <Image
                                    src="https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2031"
                                    alt="Mastering TypeScript"
                                    fill
                                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                            </div>
                            <h5 className="text-xl font-syne font-bold group-hover:text-primary transition-colors">Mastering TypeScript Utility Types</h5>
                        </div>
                        <div className="group space-y-4 cursor-pointer">
                            <div className="aspect-[16/9] bg-surface rounded-2xl overflow-hidden border border-white/5 relative">
                                <Image
                                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070"
                                    alt="Engineering Management"
                                    fill
                                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                            </div>
                            <h5 className="text-xl font-syne font-bold group-hover:text-primary transition-colors">The Engineering Management Blindspot</h5>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
