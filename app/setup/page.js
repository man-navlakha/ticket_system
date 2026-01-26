'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SetupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username');
        const phoneNumber = formData.get('phoneNumber');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, username, phoneNumber, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to setup account');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-2">Invalid Invite</h1>
                    <p className="text-gray-400">No invitation token was provided.</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-black border border-white/10 p-8 rounded-xl text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Account Active</h2>
                    <p className="text-gray-400">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans selection:bg-gray-800">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome to the Team</h1>
                    <p className="mt-2 text-gray-400">Set up your account to get started.</p>
                </div>

                <div className="bg-black border border-white/10 rounded-xl p-8 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <form onSubmit={onSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Username</label>
                            <input
                                name="username"
                                type="text"
                                required
                                placeholder="johndoe"
                                className="w-full bg-black border border-white/20 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Phone Number</label>
                            <input
                                name="phoneNumber"
                                type="tel"
                                required
                                placeholder="+1 (555) 000-0000"
                                className="w-full bg-black border border-white/20 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">New Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                className="w-full bg-black border border-white/20 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Confirm Password</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                className="w-full bg-black border border-white/20 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-semibold rounded-md py-2.5 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Setting up...' : 'Complete Setup'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function SetupAccountPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <p className="text-gray-400">Loading setup...</p>
                </div>
            </div>
        }>
            <SetupForm />
        </Suspense>
    );
}
