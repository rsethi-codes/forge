'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

export const dynamic = 'force-dynamic'
import { ArrowLeft, Save, Globe, Lock, Eye, Settings, Image as ImageIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
            <header className="h-20 border-b border-border-subtle bg-surface px-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <Link href="/blog/manage" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-bold uppercase tracking-widest text-xs hidden md:inline">Back to Lab</span>
                    </Link>
                    <div className="h-6 w-[1px] bg-border-subtle hidden md:block" />
                    <input
                        type="text"
                        placeholder="Post Title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-transparent text-xl font-syne font-bold outline-none placeholder:text-text-secondary w-full max-w-xl"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-1 p-1 bg-[#0a0a0a] border border-border-subtle rounded-xl mr-4">
                        <button
                            onClick={() => setVisibility('private')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                visibility === 'private' ? "bg-surface-elevated text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                            )}
                        >
                            <Lock className="w-3 h-3" /> Private
                        </button>
                        <button
                            onClick={() => setVisibility('public')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                visibility === 'public' ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-white"
                            )}
                        >
                            <Globe className="w-3 h-3" /> Public
                        </button>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Save Post</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Cover Image</label>
                                <div className="flex bg-[#0a0a0a] rounded-lg p-0.5 border border-border-subtle">
                                    <button
                                        onClick={() => setUploadMode('url')}
                                        className={cn(
                                            "px-2 py-0.5 rounded-md text-[8px] font-bold uppercase transition-all",
                                            uploadMode === 'url' ? "bg-primary text-white" : "text-text-secondary"
                                        )}
                                    >
                                        URL
                                    </button>
                                    <button
                                        onClick={() => setUploadMode('upload')}
                                        className={cn(
                                            "px-2 py-0.5 rounded-md text-[8px] font-bold uppercase transition-all",
                                            uploadMode === 'upload' ? "bg-primary text-white" : "text-text-secondary"
                                        )}
                                    >
                                        Upload
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                {uploadMode === 'url' ? (
                                    <>
                                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                        <input
                                            type="text"
                                            placeholder="https://images.unsplash.com/..."
                                            value={coverUrl}
                                            onChange={(e) => setCoverUrl(e.target.value)}
                                            className="w-full bg-surface border border-border-subtle rounded-xl py-3 px-11 text-sm outline-none focus:border-primary transition-all"
                                        />
                                    </>
                                ) : (
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            disabled={isUploading}
                                        />
                                        <div className={cn(
                                            "bg-surface border border-dashed border-border-subtle rounded-xl py-3 px-4 flex items-center gap-3 transition-all",
                                            isUploading ? "opacity-50" : "group-hover:border-primary/50"
                                        )}>
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <ImageIcon className="w-4 h-4 text-primary" />}
                                            <span className="text-sm text-text-secondary truncate">
                                                {coverUrl ? "Replace Image" : (isUploading ? "Uploading..." : "Click to upload cover photo")}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {coverUrl && uploadMode === 'upload' && (
                                <p className="text-[9px] text-success font-bold uppercase mt-1 flex items-center gap-1">
                                    ✓ Image Uploaded Successfully
                                </p>
                            )}
                        </div>
                        <div className="space-y-2 pt-[14px]">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mt-1">Excerpt</label>
                            <div className="relative mt-2">
                                <Settings className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                <input
                                    type="text"
                                    placeholder="Brief summary for the card..."
                                    value={excerpt}
                                    onChange={(e) => setExcerpt(e.target.value)}
                                    className="w-full bg-surface border border-border-subtle rounded-xl py-3 px-11 text-sm outline-none focus:border-primary transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Technologies</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {techs.map(t => (
                                    <span key={t} className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-2">
                                        {t}
                                        <button onClick={() => setTechs(techs.filter(x => x !== t))} className="hover:text-white">×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add tech (Enter)..."
                                    value={newTech}
                                    onChange={(e) => setNewTech(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newTech) {
                                            setTechs([...new Set([...techs, newTech])])
                                            setNewTech('')
                                            e.preventDefault()
                                        }
                                    }}
                                    className="flex-1 bg-surface border border-border-subtle rounded-xl py-2 px-4 text-xs outline-none focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Related Resources</label>
                            <div className="space-y-2 mb-3">
                                {resources.map((r, i) => (
                                    <div key={i} className="flex items-center justify-between bg-surface border border-border-subtle rounded-xl p-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">{r.title}</span>
                                            <span className="text-[10px] text-text-secondary truncate max-w-xs">{r.url}</span>
                                        </div>
                                        <button onClick={() => setResources(resources.filter((_, idx) => idx !== i))} className="text-text-secondary hover:text-red-500">
                                            <Settings className="w-4 h-4 rotate-45" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    placeholder="Resource Title"
                                    value={newResourceTitle}
                                    onChange={(e) => setNewResourceTitle(e.target.value)}
                                    className="flex-1 bg-surface border border-border-subtle rounded-xl py-2 px-4 text-xs outline-none focus:border-primary transition-all"
                                />
                                <input
                                    type="text"
                                    placeholder="Resource URL"
                                    value={newResourceUrl}
                                    onChange={(e) => setNewResourceUrl(e.target.value)}
                                    className="flex-1 bg-surface border border-border-subtle rounded-xl py-2 px-4 text-xs outline-none focus:border-primary transition-all"
                                />
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        if (newResourceTitle && newResourceUrl) {
                                            setResources([...resources, { title: newResourceTitle, url: newResourceUrl }])
                                            setNewResourceTitle('')
                                            setNewResourceUrl('')
                                        }
                                    }}
                                    className="bg-surface-elevated hover:bg-primary/20 hover:text-primary px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-border-subtle transition-all"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    <TiptapEditor
                        content={content}
                        onChange={(json, htmlString) => {
                            setContent(json)
                            setHtml(htmlString)
                        }}
                    />

                    <div className="h-32" />
                </div>
            </main>
        </div>
    )
}
