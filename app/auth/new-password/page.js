'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, ShieldCheck, XCircle } from 'lucide-react';

function PasswordInput({ label, value, onChange, placeholder = '••••••••' }) {
    const [show, setShow] = useState(false);
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">{label}</label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    placeholder={placeholder}
                    required
                    className="w-full h-12 px-4 pr-12 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#ec4269]/60 dark:focus:border-[#D4AF37]/60 transition-all"
                    style={{ outline: 'none', boxShadow: 'none' }}
                    value={value}
                    onChange={onChange}
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

function ResetPasswordForm() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }
        if (!token) { setError('Missing reset token'); return; }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                setTimeout(() => router.push('/auth/login'), 2000);
            } else {
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // No token
    if (!token) {
        return (
            <div className="text-center space-y-5 animate-in fade-in duration-700">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 mx-auto">
                    <XCircle className="w-7 h-7 text-destructive" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">Invalid Link</h2>
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">
                        Invalid or missing reset token. Please request a new link.
                    </p>
                </div>
                <Link href="/auth/forgot-password" className="inline-block text-sm font-semibold text-[#ec4269] dark:text-[#D4AF37] hover:underline underline-offset-4 transition-all">
                    Request new link →
                </Link>
            </div>
        );
    }

    // Success
    if (message) {
        return (
            <div className="text-center space-y-5 animate-in fade-in zoom-in-95 duration-500">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto">
                    <ShieldCheck className="w-7 h-7 text-emerald-500" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">Password Updated</h2>
                    <p className="text-sm text-muted-foreground font-light">{message} Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <PasswordInput label="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

            {message && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl text-center animate-in fade-in">
                    {message}
                </div>
            )}
            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl text-center animate-in fade-in slide-in-from-top-1">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#ec4269] dark:bg-[#D4AF37] text-white dark:text-zinc-900 font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 hover:scale-[1.01] transition-all active:scale-[0.98] disabled:opacity-50 mt-1 shadow-lg shadow-[#ec4269]/20 dark:shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                ) : 'Set New Password'}
            </button>
        </form>
    );
}

export default function NewPasswordPage() {
    return (
        <div className="space-y-7 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#ec4269]/10 dark:bg-[#D4AF37]/10 border border-[#ec4269]/20 dark:border-[#D4AF37]/20 text-[#ec4269] dark:text-[#D4AF37] mx-auto mb-3">
                    <ShieldCheck className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-light tracking-tight text-foreground">Security Update</h1>
                <p className="text-sm text-muted-foreground font-light">Choose a strong new password for your account.</p>
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-7 h-7 text-[#ec4269] dark:text-[#D4AF37] animate-spin" />
                </div>
            }>
                <ResetPasswordForm />
            </Suspense>

            <div className="pt-5 border-t border-border text-center">
                <Link
                    href="/auth/login"
                    className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-[#ec4269] dark:hover:text-[#D4AF37] transition-colors"
                >
                    ← Back to Login
                </Link>
            </div>
        </div>
    );
}
