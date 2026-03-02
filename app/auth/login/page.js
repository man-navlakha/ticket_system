'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) router.push('/dashboard');
            } catch (err) {
                console.error('Session check failed:', err);
            }
        };
        checkSession();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
            });

            if (res.ok) {
                router.push('/dashboard');
            } else {
                const data = await res.json();
                setError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-7">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground mb-3">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/50 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    Secure Access Portal
                </div>
                <h1 className="text-2xl font-light tracking-tight text-foreground">Welcome back</h1>
                <p className="text-sm text-muted-foreground font-light">Sign in to your enterprise workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Identity */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Identity</label>
                    <input
                        type="text"
                        placeholder="Email or Username"
                        required
                        className="w-full h-12 px-4 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#ec4269]/60 dark:focus:border-[#D4AF37]/60 transition-all"
                        style={{ outline: 'none', boxShadow: 'none' }}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                    />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Password</label>
                        <Link href="/auth/forgot-password" className="text-[10px] font-semibold text-muted-foreground hover:text-[#ec4269] dark:hover:text-[#D4AF37] transition-colors">
                            Forgot?
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            required
                            className="w-full h-12 px-4 pr-12 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#ec4269]/60 dark:focus:border-[#D4AF37]/60 transition-all"
                            style={{ outline: 'none', boxShadow: 'none' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl text-center animate-in fade-in slide-in-from-top-1">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#ec4269] dark:bg-[#D4AF37] text-white dark:text-zinc-900 font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 hover:scale-[1.01] transition-all active:scale-[0.98] disabled:opacity-50 mt-1 shadow-lg shadow-[#ec4269]/20 dark:shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
                    ) : 'Sign In'}
                </button>
            </form>

            <div className="pt-5 border-t border-border text-center">
                <p className="text-xs text-muted-foreground font-medium">
                    Don&apos;t have an account?{' '}
                    <Link href="/auth/register" className="text-[#ec4269] dark:text-[#D4AF37] font-bold hover:underline underline-offset-4">
                        Request Access
                    </Link>
                </p>
            </div>
        </div>
    );
}
