'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, Check, Search, Ticket } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

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

    const isFiltersActive = searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL';

    const filteredTickets = tickets.filter(ticket => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query ||
            ticket.title?.toLowerCase().includes(query) ||
            ticket.description?.toLowerCase().includes(query) ||
            ticket.id?.toLowerCase().includes(query);
        const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
        const matchesPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 no-scrollbar transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-16">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pt-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-border flex items-center justify-center text-[10px] font-bold text-primary">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{user?.role} Workspace</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">All Tickets</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/create"
                            className="h-10 px-5 bg-foreground text-background rounded-full text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-black/5 active:scale-95 whitespace-nowrap"
                        >
                            <Ticket className="w-4 h-4" />
                            New Ticket
                        </Link>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col gap-4">
                    <div className="relative group max-w-md">
                        <input
                            type="text"
                            placeholder="Search by title, description, or ID..."
                            className="w-full h-11 bg-card border border-border rounded-xl px-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                updateFilters({ search: e.target.value });
                            }}
                        />
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground/50">
                            <Search className="w-4 h-4" />
                        </div>
                    </div>

                    {isFiltersActive && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filters:</span>
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
                                className="text-xs font-bold text-primary hover:text-primary/80 transition-colors ml-2"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>

                {/* Tickets Table */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="rounded-2xl border border-border bg-card/50 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Identifier</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Ticket Summary</th>
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
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Assignee</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredTickets.length === 0 ? (
                                        <tr>
                                            <td colSpan="6">
                                                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                                                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                                                        <Ticket className="w-6 h-6 text-muted-foreground/50" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-foreground">No tickets found</p>
                                                        <p className="text-xs text-muted-foreground">No tickets match your current filter criteria.</p>
                                                    </div>
                                                    {isFiltersActive ? (
                                                        <button
                                                            onClick={() => {
                                                                setSearchQuery(''); setStatusFilter('ALL'); setPriorityFilter('ALL');
                                                                router.replace(pathname);
                                                            }}
                                                            className="h-9 px-4 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all"
                                                        >
                                                            Clear Filters
                                                        </button>
                                                    ) : (
                                                        <Link
                                                            href="/dashboard/create"
                                                            className="h-9 px-4 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all inline-flex items-center"
                                                        >
                                                            Create Ticket
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTickets.map((ticket) => (
                                            <tr
                                                key={ticket.id}
                                                onClick={() => router.push(`/dashboard/${ticket.id}`)}
                                                className="hover:bg-muted/20 cursor-pointer transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-[11px] text-muted-foreground group-hover:text-primary transition-colors">
                                                        #{ticket.id.slice(0, 8)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{ticket.title}</span>
                                                        <span className="text-[11px] text-muted-foreground truncate max-w-md">{ticket.description}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider inline-flex items-center justify-center ${statusStyles[ticket.status] || statusStyles.CLOSED}`}>
                                                        {ticket.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${priorityColors[ticket.priority] || 'bg-gray-500'}`} />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{ticket.priority}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-border flex items-center justify-center text-[10px] font-bold text-primary transition-transform group-hover:scale-110">
                                                            {ticket.user.username?.[0]?.toUpperCase() || ticket.user.email?.[0]?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-foreground">{ticket.user.username || ticket.user.email.split('@')[0]}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-[11px] font-bold text-muted-foreground">{ticket._count.comments} Comments</span>
                                                        <span suppressHydrationWarning className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
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

            </div>
        </div>
    );
}

function HeaderFilter({ label, value, onChange, options }) {
    const selectedLabel = value === 'ALL' ? label : value.replace('_', ' ');

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-1.5 group/filter transition-colors text-muted-foreground hover:text-foreground data-[state=open]:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm relative"
                >
                    <span className="text-xs font-bold uppercase tracking-wider">{selectedLabel}</span>
                    <ChevronDown className="w-3 h-3 transition-transform duration-300 group-data-[state=open]/filter:rotate-180 text-muted-foreground group-hover/filter:text-foreground" />
                    {value !== 'ALL' && (
                        <div className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-primary rounded-full shadow-sm" />
                    )}
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-[160px] bg-card border border-border/50 rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
                    sideOffset={8}
                    align="start"
                >
                    <DropdownMenu.Item
                        onClick={() => onChange('ALL')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-all cursor-pointer outline-none ${value === 'ALL' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                    >
                        <span>{label} (ALL)</span>
                        {value === 'ALL' && <Check className="w-3 h-3" />}
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="h-px bg-border/50 my-1 mx-2" />

                    {options.map(opt => (
                        <DropdownMenu.Item
                            key={opt}
                            onClick={() => onChange(opt)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-all cursor-pointer outline-none ${value === opt ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                        >
                            <span>{opt.replace('_', ' ')}</span>
                            {value === opt && <Check className="w-3 h-3" />}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

function FilterTag({ label, onClear }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 border border-border rounded-md text-[10px] font-semibold text-muted-foreground">
            <span>{label}</span>
            <button onClick={onClear} className="hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-ring rounded-full p-0.5" type="button">✕</button>
        </div>
    );
}
