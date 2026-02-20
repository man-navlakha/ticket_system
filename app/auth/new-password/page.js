'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

        if (newPassword !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (!token) {
            setError("Missing reset token");
            return;
        }

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

    if (!token) {
        return (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-xl text-center leading-relaxed">
                Invalid or missing reset token. <br />
                Please request a new link.
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">New Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        required
                        className="w-full h-12 px-4 bg-input/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all focus:bg-background"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Confirm Identity</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        required
                        className="w-full h-12 px-4 bg-input/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all focus:bg-background"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
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
                {loading ? 'Updating...' : 'Set New Password'}
            </button>
        </form>
    );
}

export default function NewPasswordPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Security Update</h1>
                <p className="text-sm text-muted-foreground font-medium">Choose a strong new password.</p>
            </div>

            <Suspense fallback={<div className="text-center py-6 animate-pulse">
                <div className="w-8 h-8 bg-muted/20 rounded-full mx-auto" />
            </div>}>
                <ResetPasswordForm />
            </Suspense>

            <div className="pt-6 border-t border-border text-center">
                <Link href="/auth/login" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">
                    Back to login
                </Link>
            </div>
        </div>
    );
}
