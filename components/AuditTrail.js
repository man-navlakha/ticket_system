'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditTrail({ ticketId }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchAuditLogs();
    }, [ticketId]);

    const fetchAuditLogs = async () => {
        try {
            const res = await fetch(`/api/tickets/${ticketId}/audit`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        const d = new Date(date);
        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'CREATE':
                return '✨';
            case 'UPDATE':
                return '✏️';
            case 'STATUS_CHANGE':
                return '🔄';
            case 'DELETE':
                return '🗑️';
            default:
                return '📝';
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE':
                return 'text-green-500';
            case 'UPDATE':
                return 'text-blue-500';
            case 'STATUS_CHANGE':
                return 'text-amber-500';
            case 'DELETE':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    const renderChanges = (changes) => {
        if (!changes) return null;

        return (
            <div className="mt-2 space-y-1">
                {Object.entries(changes).map(([field, change]) => (
                    <div key={field} className="text-xs bg-white/5 rounded px-2 py-1">
                        <span className="font-bold capitalize">{field}:</span>{' '}
                        <span className="text-red-400">{change.from || 'none'}</span>
                        {' → '}
                        <span className="text-green-400">{change.to}</span>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="inline-block w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="p-6 text-center text-sm text-gray-500">
                No activity history yet
            </div>
        );
    }

    return (
        <div className="space-y-3 p-4">
            {logs.map((log, index) => (
                <div
                    key={log.id}
                    className="relative pl-8 pb-4 border-l-2 border-white/10 last:border-l-0 last:pb-0"
                >
                    {/* Timeline dot */}
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-white/20 flex items-center justify-center text-[10px]">
                        {getActionIcon(log.action)}
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs font-bold ${getActionColor(log.action)}`}>
                                {log.action.replace('_', ' ')}
                            </p>
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                {formatDate(log.createdAt)}
                            </span>
                        </div>

                        {log.user && (
                            <p className="text-xs text-gray-400">
                                by {log.user.username || log.user.email}
                                {log.user.role !== 'USER' && (
                                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/70">
                                        {log.user.role}
                                    </span>
                                )}
                            </p>
                        )}

                        {renderChanges(log.changes)}

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <details className="text-[10px] text-gray-500 mt-2">
                                <summary className="cursor-pointer hover:text-gray-400">
                                    View details
                                </summary>
                                <pre className="mt-1 p-2 bg-white/5 rounded overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
