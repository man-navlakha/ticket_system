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
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-6">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Invite Only</h1>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Nexus is currently restricted to authorized personnel. <br />
                    To join, please ask your administrator for an invitation link.
                </p>
            </div>

            <div className="space-y-4">
                <Link
                    href="/auth/login"
                    className="flex items-center justify-center w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-[0.98]"
                >
                    Return to Login
                </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-sm text-gray-500">
                    Received an invitation? <br />
                    Check your email for the <span className="text-white font-medium">Setup Account</span> button.
                </p>
            </div>
        </div>
    );
}
