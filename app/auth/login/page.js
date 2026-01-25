'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

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
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold tracking-tight text-center mb-6">Log in to your account</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-[#666666] dark:text-[#888888]">Username or Email</label>
                    <input
                        type="text"
                        placeholder="user@example.com"
                        className="w-full px-3 py-2 bg-white dark:bg-black border border-[#eaeaea] dark:border-[#333333] rounded-md focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all duration-200 text-sm"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-medium uppercase tracking-wider text-[#666666] dark:text-[#888888]">Password</label>
                        <Link href="/auth/forgot-password" size="sm" className="text-xs text-[#666666] dark:text-[#888888] hover:text-black dark:hover:text-white transition-colors duration-200">
                            Forgot password?
                        </Link>
                    </div>
                    <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-white dark:bg-black border border-[#eaeaea] dark:border-[#333333] rounded-md focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all duration-200 text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && (
                    <div className="bg-[#fee2e2] dark:bg-[#450a0a] border border-[#ef4444] text-[#b91c1c] dark:text-[#f87171] px-3 py-2 rounded-md text-xs">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black dark:bg-white text-white dark:text-black py-2 px-4 rounded-md font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Logging in...' : 'Log In'}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#eaeaea] dark:border-[#333333] text-center">
                <p className="text-sm text-[#666666] dark:text-[#888888]">
                    Don&apos;t have an account?{' '}
                    <Link href="/auth/register" className="font-medium text-black dark:text-white hover:underline underline-offset-4">
                        Sign up for free
                    </Link>
                </p>
            </div>
        </div>
    );
}
