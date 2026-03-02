'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
    const [formData, setFormData] = useState({ name: '', email: '', department: '' });
    const [status, setStatus] = useState('idle');
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
            if (!res.ok) throw new Error(data.error || 'Something went wrong');

            setStatus('success');
            setFormData({ name: '', email: '', department: '' });
        } catch (err) {
            setStatus('error');
            setError(err.message);
        }
    };

    if (status === 'success') {
        return (
            <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-500 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mx-auto">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground tracking-tight">Request Received</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto font-light">
                        Your access request has been submitted. Our administrators will review it shortly.
                    </p>
                </div>
                <Link
                    href="/auth/login"
                    className="flex items-center justify-center w-full h-12 bg-[#ec4269] dark:bg-[#D4AF37] text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-[#ec4269]/20 dark:shadow-[#D4AF37]/20"
                >
                    Back to Login
                </Link>
            </div>
        );
    }

    const inputClass = "w-full h-11 px-4 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#ec4269]/60 dark:focus:border-[#D4AF37]/60 transition-all";

    return (
        <div className="space-y-7 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#ec4269]/10 dark:bg-[#D4AF37]/10 border border-[#ec4269]/20 dark:border-[#D4AF37]/20 text-[#ec4269] dark:text-[#D4AF37] mx-auto mb-3">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-light tracking-tight text-foreground">Request Access</h1>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    Authorized personnel only. Request a workspace invite.
                </p>
            </div>

            <form onSubmit={handleRequestAccess} className="space-y-4">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Full Name</label>
                        <input type="text" name="name" placeholder="John Doe" required className={inputClass} style={{ outline: 'none', boxShadow: 'none' }} value={formData.name} onChange={handleFormChange} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Work Email</label>
                        <input type="email" name="email" placeholder="john@enterprise.com" required className={inputClass} style={{ outline: 'none', boxShadow: 'none' }} value={formData.email} onChange={handleFormChange} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Department</label>
                        <select name="department" required className={`${inputClass} appearance-none`} style={{ outline: 'none', boxShadow: 'none' }} value={formData.department} onChange={handleFormChange}>
                            <option value="" disabled>Select Department</option>
                            <option value="IT">Information Technology</option>
                            <option value="HR">Human Resources</option>
                            <option value="Finance">Finance</option>
                            <option value="Operations">Operations</option>
                            <option value="Sales">Sales</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl text-center animate-in fade-in">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full h-12 bg-[#ec4269] dark:bg-[#D4AF37] text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:opacity-90 hover:scale-[1.01] transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#ec4269]/20 dark:shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
                >
                    {status === 'loading' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : 'Send Request'}
                </button>
            </form>

            <div className="pt-5 border-t border-border text-center">
                <Link href="/auth/login" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-[#ec4269] dark:hover:text-[#D4AF37] transition-colors">
                    ← Back to Login
                </Link>
            </div>
        </div>
    );
}
