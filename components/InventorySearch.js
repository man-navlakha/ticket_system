'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InventoryActions from './InventoryActions';
import { Monitor, Printer, Mouse, Keyboard, Headset, HardDrive, Tablet, Phone, Laptop, ChevronDown, Check, Calendar } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { getInventoryStatusBadgeClass, getInventoryStatusLabel, INVENTORY_STATUS_OPTIONS, normalizeInventoryStatus } from '@/lib/inventory-status';

export default function InventorySearch({ items, users, userRole }) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const statuses = useMemo(() => {
        return INVENTORY_STATUS_OPTIONS.filter((status) =>
            items.some((item) => normalizeInventoryStatus(item.status) === status)
        );
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
                getInventoryStatusLabel(item.status).toLowerCase().includes(query) ||
                item.brand?.toLowerCase().includes(query) ||
                item.model?.toLowerCase().includes(query) ||
                item.user?.username?.toLowerCase().includes(query);

            const matchesStatus = statusFilter === 'ALL' || normalizeInventoryStatus(item.status) === statusFilter;
            const matchesType = typeFilter === 'ALL' || item.type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [items, searchQuery, statusFilter, typeFilter]);

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setTypeFilter('ALL');
    };

    const canManage = userRole === 'ADMIN' || userRole === 'AGENT';
    const canBulkDelete = userRole === 'ADMIN';
    const selectedCount = selectedIds.length;
    const filteredIds = filteredItems.map((item) => item.id);
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

    useEffect(() => {
        setSelectedIds((current) => current.filter((id) => items.some((item) => item.id === id)));
    }, [items]);

    const toggleSelection = (id) => {
        setSelectedIds((current) => (
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
        ));
    };

    const toggleSelectAllFiltered = () => {
        setSelectedIds((current) => {
            if (allFilteredSelected) {
                return current.filter((id) => !filteredIds.includes(id));
            }

            return [...new Set([...current, ...filteredIds])];
        });
    };

    const clearSelection = () => {
        setSelectedIds([]);
    };

    const handleBulkDelete = async () => {
        if (!canBulkDelete || selectedIds.length === 0) return;
        if (!confirm(`Delete ${selectedIds.length} selected assets? This action cannot be undone.`)) return;

        setIsBulkDeleting(true);
        try {
            const res = await fetch('/api/inventory/bulk/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete selected assets');
            }

            clearSelection();
            router.refresh();
        } catch (error) {
            alert(error.message || 'Failed to delete selected assets');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search + Active Filters Bar */}
            <div className="px-8 py-6 border-b border-border space-y-4">
                <div className="relative group max-w-md">
                    <input
                        type="text"
                        aria-label="Search inventory assets"
                        placeholder="Search by PID, brand, model, user, or serial number"
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
                            {statusFilter !== 'ALL' && <FilterTag label={`Status: ${getInventoryStatusLabel(statusFilter)}`} onClear={() => setStatusFilter('ALL')} />}
                            {typeFilter !== 'ALL' && <FilterTag label={`Type: ${formatEnumLabel(typeFilter)}`} onClear={() => setTypeFilter('ALL')} />}
                        </div>
                        <button
                            onClick={clearFilters}
                            className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                )}

                {canManage && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-muted-foreground">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-border bg-background text-foreground"
                                    checked={allFilteredSelected}
                                    onChange={toggleSelectAllFiltered}
                                    disabled={filteredIds.length === 0}
                                />
                                <span>Select all visible rows</span>
                            </label>
                            <span className="rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground">
                                {selectedCount} selected
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={clearSelection}
                                disabled={selectedCount === 0}
                                className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Clear Selection
                            </button>
                            <a
                                href={
                                    selectedCount === 0
                                        ? '#'
                                        : `/dashboard/inventory/print-qr?ids=${encodeURIComponent(selectedIds.join(','))}`
                                }
                                aria-disabled={selectedCount === 0}
                                onClick={(e) => {
                                    if (selectedCount === 0) e.preventDefault();
                                }}
                                className={`inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground transition hover:bg-muted ${selectedCount === 0 ? 'cursor-not-allowed opacity-50' : ''
                                    }`}
                            >
                                {`Print QR${selectedCount > 0 ? ` (${selectedCount})` : ''}`}
                            </a>
                            {canBulkDelete && (
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    disabled={selectedCount === 0 || isBulkDeleting}
                                    className="inline-flex items-center justify-center rounded-full bg-red-500 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isBulkDeleting ? 'Deleting...' : `Delete ${selectedCount || ''}`.trim()}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {/* Table Area */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            {canManage && (
                                <th className="w-16 px-6 py-4">
                                    <div className="flex justify-center">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-border bg-background text-foreground"
                                            checked={allFilteredSelected}
                                            onChange={toggleSelectAllFiltered}
                                            disabled={filteredIds.length === 0}
                                            aria-label="Select all visible assets"
                                        />
                                    </div>
                                </th>
                            )}
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
                                    formatOptionLabel={getInventoryStatusLabel}
                                />
                            </th>
                            <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Assigned To</th>
                            <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredItems.map((item) => (
                            <tr key={item.id} className={`transition-colors group ${selectedIds.includes(item.id) ? 'bg-primary/5' : 'hover:bg-muted/20'}`}>
                                {canManage && (
                                    <td className="px-6 py-6">
                                        <div className="flex justify-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-border bg-background text-foreground"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => toggleSelection(item.id)}
                                                aria-label={`Select asset ${item.pid}`}
                                            />
                                        </div>
                                    </td>
                                )}
                                <td className="px-8 py-6">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-foreground font-mono text-xs font-bold">{item.pid}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono tracking-tight">{item.serialNumber || 'No Serial'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                                            {item.type === 'PRINTER' ? <Printer className="w-4 h-4" /> :
                                                item.type === 'LAPTOP' ? <Laptop className="w-4 h-4" /> :
                                                    item.type === 'MOBILE' ? <Phone className="w-4 h-4" /> :
                                                        item.type === 'TABLET' ? <Tablet className="w-4 h-4" /> :
                                                            item.type === 'KEYBOARD' ? <Keyboard className="w-4 h-4" /> :
                                                                item.type === 'MOUSE' ? <Mouse className="w-4 h-4" /> :
                                                                    item.type === 'HEADSET' ? <Headset className="w-4 h-4" /> :
                                                                        (item.type === 'COMPUTER' || item.type === 'DESKTOP' || item.type === 'MONITOR') ? <Monitor className="w-4 h-4" /> :
                                                                            <HardDrive className="w-4 h-4" />}
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
                                                {item.returnDate && (
                                                    <span className="mt-1 text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                                        <Calendar className="w-2.5 h-2.5" />
                                                        Due: {new Date(item.returnDate).toLocaleDateString()}
                                                    </span>
                                                )}
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
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/dashboard/inventory/${item.id}`}
                                            aria-label={`View asset ${item.pid}`}
                                            className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
                                            title="View Details"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </Link>
                                        {canManage && (
                                            <Link
                                                href={`/dashboard/inventory/${item.id}/edit`}
                                                aria-label={`Edit asset ${item.pid}`}
                                                className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-all"
                                                title="Edit Asset"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
                                        )}
                                        {canManage && (
                                            <InventoryActions item={item} />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredItems.length === 0 && (
                            <tr><td colSpan={canManage ? 6 : 5} className="p-12 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">No assets match the current filters.</td></tr>
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
    return (
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getInventoryStatusBadgeClass(status)}`}>
            {getInventoryStatusLabel(status)}
        </span>
    );
}

function HeaderFilter({ label, value, onChange, options, formatOptionLabel }) {
    const labelFormatter = formatOptionLabel || formatEnumLabel;
    const selectedLabel = value === 'ALL' ? label : labelFormatter(value);

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-1.5 group/filter transition-colors text-muted-foreground hover:text-foreground data-[state=open]:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                    <span className="text-[10px] font-bold uppercase tracking-widest">{selectedLabel}</span>
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
                            className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-all cursor-pointer outline-none group ${value === opt ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                        >
                            <span>{labelFormatter(opt)}</span>
                            {value === opt && <Check className="w-3 h-3" />}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

function formatEnumLabel(value) {
    return String(value || '').replace(/_/g, ' ');
}

function FilterTag({ label, onClear }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted border border-border rounded-lg text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>{label}</span>
            <button onClick={onClear} className="hover:text-foreground transition-colors">✕</button>
        </div>
    );
}
