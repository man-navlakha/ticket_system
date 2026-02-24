'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
            } else {
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Success state
    if (message) {
        return (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground tracking-tight">Check your inbox</h2>
                    <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-[280px] mx-auto">
                        {message}
                    </p>
                </div>
                <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border rounded-full hover:text-[#C5A059] dark:hover:text-[#D4AF37] hover:border-[#C5A059]/40 dark:hover:border-[#D4AF37]/40 transition-all"
                >
                    ← Back to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-7 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C5A059]/10 dark:bg-[#D4AF37]/10 border border-[#C5A059]/20 dark:border-[#D4AF37]/20 text-[#C5A059] dark:text-[#D4AF37] mx-auto mb-3">
                    <Mail className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-light tracking-tight text-foreground">Reset Password</h1>
                <p className="text-sm text-muted-foreground font-light">
                    Enter your email and we&apos;ll send a recovery link.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        placeholder="user@enterprise.com"
                        required
                        className="w-full h-12 px-4 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C5A059]/60 dark:focus:border-[#D4AF37]/60 transition-all"
                        style={{ outline: 'none', boxShadow: 'none' }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl text-center animate-in fade-in slide-in-from-top-1">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#C5A059] dark:bg-[#D4AF37] text-white dark:text-zinc-900 font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 hover:scale-[1.01] transition-all active:scale-[0.98] disabled:opacity-50 mt-1 shadow-lg shadow-[#C5A059]/20 dark:shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                    ) : 'Send Recovery Link'}
                </button>
            </form>

            <div className="pt-5 border-t border-border text-center">
                <Link
                    href="/auth/login"
                    className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-[#C5A059] dark:hover:text-[#D4AF37] transition-colors"
                >
                    ← Return to Login
                </Link>
            </div>
        </div>
    );
}
