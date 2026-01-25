'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TicketActions({ ticketId, currentStatus, userRole }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const isPrivileged = userRole === 'ADMIN' || userRole === 'AGENT';

    const handleUpdateStatus = async (newStatus) => {
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update status');
            }
        } catch (err) {
            alert('An error occurred. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/tickets/${ticketId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.push('/dashboard');
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete ticket');
            }
        } catch (err) {
            alert('An error occurred. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-4 py-4 border-t border-white/5 mt-4">
            {isPrivileged && (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mr-2">Update Status</span>
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                        {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => handleUpdateStatus(status)}
                                disabled={isUpdating || currentStatus === status}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${currentStatus === status
                                        ? 'bg-white text-black shadow-lg'
                                        : 'text-gray-400 hover:text-white disabled:opacity-50'
                                    }`}
                            >
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-xs font-bold disabled:opacity-50"
            >
                {isDeleting ? 'Deleting...' : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Ticket
                    </>
                )}
            </button>
        </div>
    );
}
