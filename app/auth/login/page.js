'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
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
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
                <p className="text-sm text-gray-500 font-medium">Log in to your enterprise workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Identity</label>
                        <input
                            type="text"
                            placeholder="Email or Username"
                            required
                            className="w-full h-12 px-4 bg-black border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all focus:bg-white/[0.02] [color-scheme:dark]"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Password</label>
                            <Link href="/auth/forgot-password" size="sm" className="text-[10px] font-bold text-gray-600 hover:text-white transition-colors">Forgot?</Link>
                        </div>
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            className="w-full h-12 px-4 bg-black border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all focus:bg-white/[0.02] [color-scheme:dark]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl text-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 shadow-lg shadow-white/5"
                >
                    {loading ? 'Authenticating...' : 'Sign In'}
                </button>
            </form>

            <div className="pt-6 border-t border-white/5 text-center">
                <p className="text-xs text-gray-500 font-medium">
                    Don't have an account? {' '}
                    <Link href="/auth/register" className="text-white font-bold hover:underline underline-offset-4">Request Access</Link>
                </p>
            </div>
        </div>
    );
}
