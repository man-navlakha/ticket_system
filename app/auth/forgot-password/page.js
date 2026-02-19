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
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
                <p className="text-sm text-gray-500 font-medium">We'll send you a recovery link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Email Address</label>
                    <input
                        type="email"
                        placeholder="user@enterprise.com"
                        required
                        className="w-full h-12 px-4 bg-black border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all focus:bg-white/[0.02]"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                {message && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-xl text-center">
                        {message}
                    </div>
                )}

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
                    {loading ? 'Sending...' : 'Send Recovery Link'}
                </button>
            </form>

            <div className="pt-6 border-t border-white/5 text-center">
                <Link href="/auth/login" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-white transition-colors">
                    Return to login
                </Link>
            </div>
        </div>
    );
}
