'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const dynamic = 'force-dynamic'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Shield, Trash2, Zap, Calendar, ArrowRight, Edit2, Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { listRoadmaps, setActiveRoadmap, deleteRoadmap, updateRoadmapTitle } from '@/lib/actions/roadmap-mgmt'
import { cn } from '@/lib/utils'

export default function SetupPage() {
    const [file, setFile] = useState<File | null>(null)
    const [parsing, setParsing] = useState(false)
    const [progress, setProgress] = useState<{ step: number, message: string }>({ step: 0, message: '' })
    const [error, setError] = useState<string | null>(null)
    const [roadmaps, setRoadmaps] = useState<any[]>([])
    const [loadingRoadmaps, setLoadingRoadmaps] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const router = useRouter()

    useEffect(() => {
        loadRoadmaps()
    }, [])

    const loadRoadmaps = async () => {
        setLoadingRoadmaps(true)
        const data = await listRoadmaps()
        setRoadmaps(data)
        setLoadingRoadmaps(false)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setError(null)
        }
    }

    const handleUpload = async () => {
        if (!file) return
        setParsing(true)
        setError(null)

        try {
            // Step 1: Upload & Extract
            setProgress({ step: 1, message: 'Uploading and extracting content...' })
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/parse-roadmap', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.message || 'Failed to parse roadmap')
            }

            setProgress({ step: 2, message: 'Analyzing structure & hierarchical mapping...' })
            await new Promise(r => setTimeout(r, 1500)) // Artificial delay for UX

            setProgress({ step: 3, message: 'Seeding database with program data...' })
            await new Promise(r => setTimeout(r, 1000))

            setProgress({ step: 4, message: 'Done! Redirecting to dashboard...' })
            await new Promise(r => setTimeout(r, 800))

            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message)
            setParsing(false)
        }
    }

    const handleActivate = async (id: string) => {
        await setActiveRoadmap(id)
        loadRoadmaps()
        router.refresh()
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this roadmap and all associated progress? This cannot be undone.')) {
            await deleteRoadmap(id)
            loadRoadmaps()
        }
    }

    const handleRename = async (id: string) => {
        if (!editTitle.trim()) return
        await updateRoadmapTitle(id, editTitle)
        setEditingId(null)
        loadRoadmaps()
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 py-20">
            <div className="max-w-4xl w-full space-y-12">
                <div className="flex items-center gap-3 justify-center">
                    <Shield className="w-10 h-10 text-primary" />
                    <h1 className="text-4xl font-syne font-bold tracking-tighter">FORGE ARMORY</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Roadmap Management Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-syne font-bold uppercase tracking-tight">Active Programs</h2>
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{roadmaps.length} Programs Loaded</span>
                        </div>

                        {loadingRoadmaps ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-surface border border-border-subtle rounded-3xl space-y-3">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <span className="text-[10px] font-bold text-text-secondary uppercase">Accessing Files...</span>
                            </div>
                        ) : roadmaps.length === 0 ? (
                            <div className="text-center py-20 bg-surface border border-border-subtle rounded-3xl border-dashed">
                                <p className="text-text-secondary text-sm px-10">No programs initialized. Upload a roadmap to begin your journey.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {roadmaps.map((rm) => (
                                    <div
                                        key={rm.id}
                                        className={cn(
                                            "bg-surface border p-6 rounded-[2rem] transition-all group",
                                            rm.isActive ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5" : "border-border-subtle hover:border-primary/30"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1 mr-4">
                                                {editingId === rm.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            autoFocus
                                                            className="bg-surface-elevated border border-primary/50 text-text-primary px-3 py-1 rounded-lg text-sm font-syne font-bold w-full outline-none focus:ring-1 ring-primary"
                                                            value={editTitle}
                                                            onChange={(e) => setEditTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleRename(rm.id)
                                                                if (e.key === 'Escape') setEditingId(null)
                                                            }}
                                                        />
                                                        <button onClick={() => handleRename(rm.id)} className="text-success hover:scale-110 transition-transform"><Check className="w-4 h-4" /></button>
                                                        <button onClick={() => setEditingId(null)} className="text-text-secondary hover:scale-110 transition-transform"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 group/title">
                                                        <h3 className="font-syne font-bold text-lg group-hover:text-primary transition-colors">{rm.title}</h3>
                                                        <button
                                                            onClick={() => { setEditingId(rm.id); setEditTitle(rm.title); }}
                                                            className="opacity-0 group-hover/title:opacity-100 text-text-secondary hover:text-primary transition-all"
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                                                    <Calendar className="w-3 h-3" /> {new Date(rm.startDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {rm.isActive && (
                                                <div className="bg-primary text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest flex-shrink-0">Active</div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            {!rm.isActive && (
                                                <button
                                                    onClick={() => handleActivate(rm.id)}
                                                    className="flex-1 bg-white/5 hover:bg-primary hover:text-white border border-border-subtle hover:border-primary text-text-primary py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Zap className="w-3 h-3" /> Ignite
                                                </button>
                                            )}
                                            {rm.isActive && (
                                                <Link href="/dashboard" className="flex-1 bg-primary hover:bg-red-600 text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                                    Current Focus <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => handleDelete(rm.id)}
                                                className="p-3 bg-white/5 hover:bg-red-500/10 hover:text-red-500 border border-border-subtle hover:border-red-500/30 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upload Section */}
                    <div className="space-y-6">
                        <div className="bg-surface border border-border-subtle rounded-3xl p-8 shadow-2xl relative overflow-hidden h-full flex flex-col justify-center">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

                            <AnimatePresence mode="wait">
                                {!parsing ? (
                                    <motion.div
                                        key="upload"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="space-y-8"
                                    >
                                        <div className="text-center">
                                            <h2 className="text-2xl font-syne font-bold mb-4">Initialize New</h2>
                                            <p className="text-text-secondary text-sm max-w-xs mx-auto">
                                                Upload a new 60-day roadmap file (DOCX/PDF/JSON). It will automatically become your active program.
                                            </p>
                                        </div>

                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept=".docx,.pdf,.json"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className={`
                                                border-2 border-dashed rounded-[2.5rem] p-10 text-center transition-all
                                                ${file ? 'border-success bg-success/5' : 'border-border-subtle hover:border-primary/50 bg-[#0c0c0c]'}
                                            `}>
                                                <div className="flex flex-col items-center">
                                                    {file ? (
                                                        <>
                                                            <CheckCircle2 className="w-12 h-12 text-success mb-3" />
                                                            <p className="text-text-primary font-bold text-sm truncate max-w-[200px]">{file.name}</p>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                                className="mt-2 text-[10px] text-primary font-bold hover:underline"
                                                            >
                                                                Remove
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                                <Upload className="w-7 h-7 text-primary" />
                                                            </div>
                                                            <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Drop or Click</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            disabled={!file}
                                            onClick={handleUpload}
                                            className="w-full bg-primary hover:bg-red-600 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-sm uppercase tracking-widest"
                                        >
                                            <FileText className="w-5 h-5" />
                                            Forge Program
                                        </button>

                                        {error && (
                                            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center gap-3 text-primary text-[10px] font-bold uppercase tracking-widest">
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                {error}
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="parsing"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="py-10 flex flex-col items-center text-center space-y-8"
                                    >
                                        <div className="relative">
                                            <Loader2 className="w-16 h-16 text-primary animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[10px] font-bold font-syne">{progress.step * 25}%</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-xl font-syne font-bold uppercase tracking-tighter">Forge Igniting...</h3>
                                            <p className="text-text-secondary text-xs flex items-center gap-2 justify-center italic">
                                                {progress.message}
                                            </p>
                                        </div>

                                        <div className="w-full max-w-xs space-y-3">
                                            {[1, 2, 3, 4].map((s) => (
                                                <div key={s} className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[8px] font-bold transition-colors ${progress.step >= s ? 'bg-success border-success text-white' : 'border-border-subtle text-text-secondary'
                                                        }`}>
                                                        {progress.step > s ? '✓' : s}
                                                    </div>
                                                    <div className={`h-[1px] flex-1 rounded-full transition-colors ${progress.step >= s ? 'bg-success/50' : 'bg-border-subtle'
                                                        }`} />
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary px-6">
                    <span>Synchronized Neural Architecture v2.0</span>
                    <span>Multi-Program Management Active</span>
                </div>
            </div>
        </div>
    )
}
