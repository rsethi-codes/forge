'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserManagementData, restoreRoadmap } from '@/lib/actions/admin'
import {
    ArrowLeft,
    Book,
    Trash2,
    RefreshCcw,
    ChevronRight,
    Calendar,
    Zap,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

export default function UserInspectionPage() {
    const { userId } = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['admin-user-detail', userId],
        queryFn: () => getUserManagementData(userId as string)
    })

    const restoreMutation = useMutation({
        mutationFn: (roadmapId: string) => restoreRoadmap(roadmapId),
        onSuccess: () => {
            toast.success('Roadmap Restored to Primary Sequence')
            queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] })
        }
    })

    if (isLoading) return <div className="p-20 text-center">Interrogating Database...</div>

    return (
        <div className="space-y-12">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-text-secondary hover:text-red-500 transition-colors text-[10px] font-black uppercase tracking-widest group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Directory
            </button>

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.4em]">Section: Profile Inspection</p>
                    <h1 className="text-5xl font-syne font-black tracking-tighter">{data?.profile?.fullName || 'Unknown Operative'}</h1>
                    <p className="text-text-secondary font-mono text-xs">{data?.profile?.email}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left: Programs & Progress */}
                <div className="lg:col-span-2 space-y-8">
                    <h2 className="text-xl font-syne font-bold uppercase tracking-tight flex items-center gap-2">
                        <Book className="w-5 h-5 text-red-500" /> Authorized Roadmap Sequences
                    </h2>

                    <div className="space-y-4">
                        {data?.roadmaps.map((rm: any) => (
                            <div
                                key={rm.id}
                                className={cn(
                                    "bg-[#0c0c0c] border p-8 rounded-[2.5rem] relative overflow-hidden group transition-all",
                                    rm.deletedAt ? "border-red-500/20 opacity-60 hover:opacity-100" : "border-white/5 hover:border-red-500/20"
                                )}
                            >
                                {rm.deletedAt && (
                                    <div className="absolute top-0 right-0 p-6 flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 rounded-bl-[2rem]">
                                        <AlertTriangle className="w-3 h-3" /> Soft-Deleted Trace Detected
                                    </div>
                                )}

                                <div className="flex justify-between items-start">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-syne font-bold">{rm.title}</h3>
                                            <div className="flex items-center gap-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                                <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                                                    <Calendar className="w-3 h-3" /> Started: {new Date(rm.startDate).toLocaleDateString()}
                                                </span>
                                                {rm.isActive && (
                                                    <span className="text-success flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Active Protocol
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
                                            {rm.description || 'No detailed briefing provided for this sequence.'}
                                        </p>
                                    </div>

                                    {rm.deletedAt ? (
                                        <button
                                            onClick={() => restoreMutation.mutate(rm.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-2xl shadow-red-500/20"
                                        >
                                            <RefreshCcw className="w-4 h-4 animate-spin-slow" /> Restore Record
                                        </button>
                                    ) : (
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                                            <Zap className="w-5 h-5 text-text-secondary" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Metadata & Control */}
                <div className="space-y-8">
                    <h2 className="text-xl font-syne font-bold uppercase tracking-tight">Administrative Control</h2>

                    <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Global Status Override</h3>
                            <div className="flex flex-col gap-2">
                                <button className="w-full py-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                                    Shadow Ban (Disabled)
                                </button>
                                <button className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                                    Terminate Access (Disabled)
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 space-y-4">
                            <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-widest border-t border-white/5 pt-6">Inspection Logs</h3>
                            <div className="space-y-3">
                                {[
                                    { event: 'Profile Viewed', time: 'Just now' },
                                    { event: 'Roadmap Audit', time: '2 mins ago' },
                                ].map((log, i) => (
                                    <div key={i} className="flex justify-between items-center text-[9px] font-bold">
                                        <span className="text-text-secondary uppercase">{log.event}</span>
                                        <span className="text-red-500">{log.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
