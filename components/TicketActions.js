'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TicketActions({ ticketId, currentStatus, userRole }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showResolutionModal, setShowResolutionModal] = useState(false);
    const [resolutionText, setResolutionText] = useState('');

    const isPrivileged = userRole === 'ADMIN' || userRole === 'AGENT';

    const handleUpdateStatus = async (newStatus, resolutionDetails = null) => {
        setIsUpdating(true);
        try {
            const body = { status: newStatus };
            if (resolutionDetails) {
                body.resolutionDetails = resolutionDetails;
            }

            const res = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setShowResolutionModal(false);
                setResolutionText('');
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

    const onStatusClick = (status) => {
        if (status === 'RESOLVED' && currentStatus !== 'RESOLVED') {
            setShowResolutionModal(true);
        } else {
            handleUpdateStatus(status);
        }
    };

    const submitResolution = (e) => {
        e.preventDefault();
        handleUpdateStatus('RESOLVED', resolutionText);
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
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 py-4 border-t border-white/5 mt-4">
            {isPrivileged && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 sm:mb-0 sm:mr-2">Update Status</span>
                    <div className="flex flex-wrap bg-white/5 p-1 rounded-lg border border-white/10 w-full sm:w-auto">
                        {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => onStatusClick(status)}
                                disabled={isUpdating || currentStatus === status}
                                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${currentStatus === status
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
                className="w-full md:w-auto ml-0 md:ml-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-xs font-bold disabled:opacity-50"
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

            {/* Resolution Modal */}
            {showResolutionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl w-full max-w-lg shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Resolution Details</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Please provide a detailed description of how this issue was resolved.
                            This information will be used to automatically generate a Knowledge Base article.
                        </p>

                        <form onSubmit={submitResolution}>
                            <textarea
                                value={resolutionText}
                                onChange={(e) => setResolutionText(e.target.value)}
                                className="w-full h-32 bg-white/5 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                                placeholder="Describe the steps taken to resolve the issue..."
                                required
                            />

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowResolutionModal(false)}
                                    className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 font-bold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!resolutionText.trim() || isUpdating}
                                    className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-bold text-sm disabled:opacity-50"
                                >
                                    {isUpdating ? 'Resolving...' : 'Confirm Resolution'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
