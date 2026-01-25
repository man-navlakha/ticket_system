'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserInventoryLink() {
    const [pid, setPid] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const router = useRouter();

    const handleLink = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/inventory/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'Failed to link device' });
            } else {
                setMessage({ type: 'success', text: 'Device linked successfully!' });
                setPid('');
                router.refresh();
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white">Link New Device</h2>
                    <p className="text-sm text-gray-400">Found a new piece of hardware? Enter the PID to add it to your profile.</p>
                </div>

                <form onSubmit={handleLink} className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="PID (e.g. LAP-001)"
                            value={pid}
                            onChange={(e) => setPid(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-white transition-all outline-none"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-white text-black font-bold rounded-xl px-6 py-3 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Linking...' : 'Link Device'}
                    </button>
                </form>
            </div>

            {message.text && (
                <div className={`mt-4 p-3 rounded-xl border text-sm font-medium animate-in fade-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}
        </div>
    );
}
