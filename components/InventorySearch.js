'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InventoryActions from './InventoryActions';

export default function InventorySearch({ items, users, userRole }) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');

    const statuses = useMemo(() => {
        const unique = [...new Set(items.map(item => item.status).filter(Boolean))];
        return unique.sort();
    }, [items]);

    const types = useMemo(() => {
        const unique = [...new Set(items.map(item => item.type).filter(Boolean))];
        return unique.sort();
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query ||
                item.pid?.toLowerCase().includes(query) ||
                item.serialNumber?.toLowerCase().includes(query) ||
                item.assignedUser?.toLowerCase().includes(query) ||
                item.department?.toLowerCase().includes(query) ||
                item.location?.toLowerCase().includes(query) ||
                item.type?.toLowerCase().includes(query) ||
                item.status?.toLowerCase().includes(query) ||
                item.brand?.toLowerCase().includes(query) ||
                item.model?.toLowerCase().includes(query) ||
                item.user?.username?.toLowerCase().includes(query);

            const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
            const matchesType = typeFilter === 'ALL' || item.type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [items, searchQuery, statusFilter, typeFilter]);

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setTypeFilter('ALL');
    };

    const isAdmin = userRole === 'ADMIN' || userRole === 'AGENT';

    return (
        <div className="flex flex-col h-full">
            {/* Search + Active Filters Bar */}
            <div className="px-8 py-6 border-b border-border space-y-4">
                <div className="relative group max-w-md">
                    <input
                        type="text"
                        placeholder="Search by PID, brand, model, user, serial..."
                        className="w-full h-11 bg-input/50 border border-input rounded-xl px-4 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-40 text-muted-foreground">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {(searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Filters:</span>
                        <div className="flex flex-wrap gap-2">
                            {searchQuery && <FilterTag label={`Scope: ${searchQuery}`} onClear={() => setSearchQuery('')} />}
                            {statusFilter !== 'ALL' && <FilterTag label={`Status: ${statusFilter}`} onClear={() => setStatusFilter('ALL')} />}
                            {typeFilter !== 'ALL' && <FilterTag label={`Type: ${typeFilter}`} onClear={() => setTypeFilter('ALL')} />}
                        </div>
                        <button
                            onClick={clearFilters}
                            className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                )}
            </div>
            {/* Table Area */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Asset ID</th>
                            <th className="px-8 py-4">
                                <HeaderFilter
                                    label="Category"
                                    value={typeFilter}
                                    onChange={setTypeFilter}
                                    options={types}
                                />
                            </th>
                            <th className="px-8 py-4">
                                <HeaderFilter
                                    label="Status"
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    options={statuses}
                                />
                            </th>
                            <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Assigned To</th>
                            <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredItems.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-foreground font-mono text-xs font-bold">{item.pid}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono tracking-tight">{item.serialNumber || 'No Serial'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                                            {item.type === 'COMPUTER' ? (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1m-6 10a2 2 0 01-2-2v-5a2 2 0 012-2h7a2 2 0 012 2v5a2 2 0 01-2 2h-7z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-foreground tracking-tight">{item.brand}</span>
                                            <span className="text-xs text-muted-foreground">{item.model}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <StatusBadge status={item.status} />
                                </td>
                                <td className="px-8 py-6">
                                    {item.user ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:scale-110 transition-transform">
                                                {item.user.username?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-foreground tracking-tight">{item.user.username}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">{item.user.email}</span>
                                            </div>
                                        </div>
                                    ) : item.assignedUser ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-500 group-hover:scale-110 transition-transform">
                                                {item.assignedUser[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-amber-500">{item.assignedUser}</span>
                                                <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">External Entity</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/dashboard/inventory/${item.id}`}
                                            className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
                                            title="View Details"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </Link>
                                        {isAdmin && (
                                            <Link
                                                href={`/dashboard/inventory/${item.id}/edit`}
                                                className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-all"
                                                title="Edit Asset"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
                                        )}
                                        {isAdmin && (
                                            <InventoryActions item={item} users={users} userRole={userRole} />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredItems.length === 0 && (
                            <tr><td colSpan={5} className="p-12 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">No assets match the current filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Record {filteredItems.length} of {items.length}
                </span>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const colors = {
        ACTIVE: 'bg-green-500/10 text-green-500 border-green-500/20',
        MAINTENANCE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        RETIRED: 'bg-red-500/10 text-red-500 border-red-500/20',
        STORAGE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${colors[status] || 'bg-muted text-muted-foreground border-border'}`}>
            {status?.replace('_', ' ')}
        </span>
    );
}

function HeaderFilter({ label, value, onChange, options }) {
    return (
        <div className="relative group/filter inline-block">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-transparent pr-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest focus:outline-none cursor-pointer hover:text-foreground transition-colors"
                title={`Filter by ${label}`}
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
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted border border-border rounded-lg text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>{label}</span>
            <button onClick={onClear} className="hover:text-foreground transition-colors">✕</button>
        </div>
    );
}
