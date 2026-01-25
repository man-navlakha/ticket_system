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
        <div className="w-full">
            <h1 className="text-2xl font-bold tracking-tight text-center mb-2">Forgot Password</h1>
            <p className="text-sm text-[#666666] dark:text-[#888888] text-center mb-6">
                Enter your email address to receive a reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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

                {message && (
                    <div className="bg-[#f0f9ff] dark:bg-[#082f49] border border-[#0ea5e9] text-[#0369a1] dark:text-[#38bdf8] px-3 py-2 rounded-md text-xs">
                        {message}
                    </div>
                )}

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
                    {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#eaeaea] dark:border-[#333333] text-center">
                <Link href="/auth/login" className="text-sm font-medium text-black dark:text-white hover:underline underline-offset-4">
                    Back to login
                </Link>
            </div>
        </div>
    );
}
