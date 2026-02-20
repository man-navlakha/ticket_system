'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function TicketsClient({ user, tickets }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
    const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'ALL');

    const updateFilters = (newFilters) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value && value !== 'ALL') {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
        router.replace(`${pathname}?${params.toString()}`);
    };

    const statusStyles = {
        OPEN: 'bg-green-500/10 text-green-500 border-green-500/20',
        IN_PROGRESS: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        RESOLVED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        CLOSED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
        REOPENED: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    };

    const priorityColors = {
        HIGH: 'bg-red-500',
        MEDIUM: 'bg-amber-500',
        LOW: 'bg-green-500',
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">Workspace</Link>
                    <span>/</span>
                    <span className="text-foreground">All Tickets</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Ticket Fleet</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                            Complete visibility into organization-wide support lifecycle and resolution metrics.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Status Summary */}
            {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
                <div className="flex items-center gap-4 px-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Active Filters:</span>
                    <div className="flex flex-wrap gap-2">
                        {searchQuery && <FilterTag label={`Search: ${searchQuery}`} onClear={() => { setSearchQuery(''); updateFilters({ search: '' }); }} />}
                        {statusFilter !== 'ALL' && <FilterTag label={`Status: ${statusFilter}`} onClear={() => { setStatusFilter('ALL'); updateFilters({ status: 'ALL' }); }} />}
                        {priorityFilter !== 'ALL' && <FilterTag label={`Priority: ${priorityFilter}`} onClear={() => { setPriorityFilter('ALL'); updateFilters({ priority: 'ALL' }); }} />}
                    </div>
                    <button
                        onClick={() => {
                            setSearchQuery(''); setStatusFilter('ALL'); setPriorityFilter('ALL');
                            router.replace(pathname);
                        }}
                        className="ml-auto text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest transition-colors"
                    >
                        Clear All
                    </button>
                </div>
            )}

            {/* Tickets Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border bg-muted/20">
                                <th className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-default">
                                        Identifier
                                    </div>
                                </th>
                                <th className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-default">
                                        Ticket Summary
                                    </div>
                                </th>
                                <th className="px-6 py-4">
                                    <HeaderFilter
                                        label="Status"
                                        value={statusFilter}
                                        onChange={(v) => { setStatusFilter(v); updateFilters({ status: v }); }}
                                        options={['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED', 'REOPENED']}
                                    />
                                </th>
                                <th className="px-6 py-4">
                                    <HeaderFilter
                                        label="Priority"
                                        value={priorityFilter}
                                        onChange={(v) => { setPriorityFilter(v); updateFilters({ priority: v }); }}
                                        options={['HIGH', 'MEDIUM', 'LOW']}
                                    />
                                </th>
                                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Assignee</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Activity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-sm font-medium text-muted-foreground italic">
                                        No tickets matching the current criteria.
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr
                                        key={ticket.id}
                                        onClick={() => router.push(`/dashboard/${ticket.id}`)}
                                        className="group hover:bg-muted/30 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-5">
                                            <span className="font-mono text-[11px] text-muted-foreground group-hover:text-primary transition-colors">
                                                #{ticket.id.slice(0, 8)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{ticket.title}</span>
                                                <span className="text-[11px] text-muted-foreground truncate max-w-md">{ticket.description}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${statusStyles[ticket.status] || statusStyles.CLOSED}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${priorityColors[ticket.priority] || 'bg-gray-500'}`} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{ticket.priority}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-[9px] font-bold text-muted-foreground uppercase">
                                                    {ticket.user.username?.[0] || ticket.user.email?.[0]}
                                                </div>
                                                <span className="text-[11px] font-medium text-muted-foreground">{ticket.user.username || ticket.user.email.split('@')[0]}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[11px] font-bold text-muted-foreground">{ticket._count.comments} Comments</span>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
function HeaderFilter({ label, value, onChange, options }) {
    return (
        <div className="relative group/filter">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-transparent pr-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest focus:outline-none cursor-pointer hover:text-foreground transition-colors"
            >
                <option value="ALL" className="bg-background text-foreground">{label}</option>
                {options.map(opt => (
                    <option key={opt} value={opt} className="bg-background text-foreground">{opt.replace('_', ' ')}</option>
                ))}
            </select>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover/filter:text-foreground transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            {value !== 'ALL' && (
                <div className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
        </div>
    );
}

function FilterTag({ label, onClear }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 border border-border rounded-lg text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>{label}</span>
            <button onClick={onClear} className="hover:text-foreground transition-colors">✕</button>
        </div>
    );
}
