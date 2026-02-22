'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
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
    Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProfile, updateProfile } from '@/lib/actions/settings'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'app' | 'security'>('profile')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<any>(null)

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user?.email) {
            const data = await getProfile(user.email)
            setProfile(data)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!profile) return
        setSaving(true)
        await updateProfile(profile.email, {
            fullName: profile.fullName,
            bio: profile.bio,
            emailNotifications: profile.emailNotifications,
            morningDigestTime: profile.morningDigestTime
        })
        setSaving(false)
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
                        { id: 'security', icon: Shield, label: 'Access Control' },
                        { id: 'app', icon: Database, label: 'System & Data' },
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
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <div className="bg-surface border border-border-subtle p-8 rounded-3xl space-y-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-3xl bg-surface-elevated flex items-center justify-center border border-border-subtle relative group overflow-hidden">
                                        {profile.avatarUrl ? (
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={profile.avatarUrl}
                                                    alt="Profile"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <UserCircle className="w-12 h-12 text-text-secondary" />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-syne font-bold">{profile.fullName || 'User'}</h3>
                                        <p className="text-sm text-text-secondary">{profile.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Public Display Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                            <input
                                                type="text"
                                                value={profile.fullName || ''}
                                                onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                                                className="w-full bg-[#0a0a0a] border border-border-subtle rounded-xl py-3 px-11 text-sm outline-none focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Professional Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                            <input type="email" value={profile.email} disabled className="w-full bg-[#0a0a0a] border border-border-subtle rounded-xl py-3 px-11 text-sm outline-none opacity-50 cursor-not-allowed font-mono" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Short Bio (Public Blog)</label>
                                    <textarea
                                        value={profile.bio || ''}
                                        onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-border-subtle rounded-2xl p-4 text-sm min-h-[100px] outline-none focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-primary hover:bg-red-600 text-white font-bold px-8 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Profile
                            </button>
                        </motion.div>
                    )}

                    {activeTab === 'security' && profile && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <div className="bg-surface border border-border-subtle p-8 rounded-3xl space-y-6">
                                <div className="flex items-center gap-3 text-primary">
                                    <Shield className="w-6 h-6" />
                                    <h3 className="text-xl font-syne font-bold uppercase tracking-tighter">Access Control</h3>
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
                                            <Mail className="w-4 h-4 text-text-secondary" />
                                            <span>Test Integration</span>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                const { sendMorningDigest } = await import('@/lib/actions/email')
                                                const res = await sendMorningDigest(profile.email)
                                                if (res.success) alert('Test email sent!')
                                                else alert('Failed: ' + res.error)
                                            }}
                                            className="px-4 py-1.5 bg-surface-elevated border border-border-subtle rounded-lg text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-all"
                                        >
                                            Send Test
                                        </button>
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
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-primary hover:bg-red-600 text-white font-bold px-8 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Update Preferences
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
                                        onClick={async () => {
                                            if (confirm("THIS WILL DELETE ALL PROGRESS. ARE YOU SURE?")) {
                                                const { resetRoadmap } = await import('@/lib/actions/reset')
                                                await resetRoadmap()
                                                window.location.href = '/setup'
                                            }
                                        }}
                                        className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3 text-sm font-bold text-primary">
                                            <Trash2 className="w-4 h-4" />
                                            Reset Current Roadmap
                                        </div>
                                        <AlertTriangle className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </main>
            </div>
        </div>
    )
}
