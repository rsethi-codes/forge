'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ForgeLoader(props: {
    title?: string
    subtitle?: string
    className?: string
    size?: 'sm' | 'md' | 'lg'
}) {
    const { title = 'Loading', subtitle, className, size = 'md' } = props

    const iconSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7'
    const titleClass = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-xs' : 'text-[11px]'

    return (
        <div className={cn('min-h-[50vh] flex items-center justify-center p-6', className)}>
            <div className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_30px_120px_rgba(0,0,0,0.55)] px-8 py-10 flex flex-col items-center gap-4">
                <Loader2 className={cn(iconSize, 'text-primary animate-spin')} />
                <div className="text-center space-y-1">
                    <div className={cn('font-black uppercase tracking-[0.35em] text-text-secondary', titleClass)}>{title}</div>
                    {subtitle && (
                        <div className="text-[11px] text-text-secondary/60 max-w-sm">{subtitle}</div>
                    )}
                </div>
                <div className="w-44 h-2 rounded-full bg-black/30 border border-white/5 overflow-hidden">
                    <div className="h-full w-2/5 bg-primary/40 animate-pulse" />
                </div>
            </div>
        </div>
    )
}
