'use client'

import React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2, Shield, AlertCircle, CheckCircle2, Lock } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { loginAdmin } from '@/lib/actions/auth'

function LoginContent() {
    const [email, setEmail] = React.useState('')
    const [adminId, setAdminId] = React.useState('root')
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
            setError(`Account ${loggedEmail} is not allowed. Please update ALLOWED_USER_EMAIL in your Vercel Project Settings.`)
        }
    }, [errorType, loggedEmail])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setIsSent(false)

        if (isAdminMode) {
            const result = await loginAdmin(password)
            if (result.success) {
                window.location.href = '/dashboard'
                return
            } else {
                setError(result.error || "Invalid Developer Credentials.")
                setIsLoading(false)
                return
            }
        }

        const supabase = createClient()

        // Handle Password Login if a password is provided
        if (password && !isAdminMode) {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (authError) {
                setError(authError.message)
                setIsLoading(false)
            } else {
                window.location.href = '/dashboard'
            }
            return
        }

        // Handle Magic Link (OTP) if no password
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

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-text-secondary ml-1">
                                {isAdminMode ? 'Admin ID' : 'Professional Email'}
                            </label>
                            <div className="relative">
                                {isAdminMode ? (
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                ) : (
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                )}
                                <input
                                    id="email"
                                    type={isAdminMode ? "text" : "email"}
                                    placeholder={isAdminMode ? "root" : "be@focused.com"}
                                    required
                                    value={isAdminMode ? adminId : email}
                                    onChange={(e) => isAdminMode ? setAdminId(e.target.value) : setEmail(e.target.value)}
                                    className="w-full bg-[#0c0c0c] border border-border-subtle rounded-2xl py-4 pl-12 pr-4 text-text-primary placeholder:text-text-secondary outline-none focus:border-primary transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary ml-1">
                                Password {!isAdminMode && <span className="text-[9px] lowercase opacity-50">(optional for magic link)</span>}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    className="w-full bg-[#0c0c0c] border border-border-subtle rounded-2xl py-4 pl-12 pr-4 text-text-primary outline-none focus:border-primary transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-red-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 group"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {isAdminMode ? 'Login as Admin' : 'Send Magic Link'}
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
