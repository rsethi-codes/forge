'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
    ArrowLeft,
    CheckCircle2,
    ExternalLink,
    ShieldAlert,
    Undo2,
    Maximize2,
    Minimize2,
    MessageCircleQuestion,
    Zap,
    Circle,
    Timer,
    ChevronDown
} from 'lucide-react'
import QnADrawer, { type DrawerTopic } from '@/components/QnADrawer'
import { toggleTaskCompletion } from '@/lib/actions/day'
import { toast } from 'react-hot-toast'

export default function DocsReaderClient(props: {
    dayNumber: string
    dayTitle: string
    dayId: string
    docId: string
    docMeta: any
    html: string | null
    externalUrl: string
    iframeRef?: React.RefObject<HTMLIFrameElement>
    tasks?: any[]
    topics?: any[]
    progress: any
}) {
    const {
        dayNumber,
        dayTitle,
        dayId,
        docId,
        docMeta,
        html,
        externalUrl,
        iframeRef: propIframeRef,
        tasks = [],
        topics = [],
        progress
    } = props

    const internalIframeRef = useRef<HTMLIFrameElement | null>(null)
    const iframeRef = propIframeRef || internalIframeRef
    const [loadedAt] = useState(() => new Date())
    const [sessionKey] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`)

    const [marking, setMarking] = useState<'done' | 'undone' | null>(null)
    const [autoDoneFired, setAutoDoneFired] = useState(false)
    const [activeSeconds, setActiveSeconds] = useState(0)
    const [scrollPct, setScrollPct] = useState(0)
    const [sectionsSeen, setSectionsSeen] = useState<Set<string>>(() => new Set())
    const [requiredSeen, setRequiredSeen] = useState<Set<string>>(() => new Set())
    const [toc, setToc] = useState<Array<{ id: string; title: string; level: number }>>([])
    const [activeSection, setActiveSection] = useState<string | null>(null)

    // UI STATES
    const [isZenMode, setIsZenMode] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [drawerTopicId, setDrawerTopicId] = useState<string | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    const requiredSections: string[] = useMemo(() =>
        Array.isArray(docMeta?.requiredSections)
            ? docMeta.requiredSections.map((x: any) => String(x)).filter(Boolean)
            : []
        , [docMeta])

    const completionPolicy = (docMeta && typeof docMeta === 'object') ? (docMeta as any).completionPolicy : null

    const sectionMappings: Record<string, { taskId?: string; topicId?: string }> = useMemo(() =>
        docMeta && typeof docMeta === 'object' && docMeta.sectionMappings && typeof docMeta.sectionMappings === 'object'
            ? docMeta.sectionMappings
            : {}
        , [docMeta])

    // Identify active task/topic based on current section
    const activeMapping = activeSection ? sectionMappings[activeSection] : null
    const activeTask = useMemo(() => {
        if (!activeSection) return null
        if (activeMapping?.taskId) return tasks.find(t => t.id === activeMapping.taskId)

        // Match by title
        const currentTitle = toc.find(t => t.id === activeSection)?.title?.toLowerCase() || ''
        if (!currentTitle) return null
        return tasks.find(t => {
            const tt = t.title.toLowerCase()
            return tt.includes(currentTitle) || currentTitle.includes(tt)
        })
    }, [activeMapping, activeSection, tasks, toc])

    const activeTopic = useMemo(() => {
        if (!activeMapping?.topicId) return null
        return topics.find(t => t.id === activeMapping.topicId)
    }, [activeMapping, topics])

    // Convert topics to DrawerTopic format (matches the actual QnADrawerProps)
    const drawerTopics: DrawerTopic[] = useMemo(() => {
        return topics.map(t => ({
            id: t.id,
            title: t.title,
            topicNumber: t.topicNumber,
            qnas: t.qnas || []
        }))
    }, [topics])

    const sendRawDocsEvent = async (type: string, meta: any, idempotencyKey?: string) => {
        const idKey = idempotencyKey
            ? `${idempotencyKey}:${sessionKey}`
            : `raw:${dayNumber}:${sessionKey}:${type}:${meta?.sectionId || meta?.pct || Date.now()}`

        try {
            await fetch('/api/docs/events/bulk', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    dayId,
                    docId,
                    sessionId: null,
                    sentAt: new Date().toISOString(),
                    clientVersion: 'forge-docs-reader@3',
                    idempotencyKey: idKey,
                    events: [{ type, at: new Date().toISOString(), meta: meta || {}, idempotencyKey: idKey }]
                })
            })
            // AESTHETIC SYNC: Poke the dashboard tab for instant refresh
            const syncEvents = ['docs_open', 'docs_done', 'docs_undone', 'docs_heartbeat', 'docs_scroll_milestone', 'docs_section_view']
            if (syncEvents.includes(type)) {
                localStorage.setItem('forge_docs_update', `${type}:${Date.now()}`)
            }
        } catch { }
    }

    const scrollIframeTo = (sectionId: string) => {
        const iframe = iframeRef.current
        if (!iframe?.contentDocument) return
        const win = iframe.contentWindow
        const el = iframe.contentDocument.getElementById(sectionId) || iframe.contentDocument.querySelector(`[name="${sectionId}"]`)
        if (!el || !win) return
        const rect = el.getBoundingClientRect()
        win.scrollTo({ top: Math.max(0, rect.top + win.scrollY - 32), behavior: 'smooth' })
        setActiveSection(sectionId)
    }

    const toggleCompletion = async (isDone: boolean) => {
        const type = isDone ? 'docs_done' : 'docs_undone'
        setMarking(isDone ? 'done' : 'undone')
        try {
            await sendRawDocsEvent(type, { source: 'manual_ui' }, `ui:${type}:${dayNumber}`)
            toast.success(isDone ? 'Day marked as complete!' : 'Progress reset to in-progress')
        } finally {
            setMarking(null)
        }
    }

    const handleToggleTask = async (task: any) => {
        try {
            const nextStatus = task.status === 'done' ? false : true
            await toggleTaskCompletion(task.id, progress.id, nextStatus)
            // AESTHETIC SYNC: Instant dashboard refresh
            localStorage.setItem('forge_docs_update', `task_toggle:${Date.now()}`)
            toast.success(`Task ${nextStatus ? 'done' : 'reset'}!`)
        } catch (error) {
            toast.error('Sync failed')
        }
    }

    // HEARTBEAT & TRACKING
    useEffect(() => {
        if (!html) return
        const start = Date.now()
        const timer = setInterval(() => setActiveSeconds(prev => prev + 1), 1000)

        // 30s Heartbeat for Active Time & Pulse
        const heartbeat = setInterval(() => {
            sendRawDocsEvent('docs_heartbeat', { increment: 30 }, `beat:${dayNumber}:${sessionKey}:${Math.floor(Date.now() / 30000)}`)
        }, 30000)

        sendRawDocsEvent('docs_open', { url: window.location.href }, `open:${dayNumber}`)

        return () => {
            clearInterval(timer)
            clearInterval(heartbeat)
            const final = Math.floor((Date.now() - start) / 1000)
            sendRawDocsEvent('docs_close', { activeSeconds: final }, `close:${dayNumber}:${start}`)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [html])

    // IFRAME INTEGRATION
    useEffect(() => {
        if (!html) return
        const iframe = iframeRef.current
        if (!iframe) return

        let localLastMark = -1
        const milestones = [10, 25, 50, 75, 90, 100]

        const onLoad = () => {
            const doc = iframe.contentDocument; const win = iframe.contentWindow
            if (!doc || !win) return

            // 1. Map TOC
            const hs = Array.from(doc.querySelectorAll('h1,h2,h3,h4')) as HTMLElement[]
            setToc(hs.map(h => ({
                id: h.id || h.getAttribute('name') || '',
                title: h.textContent?.trim().slice(0, 120) || '',
                level: (h.tagName === 'H1' ? 1 : h.tagName === 'H2' ? 2 : h.tagName === 'H3' ? 3 : 4)
            })).filter(t => t.id))

            // 2. Scroll Logic
            const onScroll = () => {
                const docEl = doc.documentElement
                const h = Math.max(docEl.scrollHeight, doc.body.scrollHeight)
                const v = win.innerHeight || docEl.clientHeight
                const s = win.scrollY || docEl.scrollTop
                const pct = Math.min(100, Math.round((s / Math.max(h - v, 1)) * 100))
                setScrollPct(pct)
                milestones.forEach(m => {
                    if (pct >= m && localLastMark < m) {
                        localLastMark = m
                        sendRawDocsEvent('docs_scroll_milestone', { pct: m }, `scroll:${dayNumber}:${m}`)
                    }
                })
            }
            win.addEventListener('scroll', onScroll, { passive: true })

            // 3. Section Observation
            if ('IntersectionObserver' in window) {
                const obs = new IntersectionObserver((es) => {
                    es.forEach(e => {
                        if (!e.isIntersecting) return
                        const id = e.target.id || e.target.getAttribute('name')
                        if (!id) return
                        setActiveSection(id)
                        setSectionsSeen(prev => {
                            if (prev.has(id)) return prev
                            const nx = new Set(prev); nx.add(id)
                            const title = (e.target.textContent || '').trim().slice(0, 100)
                            sendRawDocsEvent('docs_section_view', { sectionId: id, title }, `seen:${dayNumber}:${id}`)
                            return nx
                        })
                        if (requiredSections.includes(id)) setRequiredSeen(prev => new Set(prev).add(id))
                    })
                }, { threshold: 0.6 })
                hs.forEach(h => obs.observe(h))
            }
            setIsLoaded(true)
        }

        iframe.addEventListener('load', onLoad)
        return () => iframe.removeEventListener('load', onLoad)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [html, dayNumber, requiredSections])

    if (!html) return (
        <div className="h-screen bg-black flex items-center justify-center p-8 text-center">
            <div className="max-w-md space-y-6">
                <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto animate-pulse" />
                <h1 className="text-2xl font-bold font-syne uppercase tracking-wider">Docs Unavailable</h1>
                <p className="text-white/40 text-sm">Forge couldn&apos;t render this document natively. Use the fallback below.</p>
                <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-all">
                    <ExternalLink className="w-4 h-4" /> Open Source Code
                </a>
            </div>
        </div>
    )

    return (
        <div className={cn(
            "h-screen w-screen overflow-hidden bg-[#050505] relative flex flex-col transition-colors duration-1000 select-none",
            isZenMode && "bg-black"
        )}>
            {/* Reading Progress Bar (Topmost) */}
            <div className="fixed top-0 left-0 right-0 h-1 z-[60] bg-white/5 pointer-events-none">
                <motion.div className="h-full bg-primary" animate={{ width: `${scrollPct}%` }} transition={{ type: 'spring', damping: 25, stiffness: 120 }} />
            </div>

            {/* Zen Dimmer Layer */}
            <AnimatePresence>
                {isZenMode && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 pointer-events-none z-10" />
                )}
            </AnimatePresence>

            {/* Main Action Layer */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* 1. Header & Controls */}
                <div className="absolute left-6 top-6 z-40 flex items-center gap-3">
                    <Link href={`/tracker/day/${dayNumber}`} className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white backdrop-blur-2xl transition-all">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exit Reader</span>
                    </Link>
                    <button
                        onClick={() => setIsZenMode(!isZenMode)}
                        className={cn(
                            "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all backdrop-blur-2xl",
                            isZenMode ? "bg-primary border-primary text-white shadow-[0_0_30px_rgba(var(--primary),0.3)]" : "bg-white/5 border-white/5 text-white/50 hover:text-white"
                        )}
                    >
                        {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isZenMode ? 'Exit Zen' : 'Zen View'}</span>
                    </button>
                </div>

                {/* 2. Liquid Glass Header (Hover Reveal) */}
                <div className="fixed top-0 left-0 right-0 h-32 z-30 group pointer-events-none">
                    <div className="max-w-4xl mx-auto px-4 pt-6 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto">
                        <div className="rounded-[2.5rem] border border-white/10 bg-black/80 backdrop-blur-3xl p-5 flex items-center justify-between shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
                            <div className="flex items-center gap-5 pl-2">
                                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-primary">
                                    <Timer className="w-6 h-6" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/20">Active Insight</div>
                                    <div className="text-base font-bold text-white flex items-center gap-3 font-mono">
                                        {Math.floor(activeSeconds / 60)}:{(activeSeconds % 60).toString().padStart(2, '0')}
                                        <span className="text-white/10">|</span>
                                        <span className="text-primary">{scrollPct}% scrolled</span>
                                        <span className="text-white/10">|</span>
                                        <span className="text-emerald-400">{sectionsSeen.size} <span className="text-[10px] uppercase font-syne">Sections</span></span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleCompletion(marking === 'done' ? false : true)}
                                disabled={marking !== null}
                                className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                {marking === 'done' ? 'Undone Day' : 'Mark Day Done'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Contextual Floating Chip */}
                <AnimatePresence>
                    {(activeTask || activeTopic) && !isZenMode && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-2 rounded-full bg-black/90 border border-white/10 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
                        >
                            {activeTask && (
                                <button
                                    onClick={() => handleToggleTask(activeTask)}
                                    className={cn(
                                        "flex items-center gap-3 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                        activeTask.status === 'done' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-primary text-white hover:scale-105"
                                    )}
                                >
                                    {activeTask.status === 'done' ? <Zap className="w-4 h-4 fill-current" /> : <Circle className="w-4 h-4" />}
                                    {activeTask.status === 'done' ? 'Task Fixed' : `Complete ${activeTask.title.slice(0, 24)}...`}
                                </button>
                            )}
                            {activeTopic && (
                                <button
                                    onClick={() => { setDrawerTopicId(activeTopic.id); setDrawerOpen(true); }}
                                    className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 text-white/70 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10"
                                >
                                    <MessageCircleQuestion className="w-4 h-4" />
                                    Deep Dive
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 4. CONTENT VIEWPORT (FIXED SHRINKAGE) */}
                <div className={cn(
                    "flex-1 w-full bg-white transition-all duration-1000 ease-in-out relative z-20 overflow-hidden",
                    isZenMode ? "max-w-4xl mx-auto shadow-[0_0_200px_rgba(0,0,0,0.95)] my-0" : "my-0"
                )}>
                    {/* Centered loader for initial docs fetch */}
                    <AnimatePresence>
                        {(!isLoaded || !html) && (
                            <motion.div exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-white z-[25]">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <iframe
                        ref={iframeRef}
                        title="Forge Content"
                        className="w-full h-full border-none"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                        srcDoc={html ? `
                            <style>
                                * { max-width: 100% !important; box-sizing: border-box !important; }
                                body { margin: 0 !important; padding: 0 !important; width: 100% !important; overflow-x: hidden; background: transparent !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; }
                                .container, .content-container, #main-content, .article-content, .documentation-content, main, article { max-width: 100% !important; margin: 0 !important; width: 100% !important; padding: 3rem 2rem !important; }
                                /* Aggressive Distraction Removal */
                                nav, header, footer, aside, .sidebar, .nav-links, .table-of-contents-sidebar, .edit-link, .feedback-btn, .github-link, #gh-link, .next-article, .prev-article { display: none !important; }
                                h1, h2, h3, h4 { scroll-margin-top: 100px; color: #111 !important; }
                                p, li { line-height: 1.8 !important; color: #333 !important; font-size: 17px !important; }
                                pre, code { background: #f5f5f5 !important; border-radius: 8px !important; }
                            </style>
                            ${html}
                        ` : ''}
                    />
                </div>
            </div>

            {/* QnA Integration */}
            <QnADrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                dayId={dayId}
                dayTitle={dayTitle}
                dayNumber={dayNumber}
                topics={drawerTopics}
                defaultTopicId={drawerTopicId}
            />
        </div>
    )
}
