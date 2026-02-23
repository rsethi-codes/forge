'use client'

import React from 'react'
import { Plus, Building2, Briefcase, Calendar, ExternalLink, ChevronRight, Search, Filter, Loader2, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getJaneApplications, addJaneApplication, addJaneCompany, updateApplicationStatus, getJaneCompanies } from '@/lib/actions/jane'

const STATUS_CONFIG: Record<string, { label: string, color: string, bg: string }> = {
    wishlist: { label: 'Wishlist', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' },
    applied: { label: 'Applied', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)' },
    interviewing: { label: 'Interviewing', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    offer: { label: 'Offer', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    ghosted: { label: 'Ghosted', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
}

export default function JanePage() {
    const [apps, setApps] = React.useState<any[]>([])
    const [companies, setCompanies] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)

    React.useEffect(() => {
        const load = async () => {
            const [fetchedApps, fetchedCompanies] = await Promise.all([
                getJaneApplications(),
                getJaneCompanies()
            ])
            setApps(fetchedApps)
            setCompanies(fetchedCompanies)
            setIsLoading(false)
        }
        load()
    }, [])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-primary mb-2">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Target className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-[0.2em]">Recruitment Intel</span>
                    </div>
                    <h1 className="text-5xl font-syne font-bold tracking-tight">JANE</h1>
                    <p className="text-text-secondary text-lg max-w-xl">Job Application Network Engine. Track targets, crush interviews, and secure the 20-35 LPA bag.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-4 bg-surface border border-border-subtle rounded-2xl hover:border-primary/50 transition-all font-bold text-sm">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-primary hover:bg-red-600 text-white rounded-2xl transition-all font-bold shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" />
                        New Application
                    </button>
                </div>
            </div>

            {/* Application Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {apps.length === 0 ? (
                    <div className="col-span-full py-20 bg-surface/50 border border-dashed border-border-subtle rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4">
                        <div className="p-4 bg-surface rounded-3xl border border-border-subtle shadow-xl">
                            <Briefcase className="w-8 h-8 text-text-secondary" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-xl">No Applications Tracked</h3>
                            <p className="text-text-secondary max-w-xs">Start your hunt by adding your first target company and role.</p>
                        </div>
                    </div>
                ) : (
                    apps.map((app) => (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface border border-border-subtle p-6 rounded-[2rem] hover:border-primary/30 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-colors"></div>

                            <div className="relative z-10 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-[#111] border border-border-subtle flex items-center justify-center p-2">
                                            {app.company.logoUrl ? (
                                                <img src={app.company.logoUrl} alt={app.company.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <Building2 className="w-6 h-6 text-text-secondary" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight">{app.company.name}</h3>
                                            <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold group-hover:text-primary transition-colors">
                                                {app.roleTitle}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                        style={{ backgroundColor: STATUS_CONFIG[app.status]?.bg, color: STATUS_CONFIG[app.status]?.color }}
                                    >
                                        {STATUS_CONFIG[app.status]?.label}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between text-xs text-text-secondary">
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Added {new Date(app.createdAt).toLocaleDateString()}
                                        </span>
                                        {app.salaryRange && (
                                            <span className="font-bold text-text-primary px-2 py-0.5 bg-surface-elevated rounded-md border border-border-subtle">
                                                {app.salaryRange}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {app.jobUrl && (
                                            <a
                                                href={app.jobUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-[#111] hover:bg-[#161616] border border-border-subtle rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors"
                                            >
                                                Job Post
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors">
                                            Details
                                            <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}
