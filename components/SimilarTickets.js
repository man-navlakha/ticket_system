'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SimilarTickets({ ticketDescription, userRole, ticketId }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    // Only show for ADMIN and AGENT
    const canView = userRole === 'ADMIN' || userRole === 'AGENT';

    useEffect(() => {
        if (canView && ticketDescription) {
            fetchSimilarTickets();
        } else {
            setLoading(false);
        }
    }, [ticketDescription, canView]);

    const fetchSimilarTickets = async () => {
        try {
            const res = await fetch('/api/ai/similar-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: ticketDescription, limit: 5, ticketId }),
            });

            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets);
            }
        } catch (error) {
            console.error('Failed to fetch similar tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!canView) {
        return null;
    }

    return (
        <div className="bg-white/5 rounded-lg border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h3 className="text-sm font-bold">Similar Resolved Tickets</h3>
                    {tickets.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                            {tickets.length}
                        </span>
                    )}
                </div>
                {tickets.length > 3 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                        {expanded ? 'Show less' : 'Show all'}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                </div>
            ) : tickets.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">
                    No similar tickets found
                </p>
            ) : (
                <div className="space-y-2">
                    {tickets.slice(0, expanded ? tickets.length : 3).map((ticket) => (
                        <Link
                            key={ticket.id}
                            href={`/dashboard/${ticket.id}`}
                            className="block p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                        >
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="text-xs font-bold group-hover:text-blue-400 transition-colors line-clamp-1">
                                    {ticket.title}
                                </h4>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap ${ticket.priority === 'HIGH'
                                    ? 'bg-red-500/20 text-red-400'
                                    : ticket.priority === 'MEDIUM'
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-green-500/20 text-green-400'
                                    }`}>
                                    {ticket.priority}
                                </span>
                            </div>

                            <p className="text-[10px] text-gray-400 line-clamp-2 mb-2">
                                {ticket.description}
                            </p>

                            {ticket.category && (
                                <div className="flex items-center gap-1 mb-2">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        {ticket.category}
                                    </span>
                                </div>
                            )}

                            {ticket.tags && ticket.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {ticket.tags.slice(0, 3).map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {ticket.lastComment && (
                                <div className="mt-2 pt-2 border-t border-white/5">
                                    <p className="text-[10px] text-gray-500 italic line-clamp-2">
                                        💡 {ticket.lastComment}
                                    </p>
                                </div>
                            )}

                            <div className="mt-2 text-[9px] text-gray-600">
                                Resolved {new Date(ticket.resolvedAt).toLocaleDateString()}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
