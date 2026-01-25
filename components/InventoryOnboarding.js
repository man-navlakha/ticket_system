'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function InventoryOnboarding() {
    const [hasInventory, setHasInventory] = useState(null); // null = loading
    const [pid, setPid] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkInventory();
    }, []);

    const checkInventory = async () => {
        try {
            const res = await fetch('/api/inventory');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setHasInventory(true);
                } else {
                    setHasInventory(false);
                }
            }
        } catch (err) {
            console.error('Failed to check inventory', err);
        }
    };

    const handleClaim = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/inventory/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to claim device');
            } else {
                setHasInventory(true);
                router.refresh(); // Refresh current route to update data
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // If loading or has inventory, don't show anything
    if (hasInventory === null || hasInventory === true) {
        return null;
    }

    return (
        <div className="bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-md sticky top-16 z-40">
            <div className="container mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-full text-amber-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-amber-500">Action Required</h3>
                        <p className="text-sm text-gray-400">Please link your device (PID) to your account to create tickets.</p>
                    </div>
                </div>

                <form onSubmit={handleClaim} className="flex items-center gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Enter PID (e.g. LAP-001)"
                        value={pid}
                        onChange={(e) => setPid(e.target.value)}
                        className="px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 w-full md:w-48"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                        {isSubmitting ? 'Linking...' : 'Link Device'}
                    </button>

                </form>
            </div>
            {error && (
                <div className="bg-red-500/10 border-t border-red-500/20 px-6 py-2 text-center text-red-400 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
