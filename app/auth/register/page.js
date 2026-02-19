'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
    const [formData, setFormData] = useState({ name: '', email: '', department: '' });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [error, setError] = useState('');

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRequestAccess = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setError('');

        try {
            const res = await fetch('/api/access-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setStatus('success');
            setFormData({ name: '', email: '', department: '' });
        } catch (err) {
            setStatus('error');
            setError(err.message);
        }
    };

    if (status === 'success') {
        return (
            <div className="space-y-8 py-4 animate-in fade-in zoom-in-95 duration-500 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 mb-2">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">Request Received</h2>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                        Your request for access has been submitted. Our administrators will review it shortly.
                    </p>
                </div>
                <Link
                    href="/auth/login"
                    className="flex items-center justify-center w-full h-12 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98]"
                >
                    Back to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 py-2 animate-in fade-in duration-700">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-blue-500/5 border border-blue-500/10 text-blue-500 mb-2">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-wider">Request Access</h1>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Authorized personnel only. Request a workspace invite.
                    </p>
                </div>
            </div>

            <form onSubmit={handleRequestAccess} className="space-y-4">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="John Doe"
                            required
                            className="w-full h-11 px-4 bg-black border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all focus:bg-white/[0.02] [color-scheme:dark]"
                            value={formData.name}
                            onChange={handleFormChange}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Work Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="john@enterprise.com"
                            required
                            className="w-full h-11 px-4 bg-black border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all focus:bg-white/[0.02] [color-scheme:dark]"
                            value={formData.email}
                            onChange={handleFormChange}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Department</label>
                        <select
                            name="department"
                            required
                            className="w-full h-11 px-4 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30 transition-all focus:bg-white/[0.02] appearance-none [color-scheme:dark]"
                            value={formData.department}
                            onChange={handleFormChange}
                        >
                            <option value="" disabled className="text-gray-700">Select Department</option>
                            <option value="IT">Information Technology</option>
                            <option value="HR">Human Resources</option>
                            <option value="Finance">Finance</option>
                            <option value="Operations">Operations</option>
                            <option value="Sales">Sales</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold rounded-xl text-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full h-12 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-white/5"
                >
                    {status === 'loading' ? 'Submitting...' : 'Send Request'}
                </button>
            </form>

            <div className="pt-6 border-t border-white/5 text-center">
                <Link href="/auth/login" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">
                    Back to Login
                </Link>
            </div>
        </div>
    );
}
