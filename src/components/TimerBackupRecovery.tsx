'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, CloudOff, X } from 'lucide-react'
import { syncTimerState } from '@/lib/actions/day'

interface BackupEntry {
    key: string
    data: {
        status: 'idle' | 'running' | 'paused'
        timeSpent: number
        timeSpentNet: number
        sessions: Array<{ start: string; end: string }>
        savedAt: string
    }
    type: 'task' | 'topic'
    id: string
    progressId: string
}

function parseBackupKey(key: string): { type: 'task' | 'topic'; id: string; progressId: string } | null {
    // key format: forge_timer_{type}_{id}_{progressId}
    const stripped = key.replace('forge_timer_', '')
    const parts = stripped.split('_')
    if (parts.length < 3) return null
    const type = parts[0] as 'task' | 'topic'
    if (type !== 'task' && type !== 'topic') return null
    // id is a UUID (5 groups), progressId is a UUID (5 groups)
    // The key is: type_part1-part2-part3-part4-part5_part1-part2-part3-part4-part5
    // But UUIDs have dashes, so split by _ is tricky. Use a different separator.
    // Actually format is: {type}_{id}_{progressId} where id and progressId are UUIDs
    // UUIDs have format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    // So we split on the first _ and then try to get two UUIDs
    const rest = stripped.slice(type.length + 1)
    // A UUID is 36 chars: 8-4-4-4-12
    if (rest.length < 73) return null // 36 + 1 + 36
    const id = rest.slice(0, 36)
    const progressId = rest.slice(37, 73)
    return { type, id, progressId }
}

export function TimerBackupRecovery() {
    const [backups, setBackups] = useState<BackupEntry[]>([])
    const [isRestoring, setIsRestoring] = useState(false)
    const [restored, setRestored] = useState(false)

    useEffect(() => {
        // Scan localStorage for any forge_timer_* entries
        const found: BackupEntry[] = []
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (!key?.startsWith('forge_timer_')) continue
                try {
                    const raw = localStorage.getItem(key)
                    if (!raw) continue
                    const data = JSON.parse(raw)
                    const parsed = parseBackupKey(key)
                    if (!parsed) continue
                    // Only show backups less than 24 hours old
                    const savedAt = new Date(data.savedAt)
                    const ageHours = (Date.now() - savedAt.getTime()) / 3600000
                    if (ageHours > 24) {
                        localStorage.removeItem(key)
                        continue
                    }
                    found.push({ key, data, ...parsed })
                } catch { }
            }
        } catch { }
        setBackups(found)
    }, [])

    const handleRestore = async () => {
        setIsRestoring(true)
        let successCount = 0
        for (const backup of backups) {
            try {
                await syncTimerState(backup.type, backup.id, backup.progressId, 'idle', {
                    timeSpent: backup.data.timeSpent,
                    timeSpentNet: backup.data.timeSpentNet,
                    sessions: backup.data.sessions,
                })
                localStorage.removeItem(backup.key)
                successCount++
            } catch (err) {
                console.error('Failed to restore backup:', backup.key, err)
            }
        }
        setIsRestoring(false)
        if (successCount > 0) {
            setRestored(true)
            setBackups([])
            setTimeout(() => setRestored(false), 5000)
        }
    }

    const handleDismiss = () => {
        // Clear the backups from localStorage and hide
        backups.forEach(b => localStorage.removeItem(b.key))
        setBackups([])
    }

    if (restored) {
        return (
            <div className="fixed bottom-24 right-4 z-50 bg-emerald-900/80 border border-emerald-500/30 rounded-2xl p-4 shadow-xl max-w-sm backdrop-blur animate-in fade-in slide-in-from-bottom-4">
                <p className="text-sm font-bold text-emerald-300">✓ Timer data restored successfully</p>
            </div>
        )
    }

    if (backups.length === 0) return null

    const formatMinutes = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        return `${m}m`
    }

    return (
        <div className="fixed bottom-24 right-4 z-50 bg-[#111] border border-amber-500/30 rounded-2xl p-4 shadow-2xl max-w-sm backdrop-blur animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-start gap-3">
                <CloudOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm font-bold text-amber-300">Unsaved Timer Data Found</p>
                    <p className="text-xs text-text-secondary mt-1">
                        {backups.length} item{backups.length > 1 ? 's' : ''} weren't saved to the server last session.
                        Total: {formatMinutes(backups.reduce((a, b) => a + b.data.timeSpentNet, 0))} of work.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                        <button
                            onClick={handleRestore}
                            disabled={isRestoring}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3 h-3 ${isRestoring ? 'animate-spin' : ''}`} />
                            {isRestoring ? 'Restoring...' : 'Restore Now'}
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary text-xs font-bold hover:bg-white/10 transition-all"
                        >
                            Discard
                        </button>
                    </div>
                </div>
                <button onClick={handleDismiss} className="text-text-secondary hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
