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
    const [selectedIds, setSelectedIds] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);

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
            {/* Control Bar */}
            <div className="p-4 border-b border-white/5 bg-white/[0.01] flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                    <svg className="absolute left-3.5 top-3 w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-black border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all [color-scheme:dark]"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Status Select */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 px-4 bg-black border border-white/10 rounded-lg text-xs font-bold text-gray-400 focus:outline-none focus:border-white/30 transition-all cursor-pointer hover:bg-white/[0.02] [color-scheme:dark]"
                    >
                        <option value="ALL">All Status</option>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {/* Type Select */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-10 px-4 bg-black border border-white/10 rounded-lg text-xs font-bold text-gray-400 focus:outline-none focus:border-white/30 transition-all cursor-pointer hover:bg-white/[0.02] [color-scheme:dark]"
                    >
                        <option value="ALL">All Types</option>
                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    {(searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
                        <button
                            onClick={clearFilters}
                            className="h-10 px-3 text-[11px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-transparent border-b border-white/5">
                        <tr>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Asset ID</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Hardware</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Status</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Assigned To</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {filteredItems.map((item) => (
                            <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="px-5 py-5">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-white font-mono text-xs font-bold">{item.pid}</span>
                                        <span className="text-[10px] text-gray-600 font-mono tracking-tight">{item.serialNumber || 'No Serial'}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
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
                                            <span className="text-sm font-semibold text-white tracking-tight">{item.brand}</span>
                                            <span className="text-xs text-gray-500">{item.model}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-5">
                                    <StatusBadge status={item.status} />
                                </td>
                                <td className="px-5 py-5">
                                    {item.user ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                {item.user.username?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-300">{item.user.username}</span>
                                                <span className="text-[10px] text-gray-600 truncate max-w-[120px]">{item.user.email}</span>
                                            </div>
                                        </div>
                                    ) : item.assignedUser ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-bold text-amber-500/50">
                                                {item.assignedUser[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-amber-500/80">{item.assignedUser}</span>
                                                <span className="text-[9px] text-gray-600 uppercase tracking-tighter">External Entity</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] uppercase font-bold text-gray-700 tracking-widest italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-5 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/dashboard/inventory/${item.id}`}
                                            className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
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
                                                className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-green-400 hover:bg-green-400/10 transition-all"
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
                            <tr>
                                <td colSpan={5} className="py-24 text-center">
                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <div className="p-4 bg-white/[0.03] rounded-full">
                                            <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-gray-400">No assets found</p>
                                            <p className="text-[11px] text-gray-600 max-w-xs">Try adjusting your filters or search query to find the hardware you're looking for.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination / Total count footer */}
            <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
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
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
            {status}
        </span>
    );
}
