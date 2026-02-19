'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

function SetupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();

        if (!acceptedTerms) {
            setError("You must agree to the Terms & Conditions.");
            return;
        }

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
            }, 3000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Invalid Session</h1>
                <p className="text-gray-500 max-w-xs mx-auto">This invitation link is missing a valid token or has expired.</p>
                <Link href="/auth/login" className="inline-block text-sm font-bold text-white hover:underline transition-all">
                    Return to login
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                <div className="w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-green-500/20 shadow-2xl shadow-green-500/5">
                    <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-white tracking-tighter">Setup Complete</h2>
                    <p className="text-gray-500 font-medium">Your workspace identity is active. Redirecting to your dashboard...</p>
                </div>
                <div className="flex justify-center pt-4">
                    <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-white animate-[progress_3s_ease-in-out]" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Form Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter text-white">Join the Workspace</h1>
                <p className="text-sm text-gray-500 font-medium tracking-tight">Set up your enterprise profile to begin.</p>
            </div>

            <div className="p-1 rounded-[2.5rem] bg-white/[0.01] border border-white/5 backdrop-blur-xl">
                <div className="bg-gradient-to-b from-white/[0.04] to-transparent p-8 md:p-10 rounded-[2.2rem] border border-white/5 shadow-2xl">
                    <form onSubmit={onSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold rounded-xl text-center animate-in shake-in-1 duration-300">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <InputField
                                label="Workspace Identity"
                                name="username"
                                placeholder="Display Name / Handle"
                                type="text"
                                required
                            />
                            <InputField
                                label="Phone Number"
                                name="phoneNumber"
                                placeholder="+1 (555) 000-0000"
                                type="tel"
                                required
                            />
                            <InputField
                                label="Access Password"
                                name="password"
                                type="password"
                                required
                            />
                            <InputField
                                label="Verify Password"
                                name="confirmPassword"
                                type="password"
                                required
                            />
                        </div>

                        {/* Terms checkbox */}
                        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group cursor-pointer" onClick={() => setAcceptedTerms(!acceptedTerms)}>
                            <div className={`mt-0.5 w-5 h-5 rounded-md border transition-all flex items-center justify-center shrink-0 ${acceptedTerms ? 'bg-white border-white' : 'border-white/20 group-hover:border-white/40'}`}>
                                {acceptedTerms && (
                                    <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500 leading-tight font-medium">
                                I agree to the <span className="text-gray-300 hover:text-white transition-colors underline underline-offset-4">Terms of Service</span> and <span className="text-gray-300 hover:text-white transition-colors underline underline-offset-4">Privacy Policy</span>.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-white/5 mt-2"
                        >
                            {loading ? 'Configuring Account...' : 'Initialize Identity'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Footer Help */}
            <div className="text-center pt-2">
                <Link href="/dashboard/help" className="text-[10px] font-bold text-gray-700 uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Need assistance with onboarding?
                </Link>
            </div>
        </div>
    );
}

function InputField({ label, ...props }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">{label}</label>
            <input
                {...props}
                className="w-full h-11 px-4 bg-black border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-800 focus:outline-none focus:border-white/30 transition-all focus:bg-white/[0.02]"
            />
        </div>
    );
}

export default function SetupAccountPage() {
    return (
        <div className="min-h-screen bg-black text-white px-6 selection:bg-white/10 relative overflow-hidden flex flex-col items-center justify-center font-sans">
            {/* Background Orbs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[100px] rounded-full -z-10" />

            <div className="max-w-[440px] w-full py-12">
                {/* Branding */}
                <div className="flex flex-col items-center mb-12 space-y-4">
                    <div className="p-4 bg-white/[0.03] backdrop-blur-xl rounded-[24px] border border-white/10 shadow-2xl relative group overflow-hidden">
                        <Image
                            src="/logo_my.png"
                            alt="Logo"
                            width={42}
                            height={42}
                            priority
                        />
                    </div>
                    <div className="text-center">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-[0.3em]">Enterprise Network</h2>
                        <h3 className="text-sm font-bold text-white tracking-widest mt-1">Man's Support Desk</h3>
                    </div>
                </div>

                <Suspense fallback={
                    <div className="text-center py-20">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                    </div>
                }>
                    <SetupForm />
                </Suspense>
            </div>
        </div>
    );
}
