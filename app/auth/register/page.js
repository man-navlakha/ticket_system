'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            if (res.ok) {
                router.push('/dashboard');
            } else {
                const data = await res.json();
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold tracking-tight text-center mb-6">Create an account</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-[#666666] dark:text-[#888888]">Username</label>
                    <input
                        type="text"
                        placeholder="johndoe"
                        className="w-full px-3 py-2 bg-white dark:bg-black border border-[#eaeaea] dark:border-[#333333] rounded-md focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all duration-200 text-sm"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-[#666666] dark:text-[#888888]">Email Address</label>
                    <input
                        type="email"
                        placeholder="user@example.com"
                        className="w-full px-3 py-2 bg-white dark:bg-black border border-[#eaeaea] dark:border-[#333333] rounded-md focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all duration-200 text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-[#666666] dark:text-[#888888]">Password</label>
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
                    {loading ? 'Creating account...' : 'Sign Up'}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#eaeaea] dark:border-[#333333] text-center">
                <p className="text-sm text-[#666666] dark:text-[#888888]">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="font-medium text-black dark:text-white hover:underline underline-offset-4">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
