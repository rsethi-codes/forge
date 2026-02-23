import React from 'react'
import { ArrowRight, Calendar, Clock, ChevronRight, Github, Twitter, Linkedin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { getPublicBlogPosts } from '@/lib/actions/blog'

// ISR: Regenerate the public blog listing every 60 seconds
export const revalidate = 60

export default async function PublicBlogPage() {
    const posts = await getPublicBlogPosts()
    const featuredPost = posts[0]
    const remainingPosts = posts.slice(1)

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-text-primary selection:bg-primary selection:text-white">
            {/* Editorial Header */}
            <nav className="h-20 border-b border-white/5 flex items-center justify-between px-6 md:px-12 fixed top-0 w-full bg-[#0a0a0a]/80 backdrop-blur-xl z-50">
                <Link href="/" className="text-2xl font-syne font-bold tracking-tighter">FORGE</Link>
                <div className="flex items-center gap-8">
                    <Link href="/blog" className="text-sm font-bold uppercase tracking-widest text-primary border-b-2 border-primary pb-1">Archive</Link>
                    <Link href="/login" className="text-sm font-bold uppercase tracking-widest text-text-secondary hover:text-white transition-colors">Access Dashboard</Link>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
                <section className="mb-20 space-y-6 max-w-3xl">
                    <h1 className="text-5xl md:text-7xl font-syne font-bold tracking-tighter leading-tight animate-in fade-in slide-in-from-bottom-5 duration-700">
                        The Chronicles <br /> of a <span className="italic font-lora font-normal text-text-secondary">Senior Engineer.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-text-secondary font-lora leading-relaxed max-w-2xl animate-in fade-in slide-in-from-bottom-5 delay-100 duration-700">
                        An aggressive 60-day journey documented in real-time. Exploring the deep technical corners of React, architecture, and professional excellence.
                    </p>
                </section>

                {/* Featured Post */}
                {featuredPost ? (
                    <Link href={`/blog/${featuredPost.slug}`} className="block group relative h-[500px] mb-20 rounded-[2.5rem] overflow-hidden border border-white/10 transition-all hover:border-primary/50">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent z-10" />
                        <Image
                            src={featuredPost.coverImageUrl || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                            alt={featuredPost.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-1000"
                            priority
                        />
                        <div className="absolute bottom-12 left-12 right-12 z-20 space-y-4">
                            <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full">New Release</span>
                            <h2 className="text-4xl md:text-5xl font-syne font-bold tracking-tighter max-w-2xl text-white">
                                {featuredPost.title}
                            </h2>
                            <span className="inline-flex items-center gap-2 text-white font-bold hover:gap-4 transition-all">
                                Read the Masterclass <ArrowRight className="w-5 h-5" />
                            </span>
                        </div>
                    </Link>
                ) : (
                    <div className="h-[200px] flex items-center justify-center border border-dashed border-white/10 rounded-[2.5rem] mb-20 text-text-secondary font-bold uppercase tracking-widest text-xs">
                        The archive is currently empty. The grind begins soon.
                    </div>
                )}

                {/* Post Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
                    {remainingPosts.map((post: any, i: number) => (
                        <article key={post.id} className="group space-y-6">
                            <Link href={`/blog/${post.slug}`} className="block aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/5 bg-surface relative">
                                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                    <span className="text-sm font-bold text-primary uppercase bg-white px-6 py-2 rounded-full shadow-2xl">Read Entry</span>
                                </div>
                                <Image
                                    src={post.coverImageUrl || `https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2031`}
                                    alt={post.title}
                                    fill
                                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                />
                            </Link>
                            <div className="space-y-3">
                                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                                    <span className="text-primary">ENGINEERING</span>
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : 'Draft'}</span>
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {post.readingTimeMinutes || 5} min read</span>
                                </div>
                                <h3 className="text-2xl font-syne font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                    {post.title}
                                </h3>
                                <p className="text-text-secondary font-lora line-clamp-2">
                                    {post.excerpt || 'No description provided.'}
                                </p>
                                <Link href={`/blog/${post.slug}`} className="text-sm font-bold flex items-center gap-1 group-hover:translate-x-2 transition-transform">
                                    Full Story <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </main>

            {/* Editorial Footer */}
            <footer className="border-t border-white/5 py-20 px-12 mt-20 bg-[#0c0c0c]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
                    <div className="space-y-6 max-w-sm">
                        <h2 className="text-3xl font-syne font-bold tracking-tighter">FORGE.</h2>
                        <p className="text-text-secondary font-lora">
                            A professional record of excellence. Designed by a software engineer for software engineers.
                        </p>
                        <div className="flex gap-4">
                            <Twitter className="w-5 h-5 text-text-secondary hover:text-primary transition-colors cursor-pointer" />
                            <Github className="w-5 h-5 text-text-secondary hover:text-primary transition-colors cursor-pointer" />
                            <Linkedin className="w-5 h-5 text-text-secondary hover:text-primary transition-colors cursor-pointer" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-12 text-sm">
                        <div className="space-y-4">
                            <p className="font-bold text-white uppercase tracking-widest">Archive</p>
                            <ul className="space-y-2 text-text-secondary">
                                <li className="hover:text-primary cursor-pointer transition-colors">Architecture</li>
                                <li className="hover:text-primary cursor-pointer transition-colors">TypeScript</li>
                                <li className="hover:text-primary cursor-pointer transition-colors">Real-time Apps</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <p className="font-bold text-white uppercase tracking-widest">Resources</p>
                            <ul className="space-y-2 text-text-secondary">
                                <li className="hover:text-primary cursor-pointer transition-colors">The 60-Day Map</li>
                                <li className="hover:text-primary cursor-pointer transition-colors">Resume Helper</li>
                                <li className="hover:text-primary cursor-pointer transition-colors">LinkedIn Tips</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
