'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Save, Globe, Lock, Eye, Settings, Image as ImageIcon, Loader2, Trash2, Plus, X, Zap, Upload, FileText, CheckCircle2, AlertCircle, Shield, Calendar, ArrowRight, Check, Info } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import TiptapEditor from '@/components/editor/TiptapEditor'
import { cn } from '@/lib/utils'
import { upsertBlogPost } from '@/lib/actions/blog'
import { createClient } from '@/lib/supabase/client'

export default function ComposePostPage() {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [coverUrl, setCoverUrl] = useState('')
    const [excerpt, setExcerpt] = useState('')
    const [content, setContent] = useState<any>(null)
    const [html, setHtml] = useState('')
    const [visibility, setVisibility] = useState<'public' | 'private'>('private')
    const [isSaving, setIsSaving] = useState(false)
    const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url')
    const [isUploading, setIsUploading] = useState(false)
    const [techs, setTechs] = useState<string[]>([])
    const [newTech, setNewTech] = useState('')
    const [resources, setResources] = useState<{ title: string, url: string }[]>([])
    const [newResourceTitle, setNewResourceTitle] = useState('')
    const [newResourceUrl, setNewResourceUrl] = useState('')
    const supabase = createClient()

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `covers/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('roadmap-files')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('roadmap-files')
                .getPublicUrl(filePath)

            setCoverUrl(publicUrl)
        } catch (error) {
            console.error(error)
            alert('Error uploading image!')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSave = async () => {
        if (!title) {
            alert('Please enter a title')
            return
        }

        setIsSaving(true)
        try {
            await upsertBlogPost({
                title,
                slug: slugify(title),
                content: content,
                contentHtml: html,
                coverImageUrl: coverUrl,
                excerpt: excerpt || title.substring(0, 100),
                visibility: visibility,
                technologies: techs,
                resources: resources
            })
            router.push('/blog/manage')
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Failed to save post.')
        } finally {
            setIsSaving(false)
        }
    }

    const [isMetadataOpen, setIsMetadataOpen] = useState(true)

    const wordCount = html ? html.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length : 0
    const readTime = Math.ceil(wordCount / 200)

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100
            }
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-text-primary flex flex-col font-syne overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse delay-700" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            <header className="h-24 border-b border-white/5 bg-black/40 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-[60]">
                <div className="flex items-center gap-8">
                    <Link href="/blog/manage" className="group flex items-center gap-3 text-text-secondary hover:text-white transition-all">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/50 transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="font-bold uppercase tracking-[0.2em] text-[10px]">Return to Lab</span>
                    </Link>
                    <div className="h-8 w-px bg-white/10" />
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col"
                    >
                        <input
                            type="text"
                            placeholder="UNTITLED INTELLIGENCE BRIEFING..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-transparent text-2xl font-black outline-none placeholder:text-white/10 w-full max-w-2xl tracking-tighter uppercase italic"
                        />
                        <div className="flex items-center gap-4 text-[9px] font-bold text-text-secondary uppercase tracking-widest mt-1">
                            <span className="text-primary/60">Stage: Draft</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span>{readTime} Min Read</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span>{wordCount} Words Output</span>
                        </div>
                    </motion.div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsMetadataOpen(!isMetadataOpen)}
                        className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center border transition-all",
                            isMetadataOpen ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 border-white/5 text-text-secondary hover:text-white"
                        )}
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-12 bg-white text-black hover:bg-primary hover:text-white font-black px-8 rounded-xl flex items-center gap-3 transition-all disabled:opacity-50 transform hover:scale-105 active:scale-95 shadow-2xl uppercase text-xs tracking-widest"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Transmit Briefing
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Main Editor Canvas */}
                <main className="flex-1 overflow-y-auto custom-scrollbar relative">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-4xl mx-auto py-20 px-8"
                    >
                        <motion.section variants={itemVariants} className="bg-[#080808]/80 border border-white/5 rounded-[3rem] p-12 min-h-[1000px] shadow-[0_0_100px_rgba(0,0,0,0.5)] backdrop-blur-sm relative group">
                            {/* Editor UI Accents */}
                            <div className="absolute top-8 left-8 flex gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                            </div>

                            <div className="mb-12 border-b border-white/5 pb-8 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Neural Link Established</span>
                                </div>
                                <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
                                    Forge OS 3.0 // Unified Editor
                                </div>
                            </div>

                            <TiptapEditor
                                content={content}
                                onChange={(json, htmlString) => {
                                    setContent(json)
                                    setHtml(htmlString)
                                }}
                            />
                        </motion.section>

                        <motion.div
                            variants={itemVariants}
                            className="mt-12 text-center opacity-30 text-[10px] font-bold uppercase tracking-[0.5em] pb-20"
                        >
                            End of Transmission — Forge Intelligence
                        </motion.div>
                    </motion.div>
                </main>

                {/* Glassmorphic Metadata Sidebar */}
                <AnimatePresence>
                    {isMetadataOpen && (
                        <motion.aside
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-[400px] bg-black/40 backdrop-blur-3xl border-l border-white/10 p-8 overflow-y-auto overflow-x-hidden z-50 h-[calc(100vh-6rem)] custom-scrollbar"
                        >
                            <div className="space-y-12">
                                <header className="flex items-center justify-between">
                                    <h2 className="text-xl font-black italic tracking-tighter uppercase italic">Configuration</h2>
                                    <button onClick={() => setIsMetadataOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-text-secondary" />
                                    </button>
                                </header>

                                {/* Visibility Toggle */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Distribution Mode</label>
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                                        <button
                                            onClick={() => setVisibility('private')}
                                            className={cn(
                                                "flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                                visibility === 'private' ? "bg-white text-black shadow-xl" : "text-text-secondary hover:text-white"
                                            )}
                                        >
                                            <Lock className="w-3.5 h-3.5" /> Internal
                                        </button>
                                        <button
                                            onClick={() => setVisibility('public')}
                                            className={cn(
                                                "flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                                visibility === 'public' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-secondary hover:text-white"
                                            )}
                                        >
                                            <Globe className="w-3.5 h-3.5" /> Global
                                        </button>
                                    </div>
                                </div>

                                {/* Visual Identity */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Hero Visual</label>
                                        <div className="flex bg-white/5 rounded-full p-1 border border-white/5 scale-75 origin-right">
                                            <button onClick={() => setUploadMode('url')} className={cn("px-4 py-1 rounded-full text-[10px] font-bold uppercase transition-all", uploadMode === 'url' ? "bg-primary text-white" : "text-text-secondary hover:text-white")}>URL</button>
                                            <button onClick={() => setUploadMode('upload')} className={cn("px-4 py-1 rounded-full text-[10px] font-bold uppercase transition-all", uploadMode === 'upload' ? "bg-primary text-white" : "text-text-secondary hover:text-white")}>File</button>
                                        </div>
                                    </div>

                                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-black/40 border border-white/10 group">
                                        {coverUrl ? (
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={coverUrl}
                                                    alt="Cover"
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                                                    <button onClick={() => setCoverUrl('')} className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all"><Trash2 className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-6 text-center h-full border-2 border-dashed border-white/5 m-2 rounded-2xl">
                                                <ImageIcon className="w-10 h-10 text-white/5 mb-3" />
                                                <p className="text-[9px] text-text-secondary font-bold uppercase tracking-[0.2em]">Broadcast Visual Required</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative">
                                        {uploadMode === 'url' ? (
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"><Plus className="w-full h-full" /></div>
                                                <input
                                                    type="text"
                                                    placeholder="SOURCE URL..."
                                                    value={coverUrl}
                                                    onChange={(e) => setCoverUrl(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-[10px] font-bold tracking-widest outline-none focus:border-primary/50 transition-all uppercase"
                                                />
                                            </div>
                                        ) : (
                                            <div className="relative group/upload">
                                                <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isUploading} />
                                                <div className={cn("bg-white/5 border border-white/5 rounded-2xl py-4 px-6 flex items-center justify-center gap-3 transition-all", isUploading ? "opacity-30" : "group-hover/upload:border-primary group-hover/upload:bg-primary/5")}>
                                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
                                                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{isUploading ? 'SYNCING...' : 'UPLOAD SOURCE'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Executive Summary */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Technical abstract</label>
                                    <textarea
                                        placeholder="Summarize the core directive of this briefing..."
                                        value={excerpt}
                                        onChange={(e) => setExcerpt(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-3xl p-6 text-xs outline-none focus:border-primary/50 transition-all min-h-[140px] resize-none font-medium leading-relaxed italic"
                                    />
                                </div>

                                {/* Tech Stack */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Associated Core Technologies</label>
                                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            {techs.map(t => (
                                                <span key={t} className="bg-primary/10 text-primary text-[9px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 border border-primary/20 group/tag">
                                                    {t}
                                                    <button onClick={() => setTechs(techs.filter(x => x !== t))} className="hover:text-white transition-colors">×</button>
                                                </span>
                                            ))}
                                            {techs.length === 0 && <span className="text-[9px] text-text-secondary font-bold uppercase tracking-widest opacity-30 italic">No nodes linked...</span>}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="ADD NODE + ENTER"
                                            value={newTech}
                                            onChange={(e) => setNewTech(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newTech) {
                                                    setTechs([...new Set([...techs, newTech])])
                                                    setNewTech('')
                                                    e.preventDefault()
                                                }
                                            }}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-[10px] font-bold outline-none focus:border-primary/30 transition-all tracking-widest uppercase"
                                        />
                                    </div>
                                </div>

                                {/* Resources */}
                                <div className="space-y-4 pb-20">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Extracted Intelligence Nodes</label>
                                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
                                        <div className="space-y-2">
                                            {resources.map((r, i) => (
                                                <div key={i} className="flex items-center justify-between text-[9px] bg-black/40 rounded-xl p-3 border border-white/5 group/res">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white truncate max-w-[200px] uppercase tracking-tighter italic">{r.title}</span>
                                                        <span className="text-[8px] text-text-secondary truncate max-w-[200px] font-mono opacity-50">{r.url}</span>
                                                    </div>
                                                    <button onClick={() => setResources(resources.filter((_, idx) => idx !== i))} className="text-text-secondary hover:text-red-500 p-2 opacity-0 group-hover/res:opacity-100 transition-all">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {resources.length === 0 && <span className="text-[9px] text-text-secondary font-bold uppercase tracking-widest opacity-30 italic">No external nodes...</span>}
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                            <input type="text" placeholder="NODE TITLE" value={newResourceTitle} onChange={(e) => setNewResourceTitle(e.target.value)} className="w-full bg-black/20 text-[9px] font-bold p-3 rounded-xl border border-white/5 outline-none tracking-widest" />
                                            <div className="flex gap-2">
                                                <input type="text" placeholder="SOURCE URL" value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)} className="flex-1 bg-black/20 text-[9px] font-bold p-3 rounded-xl border border-white/5 outline-none tracking-widest font-mono" />
                                                <button
                                                    onClick={() => {
                                                        if (newResourceTitle && newResourceUrl) {
                                                            setResources([...resources, { title: newResourceTitle, url: newResourceUrl }])
                                                            setNewResourceTitle('')
                                                            setNewResourceUrl('')
                                                        }
                                                    }}
                                                    className="w-12 rounded-xl bg-primary flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-lg shadow-primary/20"
                                                >
                                                    <Plus className="w-4 h-4 font-bold" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
