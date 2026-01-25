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
            <div className="bg-[#fee2e2] dark:bg-[#450a0a] border border-[#ef4444] text-[#b91c1c] dark:text-[#f87171] px-3 py-2 rounded-md text-xs text-center">
                Invalid or missing reset token. Please request a new link.
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-[#666666] dark:text-[#888888]">New Password</label>
                <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-[#eaeaea] dark:border-[#333333] rounded-md focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all duration-200 text-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-[#666666] dark:text-[#888888]">Confirm Password</label>
                <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-[#eaeaea] dark:border-[#333333] rounded-md focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all duration-200 text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? 'Resetting...' : 'Reset Password'}
            </button>
        </form>
    );
}

export default function NewPasswordPage() {
    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold tracking-tight text-center mb-6">Reset your password</h1>
            <Suspense fallback={<div className="text-center text-sm text-[#666666]">Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>

            <div className="mt-8 pt-6 border-t border-[#eaeaea] dark:border-[#333333] text-center">
                <Link href="/auth/login" className="text-sm font-medium text-black dark:text-white hover:underline underline-offset-4">
                    Back to login
                </Link>
            </div>
        </div>
    );
}
