'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import FloatingLines from '@/components/FloatingLines';
import { ThemeToggle } from '@/components/theme-toggle';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';

// ── Input component ────────────────────────────────────────────────────────────
function InputField({ label, type = 'text', ...props }) {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';

    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">{label}</label>
            <div className="relative">
                <input
                    type={isPassword ? (show ? 'text' : 'password') : type}
                    className="w-full h-12 px-4 pr-11 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C5A059]/60 dark:focus:border-[#D4AF37]/60 transition-all"
                    style={{ outline: 'none', boxShadow: 'none' }}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow(!show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Setup Form ────────────────────────────────────────────────────────────────
function SetupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        if (!acceptedTerms) { setError('You must agree to the Terms & Conditions.'); return; }

        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username');
        const phoneNumber = formData.get('phoneNumber');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }

        try {
            const res = await fetch('/api/auth/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, username, phoneNumber, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to setup account');
            }

            setSuccess(true);
            setTimeout(() => router.push('/auth/login'), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // ── No token state ─────────────────────────────────────────────────────
    if (!token) {
        return (
            <div className="text-center space-y-5 animate-in fade-in duration-700">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 mx-auto">
                    <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">Invalid Session</h1>
                    <p className="text-sm text-muted-foreground font-light">This invitation link is missing a valid token or has expired.</p>
                </div>
                <Link href="/auth/login" className="inline-block text-sm font-semibold text-[#C5A059] dark:text-[#D4AF37] hover:underline underline-offset-4 transition-all">
                    Return to login →
                </Link>
            </div>
        );
    }

    // ── Success state ───────────────────────────────────────────────────────
    if (success) {
        return (
            <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 mx-auto shadow-lg shadow-emerald-500/5">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-light text-foreground tracking-tight">Setup Complete</h2>
                    <p className="text-muted-foreground font-light text-sm">Your workspace identity is now active. Redirecting to login...</p>
                </div>
                {/* Progress bar */}
                <div className="w-48 h-1 bg-border rounded-full overflow-hidden mx-auto">
                    <div className="h-full bg-[#C5A059] dark:bg-[#D4AF37] rounded-full animate-[progress_3s_ease-in-out_forwards]" style={{ width: '100%', animationDuration: '3s' }} />
                </div>
            </div>
        );
    }

    // ── Main form ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground mb-3">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A059]/50 dark:bg-[#D4AF37]/50 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C5A059] dark:bg-[#D4AF37]" />
                    </span>
                    Invitation Active
                </div>
                <h1 className="text-2xl font-light tracking-tight text-foreground">Join the Workspace</h1>
                <p className="text-sm text-muted-foreground font-light">Set up your enterprise profile to begin.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl text-center animate-in fade-in slide-in-from-top-1">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <InputField label="Workspace Identity" name="username" placeholder="Display Name / Handle" type="text" required />
                    <InputField label="Phone Number" name="phoneNumber" placeholder="+1 (555) 000-0000" type="tel" required />
                    <InputField label="Access Password" name="password" type="password" placeholder="••••••••" required />
                    <InputField label="Verify Password" name="confirmPassword" type="password" placeholder="••••••••" required />
                </div>

                {/* Terms */}
                <div
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className="flex items-start gap-3 p-4 bg-muted/30 rounded-2xl border border-border hover:border-[#C5A059]/30 dark:hover:border-[#D4AF37]/30 transition-colors cursor-pointer"
                >
                    <div className={`mt-0.5 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center shrink-0 ${acceptedTerms ? 'bg-[#C5A059] dark:bg-[#D4AF37] border-[#C5A059] dark:border-[#D4AF37]' : 'border-border'}`}>
                        {acceptedTerms && (
                            <svg className="w-3 h-3 text-white dark:text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed font-light">
                        I agree to the{' '}
                        <Link href="/terms" onClick={e => e.stopPropagation()} className="text-[#C5A059] dark:text-[#D4AF37] hover:underline underline-offset-4 font-medium">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/policies" onClick={e => e.stopPropagation()} className="text-[#C5A059] dark:text-[#D4AF37] hover:underline underline-offset-4 font-medium">Privacy Policy</Link>.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#C5A059] dark:bg-[#D4AF37] text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:opacity-90 hover:scale-[1.01] transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#C5A059]/20 dark:shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Configuring Account...</>
                    ) : 'Initialize Identity'}
                </button>
            </form>

            <div className="text-center">
                <Link href="/dashboard/help" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-[#C5A059] dark:hover:text-[#D4AF37] transition-colors flex items-center justify-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Need assistance with onboarding?
                </Link>
            </div>
        </div>
    );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────
export default function SetupAccountPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/20 transition-colors duration-300 relative overflow-hidden">
            <FloatingLines />

            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#C5A059]/10 dark:bg-[#D4AF37]/5 blur-[100px] rounded-full -z-10 pointer-events-none" />

            {/* Header */}
            <header className="w-full px-6 py-5 flex items-center justify-between relative z-10">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="p-2 bg-background/80 backdrop-blur rounded-xl border border-border shadow-sm group-hover:border-[#C5A059]/40 dark:group-hover:border-[#D4AF37]/40 transition-colors">
                        <Image src="/logo_my.png" alt="Logo" width={28} height={28} priority />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block">
                        MAN&apos;S SUPPORT DESK
                    </span>
                </Link>
                <ThemeToggle />
            </header>

            {/* Form */}
            <main className="flex-1 flex items-center justify-center px-4 py-10 relative z-10">
                <div className="w-full max-w-[440px] animate-in fade-in duration-700">
                    <div className="relative group">
                        <div className="absolute -inset-[2px] rounded-[2.5rem] bg-gradient-to-br from-[#C5A059]/30 via-purple-500/10 to-blue-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        <div className="relative bg-card/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.2rem] border border-border shadow-2xl shadow-black/5">
                            <Suspense fallback={
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="w-8 h-8 text-[#C5A059] dark:text-[#D4AF37] animate-spin" />
                                </div>
                            }>
                                <SetupForm />
                            </Suspense>
                        </div>
                    </div>

                    <footer className="mt-8 text-center">
                        <div className="flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <Link href="/policies" className="hover:text-foreground transition-colors">Privacy</Link>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
