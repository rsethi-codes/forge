'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { toast } from 'react-hot-toast'

// Client-rendered page — no force-dynamic needed.
import {
    User,
    Shield,
    Database,
    Bell,
    Trash2,
    Save,
    UserCircle,
    Mail,
    Lock,
    Smartphone,
    AlertTriangle,
    Loader2,
    Clock,
    Zap,
    CheckCircle2,
    Type
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getProfile, updateProfile } from '@/lib/actions/settings'
import { createClient } from '@/lib/supabase/client'
import { getAuthStatus } from '@/lib/actions/auth-status'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'prefs' | 'app'>('profile')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [profile, setProfile] = useState<any>(null)
    const [zenFullscreen, setZenFullscreen] = useState(false)
    const [startWithPomodoro, setStartWithPomodoro] = useState(false)
    const [pomodoroWorkMinutes, setPomodoroWorkMinutes] = useState(25)
    const [pomodoroShortBreakMinutes, setPomodoroShortBreakMinutes] = useState(5)
    const [pomodoroLongBreakMinutes, setPomodoroLongBreakMinutes] = useState(15)
    const [sendingTest, setSendingTest] = useState(false)
    const [resetting, setResetting] = useState(false)
    const [showResetModal, setShowResetModal] = useState(false)
    const [resetPhrase, setResetPhrase] = useState('')

    useEffect(() => {
        loadProfile()
        setZenFullscreen(localStorage.getItem('pomodoro_zen_fullscreen') === 'true')
        setStartWithPomodoro(localStorage.getItem('forge_start_with_pomodoro') !== 'false')
        setPomodoroWorkMinutes(parseInt(localStorage.getItem('pomodoro_work_minutes') || '25', 10) || 25)
        setPomodoroShortBreakMinutes(parseInt(localStorage.getItem('pomodoro_short_break_minutes') || '5', 10) || 5)
        setPomodoroLongBreakMinutes(parseInt(localStorage.getItem('pomodoro_long_break_minutes') || '15', 10) || 15)
    }, [])

    const loadProfile = async () => {
        setLoading(true)
        const { user } = await getAuthStatus()
        if (user?.email) {
            const data = await getProfile(user.email)
            setProfile(data)
        }
        setLoading(false)
    }

    const showSaved = () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleSaveProfile = async () => {
        if (!profile) return
        setSaving(true)
        try {
            await updateProfile(profile.id, {
                fullName: profile.fullName,
                bio: profile.bio,
                headline: profile.headline,
                vanityHandle: profile.vanityHandle,
                githubUrl: profile.githubUrl,
                linkedinUrl: profile.linkedinUrl,
                roleInterested: profile.roleInterested,
                isPublic: profile.isPublic,
                skills: profile.skills || [],
            })
            showSaved()
        } catch (e: any) {
            toast.error(e.message || 'Failed to update profile')
        }
        setSaving(false)
    }

    const handleSavePreferences = async () => {
        if (!profile) return
        setSaving(true)
        await updateProfile(profile.id, {
            emailNotifications: profile.emailNotifications,
            morningDigestTime: profile.morningDigestTime,
            reminderEmailTime: profile.reminderEmailTime,
        })
        setSaving(false)
        showSaved()
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">Accessing System Core...</p>
            </div>
        )
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">
            <header>
                <h1 className="text-4xl font-syne font-bold tracking-tighter">Command Center</h1>
                <p className="text-text-secondary">Configure your identity and system parameters.</p>
            </header>

            <div className="flex flex-col lg:flex-row gap-10">
                <aside className="lg:w-64 space-y-2">
                    {[
                        { id: 'profile', icon: User, label: 'Owner Profile' },
                        { id: 'prefs', icon: Bell, label: 'Preferences' },
                        { id: 'app', icon: Database, label: 'Danger Zone' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                                activeTab === tab.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </aside>

                <main className="flex-1 space-y-8">
                    {activeTab === 'profile' && profile && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pb-20">
                            {/* Card 1: Core Identity */}
                            <section className="bg-surface/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none group-hover:text-primary/10 transition-colors">
                                    <User className="w-32 h-32" />
                                </div>
                                <div className="flex items-center gap-8 relative z-10">
                                    <div className="w-24 h-24 rounded-3xl bg-surface-elevated flex items-center justify-center border border-border-subtle relative group/avatar overflow-hidden shrink-0 shadow-xl">
                                        {profile.avatarUrl ? (
                                            <Image src={profile.avatarUrl} alt="Profile" fill className="object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                                        ) : (
                                            <UserCircle className="w-12 h-12 text-text-secondary" />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-all flex items-center justify-center">
                                            <span className="text-[8px] font-black uppercase text-white">Update</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-syne font-black tracking-tighter uppercase italic">{profile.fullName || 'Unidentified Candidate'}</h3>
                                        <p className="text-sm font-mono text-text-secondary opacity-60 tracking-tight">{profile.email}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase rounded-full tracking-widest">Operator Lvl 1</span>
                                            <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase rounded-full tracking-widest leading-none">Verified Identity</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary flex items-center gap-2">
                                            <Type className="w-3 h-3 text-primary" /> Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.fullName || ''}
                                            onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm outline-none focus:border-primary/50 transition-all font-bold placeholder:text-white/5"
                                            placeholder="Forge Name..."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary flex items-center gap-2">
                                            <Zap className="w-3 h-3 text-primary" /> Professional Headline
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Senior Systems Engineer"
                                            value={profile.headline || ''}
                                            onChange={e => setProfile({ ...profile, headline: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm outline-none focus:border-primary/50 transition-all font-bold placeholder:text-white/5"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Card 2: Neural Presence */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-surface/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden group shadow-2xl">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h4 className="text-lg font-syne font-black uppercase tracking-tighter text-primary">Forge Identity Hub</h4>
                                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em] leading-relaxed">Management of your public proof-of-work portal.</p>
                                        </div>
                                        <div
                                            onClick={() => setProfile({ ...profile, isPublic: !profile.isPublic })}
                                            className={cn("w-14 h-7 rounded-full p-1 cursor-pointer transition-all flex items-center shadow-inner", profile.isPublic ? "bg-primary" : "bg-white/5")}
                                        >
                                            <div className={cn("w-5 h-5 bg-white rounded-full transition-all shadow-2xl", profile.isPublic ? "translate-x-7" : "translate-x-0")} />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">Custom Vanity URL</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-mono text-sm leading-none">/p/</span>
                                                <input
                                                    type="text"
                                                    placeholder="ark-operator"
                                                    value={profile.vanityHandle || ''}
                                                    onChange={e => setProfile({ ...profile, vanityHandle: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm outline-none focus:border-primary/50 transition-all font-mono font-bold tracking-tight"
                                                />
                                            </div>
                                        </div>

                                        {profile.isPublic && profile.vanityHandle && (
                                            <Link
                                                href={`/p/${profile.vanityHandle}`}
                                                target="_blank"
                                                className="flex items-center justify-center gap-3 w-full py-4 bg-primary/10 border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:bg-primary hover:text-white transition-all group"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                View Live Pulse Identity
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-surface/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden group shadow-2xl">
                                    <h4 className="text-lg font-syne font-black uppercase tracking-tighter">Network Integrations</h4>
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">GitHub Link</label>
                                            <input
                                                type="text"
                                                placeholder="https://github.com/..."
                                                value={profile.githubUrl || ''}
                                                onChange={e => setProfile({ ...profile, githubUrl: e.target.value })}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm outline-none focus:border-primary/50 transition-all font-bold"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">LinkedIn Link</label>
                                            <input
                                                type="text"
                                                placeholder="https://linkedin.com/in/..."
                                                value={profile.linkedinUrl || ''}
                                                onChange={e => setProfile({ ...profile, linkedinUrl: e.target.value })}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm outline-none focus:border-primary/50 transition-all font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Card 3: Narrative */}
                            <section className="bg-surface/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group shadow-2xl">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">Internal Engineering Philosophy</label>
                                <textarea
                                    value={profile.bio || ''}
                                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                    className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-8 text-lg font-lora italic outline-none focus:border-primary/50 transition-all min-h-[160px] resize-none leading-relaxed text-white/70"
                                    placeholder="The will to architect greatness defines the engineer..."
                                />
                            </section>

                            <div className="flex items-center justify-between pt-6">
                                <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em] italic leading-none">Identity Core 2.0 // Forge OS</p>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="bg-primary hover:bg-red-600 text-white font-black px-12 py-5 rounded-2xl flex items-center gap-3 transition-all shadow-2xl shadow-primary/30 disabled:opacity-50 transform hover:scale-105 active:scale-95 uppercase text-xs tracking-widest"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {saved ? 'Synchronized' : 'Execute Sync'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'prefs' && profile && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <div className="bg-surface border border-border-subtle p-8 rounded-3xl space-y-6">
                                <div className="flex items-center gap-3 text-primary">
                                    <Bell className="w-6 h-6" />
                                    <h3 className="text-xl font-syne font-bold uppercase tracking-tighter">Notifications</h3>
                                </div>

                                <div className="space-y-4 pt-4 text-sm">
                                    <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-xl border border-border-subtle">
                                        <div className="flex items-center gap-3">
                                            <Bell className="w-4 h-4 text-text-secondary" />
                                            <span>Daily Email Progress Reports</span>
                                        </div>
                                        <div
                                            onClick={() => setProfile({ ...profile, emailNotifications: !profile.emailNotifications })}
                                            className={cn("w-10 h-5 rounded-full p-1 cursor-pointer transition-all", profile.emailNotifications ? "bg-primary" : "bg-border-subtle")}
                                        >
                                            <div className={cn("w-3 h-3 bg-white rounded-full transition-all", profile.emailNotifications ? "ml-auto" : "ml-0")} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-xl border border-border-subtle">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-4 h-4 text-text-secondary" />
                                            <span>Morning Digest Time</span>
                                        </div>
                                        <input
                                            type="time"
                                            value={profile.morningDigestTime}
                                            onChange={e => setProfile({ ...profile, morningDigestTime: e.target.value })}
                                            className="bg-surface-elevated border border-border-subtle rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-xl border border-border-subtle">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-4 h-4 text-primary" />
                                            <div className="flex flex-col">
                                                <span>Work Reminders</span>
                                                <span className="text-[10px] text-text-secondary uppercase">Time to nudge you back to the grind</span>
                                            </div>
                                        </div>
                                        <input
                                            type="time"
                                            value={profile.reminderEmailTime || '20:00'}
                                            onChange={e => setProfile({ ...profile, reminderEmailTime: e.target.value })}
                                            className="bg-surface-elevated border border-border-subtle rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary font-mono"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-xl border border-border-subtle">
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-text-secondary" />
                                            <span>Test Integration</span>
                                        </div>
                                        <button
                                            disabled={sendingTest}
                                            onClick={async () => {
                                                setSendingTest(true)
                                                try {
                                                    const { sendMorningDigest } = await import('@/lib/actions/email')
                                                    const res = await sendMorningDigest(profile.email)
                                                    if (res.success) toast.success('Test digest sent to ' + profile.email)
                                                    else toast.error('Failed: ' + res.error)
                                                } finally {
                                                    setSendingTest(false)
                                                }
                                            }}
                                            className="px-4 py-1.5 bg-surface-elevated border border-border-subtle rounded-lg text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-all disabled:opacity-50 flex items-center gap-1.5"
                                        >
                                            {sendingTest ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                                            {sendingTest ? 'Sending...' : 'Send Test'}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6">
                                    <div className="flex items-center gap-3 text-primary">
                                        <Smartphone className="w-6 h-6" />
                                        <h3 className="text-xl font-syne font-bold uppercase tracking-tighter">Focus Mode</h3>
                                    </div>
                                    <div className="space-y-4 text-sm">
                                        <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-xl border border-border-subtle">
                                            <div className="flex items-center gap-3">
                                                <Zap className="w-4 h-4 text-primary" />
                                                <div className="flex flex-col">
                                                    <span>Start Tasks With Pomodoro</span>
                                                    <span className="text-[10px] text-text-secondary uppercase">Auto-launch timer when you start the day’s action</span>
                                                </div>
                                            </div>
                                            <div
                                                onClick={() => {
                                                    const newValue = !startWithPomodoro
                                                    setStartWithPomodoro(newValue)
                                                    localStorage.setItem('forge_start_with_pomodoro', String(newValue))
                                                    window.dispatchEvent(new Event('storage'))
                                                }}
                                                className={cn("w-10 h-5 rounded-full p-1 cursor-pointer transition-all", startWithPomodoro ? "bg-primary" : "bg-border-subtle")}
                                            >
                                                <div className={cn("w-3 h-3 bg-white rounded-full transition-all", startWithPomodoro ? "ml-auto" : "ml-0")} />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-[#0a0a0a] rounded-xl border border-border-subtle space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-4 h-4 text-text-secondary" />
                                                <div className="flex flex-col">
                                                    <span>Pomodoro Defaults (Minutes)</span>
                                                    <span className="text-[10px] text-text-secondary uppercase">Used for auto-start and timer reset</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Work</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={pomodoroWorkMinutes}
                                                        onChange={(e) => {
                                                            const v = Math.max(1, parseInt(e.target.value || '25', 10) || 25)
                                                            setPomodoroWorkMinutes(v)
                                                            localStorage.setItem('pomodoro_work_minutes', String(v))
                                                            window.dispatchEvent(new Event('storage'))
                                                        }}
                                                        className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs outline-none focus:border-primary font-mono"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Short Break</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={pomodoroShortBreakMinutes}
                                                        onChange={(e) => {
                                                            const v = Math.max(1, parseInt(e.target.value || '5', 10) || 5)
                                                            setPomodoroShortBreakMinutes(v)
                                                            localStorage.setItem('pomodoro_short_break_minutes', String(v))
                                                            window.dispatchEvent(new Event('storage'))
                                                        }}
                                                        className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs outline-none focus:border-primary font-mono"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Long Break</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={pomodoroLongBreakMinutes}
                                                        onChange={(e) => {
                                                            const v = Math.max(1, parseInt(e.target.value || '15', 10) || 15)
                                                            setPomodoroLongBreakMinutes(v)
                                                            localStorage.setItem('pomodoro_long_break_minutes', String(v))
                                                            window.dispatchEvent(new Event('storage'))
                                                        }}
                                                        className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs outline-none focus:border-primary font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-xl border border-border-subtle">
                                            <div className="flex items-center gap-3">
                                                <Zap className="w-4 h-4 text-primary" />
                                                <div className="flex flex-col">
                                                    <span>Pomodoro Zen Fullscreen</span>
                                                    <span className="text-[10px] text-text-secondary">Immersive focus mode takes over the entire browser</span>
                                                </div>
                                            </div>
                                            <div
                                                onClick={() => {
                                                    const newValue = !zenFullscreen
                                                    setZenFullscreen(newValue)
                                                    localStorage.setItem('pomodoro_zen_fullscreen', String(newValue))
                                                    window.dispatchEvent(new Event('storage'))
                                                }}
                                                className={cn("w-10 h-5 rounded-full p-1 cursor-pointer transition-all", zenFullscreen ? "bg-primary" : "bg-border-subtle")}
                                            >
                                                <div className={cn("w-3 h-3 bg-white rounded-full transition-all", zenFullscreen ? "ml-auto" : "ml-0")} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSavePreferences}
                                    disabled={saving}
                                    className="bg-primary hover:bg-red-600 text-white font-bold px-8 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {saved ? 'Saved!' : 'Save Preferences'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'app' && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <div className="bg-surface border border-border-subtle p-8 rounded-3xl space-y-6">
                                <div className="flex items-center gap-3 text-secondary">
                                    <Database className="w-6 h-6" />
                                    <h3 className="text-xl font-syne font-bold uppercase tracking-tighter">Danger Zone</h3>
                                </div>
                                <p className="text-sm text-text-secondary font-medium">Resetting or deleting data is permanent. Be extremely careful.</p>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => window.location.href = '/setup'}
                                        className="w-full flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-800 border border-border-subtle rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3 text-sm font-bold text-text-primary">
                                            <Database className="w-4 h-4 text-primary" />
                                            Re-upload / Re-parse Roadmap
                                        </div>
                                    </button>

                                    <button
                                        disabled={resetting}
                                        onClick={() => setShowResetModal(true)}
                                        className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-xl transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-3 text-sm font-bold text-primary">
                                            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            {resetting ? 'Resetting...' : 'Reset Current Roadmap'}
                                        </div>
                                        <AlertTriangle className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </main>
            </div>

            {/* Reset Confirmation Modal */}
            <AnimatePresence>
                {showResetModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0f0f0f] border border-red-500/30 rounded-[2.5rem] p-10 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center space-y-8"
                        >
                            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-10 h-10 text-red-500" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-syne font-bold text-white uppercase tracking-tighter">Nuclear Reset</h3>
                                <p className="text-text-secondary text-sm">
                                    This will permanently delete all progress, streaks, and focus metrics. Type <span className="text-red-500 font-black">ERASE DATA</span> to authorize.
                                </p>
                            </div>

                            <input
                                autoFocus
                                type="text"
                                value={resetPhrase}
                                onChange={(e) => setResetPhrase(e.target.value)}
                                placeholder="Authorization phrase..."
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-center text-sm font-bold uppercase tracking-widest text-red-500 outline-none focus:border-red-500/50 transition-all placeholder:text-white/5"
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowResetModal(false)
                                        setResetPhrase('')
                                    }}
                                    disabled={resetting}
                                    className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40"
                                >
                                    Abort
                                </button>
                                <button
                                    disabled={resetPhrase !== 'ERASE DATA' || resetting}
                                    onClick={async () => {
                                        setResetting(true)
                                        const toastId = toast.loading('Reshaping reality...')
                                        try {
                                            const { resetRoadmap } = await import('@/lib/actions/reset')
                                            await resetRoadmap()
                                            toast.success('Reset complete. Redirecting...', { id: toastId })
                                            window.location.href = '/setup'
                                        } catch (e: any) {
                                            toast.error('Reset failed: ' + (e.message || 'Unknown error'), { id: toastId })
                                            setResetting(false)
                                        }
                                    }}
                                    className="flex-1 py-4 rounded-2xl bg-red-500 hover:bg-red-600 disabled:opacity-20 disabled:grayscale text-white text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] flex items-center justify-center gap-2"
                                >
                                    {resetting ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</>
                                    ) : 'Confirm Reset'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
