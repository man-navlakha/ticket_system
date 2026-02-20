'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileCompletion({ user }) {
    const [hasInventory, setHasInventory] = useState(null); // null = loading
    const [isOpen, setIsOpen] = useState(false);
    const [pid, setPid] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    // Check for user existence
    if (!user) return null;

    // Check if fields are missing
    const missingPhone = user ? !user.phoneNumber : false;

    useEffect(() => {
        checkInventory();
    }, []);

    const checkInventory = async () => {
        try {
            const res = await fetch('/api/inventory');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const userItems = data.filter(item => item.userId === user.id);
                    setHasInventory(userItems.length > 0);
                } else {
                    setHasInventory(false);
                }
            }
        } catch (err) {
            console.error('Failed to check inventory', err);
        }
    };

    if (hasInventory === null) return null;

    const missingInventory = !hasInventory;

    if (!missingPhone && !missingInventory) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsSubmitting(true);

        try {
            if (missingPhone && phoneNumber) {
                const res = await fetch('/api/user/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber }),
                });
                if (!res.ok) throw new Error('Failed to update phone number');
            }

            if (missingInventory && pid) {
                const res = await fetch('/api/inventory/claim', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pid }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to claim device');
            }

            setMessage('Profile updated successfully!');
            setTimeout(() => {
                setIsOpen(false);
                router.refresh();
                if (pid) setHasInventory(true);
            }, 1500);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Banner */}
            <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-md sticky top-0 z-[100] border-b border-white/10 shadow-2xl">
                <div className="container mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-full">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Profile Incomplete</h3>
                            <p className="text-xs text-blue-100">
                                {missingPhone && missingInventory ? "Please add your phone number and link a device." :
                                    missingPhone ? "Please add your phone number." :
                                        "Please link your device to create tickets."}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="bg-white text-blue-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shadow-lg whitespace-nowrap"
                    >
                        Complete Profile
                    </button>
                </div>
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-card-foreground">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            ✕
                        </button>

                        <h2 className="text-xl font-bold mb-1 text-foreground">Complete Your Profile</h2>
                        <p className="text-muted-foreground text-sm mb-6">Fill in the missing details to fully activate your account.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {missingPhone && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                        required
                                    />
                                </div>
                            )}

                            {missingInventory && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Device PID</label>
                                    <input
                                        type="text"
                                        placeholder="Enter PID (e.g. LAP-001)"
                                        value={pid}
                                        onChange={(e) => setPid(e.target.value)}
                                        className="w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                        required
                                    />
                                    <p className="text-[10px] text-muted-foreground">You can find this on the sticker on your device.</p>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                                    {error}
                                </div>
                            )}

                            {message && (
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm text-center">
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : 'Save & Continue'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
