'use client'

import React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

function LoginContent() {
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [isAdminMode, setIsAdminMode] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [isSent, setIsSent] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const searchParams = useSearchParams()

    const errorType = searchParams.get('error')
    const loggedEmail = searchParams.get('email')

    React.useEffect(() => {
        if (errorType === 'unauthorized') {
            setError(`Account ${loggedEmail} not found in the Single-User allowlist. Please set ALLOWED_USER_EMAIL in your .env.local.`)
        }
    }, [errorType, loggedEmail])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setIsSent(false)

        if (isAdminMode) {
            // Dev Admin Bypass
            if (password === 'grind') {
                document.cookie = "forge_dev_admin=true; path=/; max-age=86400"
                window.location.href = '/dashboard'
                return
            } else {
                setError("Invalid Developer Credentials.")
                setIsLoading(false)
                return
            }
        }

        const supabase = createClient()
        const { error: authError } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (authError) {
            setError(authError.message)
            setIsLoading(false)
        } else {
            setIsSent(true)
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-4xl font-syne font-bold tracking-tighter">Enter the Forge</h1>
                <p className="text-text-secondary font-medium">Verify your identity to resume the grind.</p>
            </div>

            <div className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors"></div>

                <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                            Mode: {isAdminMode ? 'Developer Bypass' : 'Normal Access'}
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsAdminMode(!isAdminMode)}
                            className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                        >
                            Switch to {isAdminMode ? 'Standard' : 'Admin'}
                        </button>
                    </div>

                    {!isAdminMode ? (
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-text-secondary ml-1">
                                Professional Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="general"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    className="w-full bg-[#0c0c0c] border border-border-subtle rounded-2xl py-4 pl-12 pr-4 text-text-primary placeholder:text-text-secondary outline-none focus:border-primary transition-all font-medium"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-text-secondary ml-1">Admin ID</label>
                                <div className="relative">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                    <input
                                        type="text"
                                        value="FORGE-ROOT"
                                        disabled
                                        autoComplete="off"
                                        className="w-full bg-[#0c0c0c]/50 border border-border-subtle rounded-2xl py-4 pl-12 pr-4 text-text-secondary font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-text-secondary ml-1">Master Password</label>
                                <div className="relative">
                                    <Loader2 className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary", isLoading && "animate-spin")} />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="off"
                                        className="w-full bg-[#0c0c0c] border border-border-subtle rounded-2xl py-4 pl-12 pr-4 text-text-primary outline-none focus:border-primary transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-red-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 group"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {isAdminMode ? 'Bypass Security' : 'Send Magic Link'}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-200 font-medium leading-relaxed">{error}</p>
                    </div>
                )}

                {isSent && (
                    <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-success font-bold">Magic Link Sent!</p>
                            <p className="text-xs text-text-secondary mt-1">Check your inbox to verify your session.</p>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-center text-xs text-text-secondary font-medium px-8 leading-relaxed">
                FORGE uses passwordless authentication. If you don&apos;t receive an email within 2 minutes, check your SPAM folder.
            </p>
        </div>
    )
}

export default function LoginPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        }>
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
                <LoginContent />
            </div>
        </React.Suspense>
    )
}

function ArrowRight({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    )
}
