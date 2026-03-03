'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, Lock, Loader2, ShieldCheck, KeyRound } from 'lucide-react';

export default function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) router.push('/dashboard');
            } catch (err) { }
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
                setError(data.error || 'Identity verification failed');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full relative">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
            >
                {/* Header Section */}
                <div className="space-y-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ec4269]/10 text-[#ec4269] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] text-[11px] font-bold uppercase tracking-widest border border-[#ec4269]/20 dark:border-[#D4AF37]/20 shadow-sm"
                    >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>System Access</span>
                    </motion.div>

                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-2">
                            Welcome Back!!
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                            Log in to secure ticketing infrastructure.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 relative">
                    {/* Identifier Field */}
                    <div className="space-y-2 relative z-10 group">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1.5 transition-colors group-hover:text-foreground">
                            Identity
                        </label>
                        <div
                            className={`relative flex items-center bg-background/50 backdrop-blur-sm border rounded-2xl overflow-hidden transition-all duration-300 ${focusedField === 'identifier' ? 'border-[#ec4269] dark:border-[#D4AF37] shadow-[0_4px_25px_rgba(236,66,105,0.15)] dark:shadow-[0_4px_25px_rgba(212,175,55,0.15)] bg-background' : 'border-border/60 hover:border-foreground/20 hover:bg-muted/30'}`}
                        >
                            <div className="pl-4 pr-3 text-muted-foreground transition-colors group-hover:text-foreground">
                                <Mail className={`w-5 h-5 transition-all duration-300 ${focusedField === 'identifier' ? 'text-[#ec4269] dark:text-[#D4AF37] scale-110' : ''}`} />
                            </div>
                            <input
                                type="text"
                                placeholder="Email or Username"
                                required
                                onFocus={() => setFocusedField('identifier')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full h-14 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/50 font-medium"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2 relative z-10 group">
                        <div className="flex justify-between items-center ml-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-foreground">
                                Password
                            </label>
                            <Link href="/auth/forgot-password" className="text-[10px] uppercase font-bold tracking-[0.1em] text-muted-foreground hover:text-[#ec4269] dark:hover:text-[#D4AF37] transition-colors">
                                Reset
                            </Link>
                        </div>
                        <div
                            className={`relative flex items-center bg-background/50 backdrop-blur-sm border rounded-2xl overflow-hidden transition-all duration-300 ${focusedField === 'password' ? 'border-[#ec4269] dark:border-[#D4AF37] shadow-[0_4px_25px_rgba(236,66,105,0.15)] dark:shadow-[0_4px_25px_rgba(212,175,55,0.15)] bg-background' : 'border-border/60 hover:border-foreground/20 hover:bg-muted/30'}`}
                        >
                            <div className="pl-4 pr-3 text-muted-foreground transition-colors group-hover:text-foreground">
                                <Lock className={`w-5 h-5 transition-all duration-300 ${focusedField === 'password' ? 'text-[#ec4269] dark:text-[#D4AF37] scale-110' : ''}`} />
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••••••"
                                required
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full h-14 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/50 font-medium tracking-widest"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: -5 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -5 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-2 p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold rounded-2xl flex items-center gap-3">
                                    <div className="p-1.5 bg-destructive/20 rounded-full">
                                        <KeyRound className="w-4 h-4" />
                                    </div>
                                    {error}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 relative group overflow-hidden rounded-2xl bg-foreground text-background font-bold text-xs uppercase tracking-[0.2em] disabled:opacity-70 mt-6 shadow-xl shadow-foreground/10 flex items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#ec4269] to-[#ff6b8b] dark:from-[#D4AF37] dark:to-[#f1c953] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative flex items-center justify-center gap-3 w-full h-full text-background group-hover:text-white dark:group-hover:text-zinc-900 transition-colors duration-300">
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
                            ) : (
                                <>
                                    <span>Authenticate</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                                </>
                            )}
                        </div>
                    </motion.button>
                </form>

                <div className="pt-8 border-t border-border/40 text-center">
                    <p className="text-[13px] text-muted-foreground font-medium">
                        Need an account?{' '}
                        <Link href="/auth/register" className="text-foreground font-bold hover:text-[#ec4269] dark:hover:text-[#D4AF37] transition-all duration-300 underline-offset-4 hover:underline">
                            Request access
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
