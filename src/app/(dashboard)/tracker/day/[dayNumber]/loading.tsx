import React from 'react'
import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">Syncing Day Parameters...</p>
        </div>
    )
}
