'use client';

import { useState } from 'react';
import Link from 'next/link';

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

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h1>
                <p className="text-sm text-muted-foreground font-medium">We'll send you a recovery link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</label>
                    <input
                        type="email"
                        placeholder="user@enterprise.com"
                        required
                        className="w-full h-12 px-4 bg-input/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all focus:bg-background"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                {message && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold rounded-xl text-center">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-xl text-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 shadow-lg shadow-black/5"
                >
                    {loading ? 'Sending...' : 'Send Recovery Link'}
                </button>
            </form>

            <div className="pt-6 border-t border-border text-center">
                <Link href="/auth/login" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">
                    Return to login
                </Link>
            </div>
        </div>
    );
}
