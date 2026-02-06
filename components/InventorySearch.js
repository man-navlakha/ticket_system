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

    // Get unique statuses and types for filters
    const statuses = useMemo(() => {
        const unique = [...new Set(items.map(item => item.status).filter(Boolean))];
        return unique.sort();
    }, [items]);

    const types = useMemo(() => {
        const unique = [...new Set(items.map(item => item.type).filter(Boolean))];
        return unique.sort();
    }, [items]);

    // Filter items based on search query and filters
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            // Search filter
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query ||
                item.pid?.toLowerCase().includes(query) ||
                item.type?.toLowerCase().includes(query) ||
                item.status?.toLowerCase().includes(query) ||
                item.brand?.toLowerCase().includes(query) ||
                item.model?.toLowerCase().includes(query) ||
                item.user?.username?.toLowerCase().includes(query) ||
                item.user?.email?.toLowerCase().includes(query);

            // Status filter
            const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

            // Type filter
            const matchesType = typeFilter === 'ALL' || item.type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [items, searchQuery, statusFilter, typeFilter]);

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setTypeFilter('ALL');
    };

    const hasActiveFilters = searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL';

    // Bulk Actions
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredItems.map(item => item.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} items? This action cannot be undone.`)) return;

        setIsDeleting(true);
        try {
            const res = await fetch('/api/inventory/bulk/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (res.ok) {
                setSelectedIds([]);
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete items');
            }
        } catch (error) {
            alert('An error occurred while deleting');
        } finally {
            setIsDeleting(false);
        }
    };

    const isAdmin = userRole === 'ADMIN';

    return (
        <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by PID, brand, model, user..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Filter Dropdowns */}
                <div className="flex flex-wrap gap-3">
                    {/* Bulk Delete Button */}
                    {isAdmin && selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 animate-in fade-in zoom-in duration-200"
                        >
                            {isDeleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
                        </button>
                    )}

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all cursor-pointer appearance-none min-w-[140px]"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                    >
                        <option value="ALL">All Status</option>
                        {statuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all cursor-pointer appearance-none min-w-[140px]"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                    >
                        <option value="ALL">All Types</option>
                        {types.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all flex items-center gap-2"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-400">
                <span>
                    Showing <span className="text-white font-semibold">{filteredItems.length}</span> of{' '}
                    <span className="text-white font-semibold">{items.length}</span> items
                </span>
                {hasActiveFilters && (
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        Filters active
                    </span>
                )}
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-gray-200 uppercase font-bold text-xs">
                        <tr>
                            {isAdmin && (
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                                    />
                                </th>
                            )}
                            <th className="px-6 py-4">PID</th>
                            <th className="px-6 py-4">Serial No.</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Brand
                                <span className="text-xs text-gray-600 italic"> Model</span>
                            </th>
                            <th className="px-6 py-4">Assigned To</th>
                            <th className="px-6 py-4">Return Date</th>
                            <th className="px-6 py-4">Maintenance</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {filteredItems.map((item) => (
                            <tr key={item.id} className={`hover:bg-white/5 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-500/10' : ''}`}>
                                {isAdmin && (
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => handleSelectOne(item.id)}
                                            className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                                        />
                                    </td>
                                )}
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-mono text-white text-sm">{item.pid}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-mono text-xs text-gray-300">{item.serialNumber || '-'}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium 
                                        ${item.type === 'COMPUTER' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                        {item.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border 
                                        ${item.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            item.status === 'MAINTENANCE' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                item.status === 'RETIRED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                        {item.status || 'UNKNOWN'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{item.brand || '-'}
                                    <p className="text-xs text-gray-600 italic">{item.model || '-'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    {item.user ? (
                                        <div className="flex flex-col">
                                            <span className="text-white">{item.user.username}</span>
                                            <span className="text-xs">{item.user.email}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600 italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {item.returnDate ? (
                                        <span className={new Date(item.returnDate) < new Date() ? 'text-red-400' : ''}>
                                            {new Date(item.returnDate).toLocaleDateString()}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 font-mono text-xs">
                                    {item.maintenanceDate ? new Date(item.maintenanceDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        {(userRole === 'ADMIN' || userRole === 'AGENT') && (
                                            <Link href={`/dashboard/create?inventoryId=${item.id}`} className="text-yellow-500 hover:text-white hover:underline text-xs font-bold" title="Report Issue">
                                                Report
                                            </Link>
                                        )}
                                        <Link href={`/dashboard/inventory/${item.id}`} className="text-blue-400 hover:text-white hover:underline">
                                            View
                                        </Link>
                                        {(userRole === 'ADMIN' || userRole === 'AGENT') && (
                                            <Link href={`/dashboard/inventory/${item.id}/edit`} className="text-green-400 hover:text-white hover:underline">
                                                Edit
                                            </Link>
                                        )}
                                        {(userRole === 'ADMIN' || userRole === 'AGENT') && (
                                            <InventoryActions item={item} users={users} userRole={userRole} />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredItems.length === 0 && (
                            <tr>
                                <td colSpan={isAdmin ? 9 : 8} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <svg className="h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <p className="text-gray-500">
                                            {hasActiveFilters
                                                ? 'No items match your search criteria.'
                                                : 'No inventory items found.'}
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                onClick={clearFilters}
                                                className="text-blue-400 hover:text-blue-300 underline text-sm"
                                            >
                                                Clear all filters
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

