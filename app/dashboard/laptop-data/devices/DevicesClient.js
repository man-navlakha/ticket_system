'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    AlertTriangle,
    ArrowUpCircle,
    Check,
    CheckCircle2,
    GitBranch,
    HelpCircle,
    MonitorSmartphone,
    Pencil,
    RefreshCw,
    Search,
    SlidersHorizontal,
    UploadCloud,
    X,
    Wifi,
} from 'lucide-react';
import { toast } from 'sonner';

const UPDATE_STATUS_FILTERS = [
    { value: 'all', label: 'All', icon: MonitorSmartphone },
    { value: 'outdated', label: 'Outdated', icon: AlertTriangle },
    { value: 'latest', label: 'Latest', icon: CheckCircle2 },
    { value: 'unknown', label: 'Unknown', icon: HelpCircle },
    { value: 'newer', label: 'Newer', icon: ArrowUpCircle },
];

const DEVICE_STATE_FILTERS = [
    { value: 'all', label: 'All', icon: MonitorSmartphone },
    { value: 'online', label: 'Online', icon: Wifi },
    { value: 'offline', label: 'Offline', icon: X },
    { value: 'unknown', label: 'Unknown', icon: HelpCircle },
];

const UPDATE_STATUS_META = {
    latest: {
        label: 'Latest',
        className: 'border-green-500/20 bg-green-500/10 text-green-600',
        dotClassName: 'bg-green-500',
    },
    outdated: {
        label: 'Outdated',
        className: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-500',
        dotClassName: 'bg-amber-500',
    },
    unknown: {
        label: 'Unknown',
        className: 'border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-300',
        dotClassName: 'bg-slate-500',
    },
    newer: {
        label: 'Newer',
        className: 'border-blue-500/20 bg-blue-500/10 text-blue-600',
        dotClassName: 'bg-blue-500',
    },
};

const UPDATE_STATUS_SORT_ORDER = {
    outdated: 0,
    unknown: 1,
    newer: 2,
    latest: 3,
};

const DEFAULT_AGENT_UPDATE_FORM = {
    version: '',
    downloadUrl: '',
    sha256: '',
    isMandatory: false,
    makeActive: false,
    releaseNotes: '',
};

export default function DevicesClient() {
    const router = useRouter();
    const [devices, setDevices] = useState([]);
    const [versionSummary, setVersionSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [summaryError, setSummaryError] = useState('');
    const [search, setSearch] = useState('');
    const [updateStatus, setUpdateStatus] = useState('all');
    const [deviceStatusFilter, setDeviceStatusFilter] = useState('all');
    const [versionFilter, setVersionFilter] = useState('');
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'lastSeenAtUtc', direction: 'desc' });
    const [editingDeviceCode, setEditingDeviceCode] = useState('');
    const [nicknameDraft, setNicknameDraft] = useState('');
    const [savingNickname, setSavingNickname] = useState('');

    const fetchDevices = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            setSummaryError('');

            const params = new URLSearchParams();
            if (updateStatus !== 'all') {
                params.set('updateStatus', updateStatus);
            }

            const devicesUrl = `/api/admin/devices${params.toString() ? `?${params.toString()}` : ''}`;
            const [devicesResult, summaryResult] = await Promise.allSettled([
                fetchJson(devicesUrl, 'Unable to load devices.'),
                fetchJson('/api/admin/devices/version-summary', 'Unable to load version summary.'),
            ]);

            if (devicesResult.status === 'rejected') {
                throw devicesResult.reason;
            }

            setDevices(Array.isArray(devicesResult.value) ? devicesResult.value : []);

            if (summaryResult.status === 'fulfilled') {
                setVersionSummary(summaryResult.value && typeof summaryResult.value === 'object' ? summaryResult.value : null);
            } else {
                setVersionSummary(null);
                setSummaryError(summaryResult.reason?.message || 'Unable to load version summary.');
            }
        } catch (fetchError) {
            setError(fetchError.message || 'Unable to load devices.');
        } finally {
            setLoading(false);
        }
    }, [updateStatus]);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    const filteredDevices = useMemo(() => {
        const term = search.trim().toLowerCase();
        const versionTerm = versionFilter.trim().toLowerCase();
        const statusTerm = deviceStatusFilter.toLowerCase();
        const searchedDevices = devices.filter((device) => {
            const searchableValues = [device.deviceCode, device.hostname, device.username, device.status, device.agentVersion, device.latestVersion, device.updateStatus, device.nickname]
                .filter(Boolean)
                .map((value) => String(value).toLowerCase());
            const matchesSearch = !term || searchableValues.some((value) => value.includes(term));
            const normalizedDeviceStatus = String(device.status || 'unknown').toLowerCase();
            const matchesDeviceStatus = statusTerm === 'all' || normalizedDeviceStatus === statusTerm;
            const matchesVersion = !versionTerm || [device.agentVersion, device.latestVersion]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(versionTerm));

            return matchesSearch && matchesDeviceStatus && matchesVersion;
        });

        return searchedDevices
            .map((device, index) => ({ device, index }))
            .sort((a, b) => {
                const result = compareDevices(a.device, b.device, sortConfig);
                return result || a.index - b.index;
            })
            .map(({ device }) => device);
    }, [deviceStatusFilter, devices, search, sortConfig, versionFilter]);

    const activeAdvancedFilterCount = [
        updateStatus !== 'all',
        deviceStatusFilter !== 'all',
        Boolean(versionFilter.trim()),
    ].filter(Boolean).length;
    const hasActiveFilters = Boolean(search.trim()) || activeAdvancedFilterCount > 0;

    const clearAdvancedFilters = () => {
        setUpdateStatus('all');
        setDeviceStatusFilter('all');
        setVersionFilter('');
    };

    const startNicknameEdit = (device) => {
        setEditingDeviceCode(device.deviceCode || '');
        setNicknameDraft(device.nickname || '');
    };

    const cancelNicknameEdit = () => {
        setEditingDeviceCode('');
        setNicknameDraft('');
    };

    const openDevice = (device) => {
        if (!device?.deviceCode) return;
        router.push(`/dashboard/laptop-data/devices/${encodeURIComponent(device.deviceCode)}`);
    };

    const handleRowKeyDown = (event, device) => {
        if (event.target !== event.currentTarget) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;

        event.preventDefault();
        openDevice(device);
    };

    const toggleSort = (key) => {
        setSortConfig((currentSort) => {
            if (currentSort.key !== key) {
                return { key, direction: getDefaultSortDirection(key) };
            }

            return {
                key,
                direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
            };
        });
    };

    const saveNickname = async (deviceCode) => {
        const nickname = nicknameDraft.trim();

        if (!nickname) {
            toast.error('Nickname is required.');
            return;
        }

        try {
            setSavingNickname(deviceCode);
            const res = await fetch(`/api/admin/devices/${encodeURIComponent(deviceCode)}/nickname`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || 'Unable to update nickname.');
            }

            setDevices((currentDevices) =>
                currentDevices.map((device) =>
                    device.deviceCode === deviceCode
                        ? { ...device, ...(data && typeof data === 'object' ? data : {}), nickname }
                        : device
                )
            );
            cancelNicknameEdit();
            toast.success('Device nickname updated.');
        } catch (saveError) {
            toast.error(saveError.message || 'Unable to update nickname.');
        } finally {
            setSavingNickname('');
        }
    };

    const stats = useMemo(() => {
        const summaryValues = getSummaryValues(versionSummary);
        const online = devices.filter((device) => device.status === 'online').length;
        const latest = devices.filter((device) => normalizeUpdateStatus(device.updateStatus) === 'latest').length;
        const outdated = devices.filter((device) => normalizeUpdateStatus(device.updateStatus) === 'outdated').length;
        const unknown = devices.filter((device) => normalizeUpdateStatus(device.updateStatus) === 'unknown').length;
        const newer = devices.filter((device) => normalizeUpdateStatus(device.updateStatus) === 'newer').length;

        return {
            total: summaryValues.total ?? devices.length,
            online: summaryValues.online ?? online,
            latest: summaryValues.latest ?? latest,
            outdated: summaryValues.outdated ?? outdated,
            unknown: summaryValues.unknown ?? unknown,
            newer: summaryValues.newer ?? newer,
        };
    }, [devices, versionSummary]);

    const versionGroups = useMemo(() => getVersionGroups(versionSummary), [versionSummary]);
    const versionHighlights = useMemo(
        () => getVersionHighlights(versionSummary, devices, versionGroups),
        [devices, versionGroups, versionSummary]
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                <MetricCard icon={MonitorSmartphone} label="Total Devices" value={stats.total} />
                <MetricCard icon={Wifi} label="Online" value={stats.online} accent="text-green-600" />
                <MetricCard icon={CheckCircle2} label="Latest" value={stats.latest} accent="text-green-600" />
                <MetricCard icon={AlertTriangle} label="Outdated" value={stats.outdated} accent="text-amber-600" />
                <MetricCard icon={HelpCircle} label="Unknown" value={stats.unknown} accent="text-slate-600 dark:text-slate-300" />
                <MetricCard icon={ArrowUpCircle} label="Newer" value={stats.newer} accent="text-blue-600" />
            </div>

            <VersionSummaryPanel
                groups={versionGroups}
                highlights={versionHighlights}
                error={summaryError}
                loading={loading && !versionSummary}
                onUpdatePublished={fetchDevices}
            />

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm ring-1 ring-foreground/[0.02]">
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Device Registry</p>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">Connected laptop agents</h2>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative w-full sm:w-96">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                                <label htmlFor="device-search" className="sr-only">Search devices</label>
                                <input
                                    id="device-search"
                                    name="deviceSearch"
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search device, nickname, host..."
                                    autoComplete="off"
                                    spellCheck={false}
                                    aria-label="Search devices by code, nickname, host, status, or version"
                                    className="h-11 w-full rounded-full border border-input bg-background pl-11 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setAdvancedOpen((isOpen) => !isOpen)}
                                aria-expanded={advancedOpen}
                                className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${advancedOpen || activeAdvancedFilterCount > 0
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'border-border bg-background text-foreground hover:bg-muted/50'
                                    }`}
                            >
                                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                                Advanced Search
                                {activeAdvancedFilterCount > 0 && (
                                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1.5 text-[10px] font-black text-foreground">
                                        {activeAdvancedFilterCount}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={fetchDevices}
                                disabled={loading}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-bold text-foreground transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {advancedOpen && (
                        <div className="grid gap-4 border-t border-border pt-5 xl:grid-cols-[1fr_1.25fr_minmax(220px,0.8fr)_auto] xl:items-end">
                            <FilterPillGroup
                                label="Online State"
                                options={DEVICE_STATE_FILTERS}
                                value={deviceStatusFilter}
                                onChange={setDeviceStatusFilter}
                            />
                            <FilterPillGroup
                                label="Update Status"
                                options={UPDATE_STATUS_FILTERS}
                                value={updateStatus}
                                onChange={setUpdateStatus}
                            />
                            <div className="space-y-2">
                                <label htmlFor="version-filter" className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                    Version
                                </label>
                                <input
                                    id="version-filter"
                                    name="versionFilter"
                                    type="search"
                                    value={versionFilter}
                                    onChange={(event) => setVersionFilter(event.target.value)}
                                    placeholder="Agent or latest version"
                                    autoComplete="off"
                                    spellCheck={false}
                                    className="h-10 w-full rounded-full border border-input bg-background px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={clearAdvancedFilters}
                                disabled={activeAdvancedFilterCount === 0}
                                className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive" role="alert">
                    {error}
                </div>
            )}

            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[840px] text-left text-sm">
                        <caption className="sr-only">Laptop agent devices with online status, installed versions, version rollout status, and last heartbeat.</caption>
                        <thead className="border-b border-border bg-muted/30 text-xs uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Device</th>
                                <th scope="col" className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Hostname</th>
                                <SortableHeader label="Agent Version" sortKey="agentVersion" sortConfig={sortConfig} onSort={toggleSort} />
                                <SortableHeader label="Last Seen" sortKey="lastSeenAtUtc" sortConfig={sortConfig} onSort={toggleSort} />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading && devices.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center text-sm text-muted-foreground">
                                        Loading laptop devices...
                                    </td>
                                </tr>
                            ) : filteredDevices.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center text-sm text-muted-foreground">
                                        {hasActiveFilters ? 'No devices matched the current filters.' : 'No laptop devices were returned.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredDevices.map((device, index) => (
                                    <tr
                                        key={`${device.deviceCode || device.hostname || 'device'}-${index}`}
                                        role={device.deviceCode ? 'link' : undefined}
                                        tabIndex={device.deviceCode ? 0 : undefined}
                                        aria-label={device.deviceCode ? `Open device ${device.deviceCode}` : undefined}
                                        onClick={() => openDevice(device)}
                                        onKeyDown={(event) => handleRowKeyDown(event, device)}
                                        className={`${getDeviceRowClass(device.status)} ${device.deviceCode ? 'cursor-pointer' : ''} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset`}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
                                                    <MonitorSmartphone className="h-4 w-4" aria-hidden="true" />
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <NicknameCell
                                                        device={device}
                                                        isEditing={editingDeviceCode === device.deviceCode}
                                                        draft={nicknameDraft}
                                                        isSaving={savingNickname === device.deviceCode}
                                                        onStart={() => startNicknameEdit(device)}
                                                        onDraftChange={setNicknameDraft}
                                                        onCancel={cancelNicknameEdit}
                                                        onSave={() => saveNickname(device.deviceCode)}
                                                    />
                                                    <p className="truncate font-mono text-xs text-muted-foreground" translate="no">
                                                        {device.deviceCode || 'No code'}
                                                    </p>
                                                    <span className="sr-only">Status {device.status || 'unknown'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-semibold text-foreground">{device.hostname || '-'}</td>
                                        <td className="px-6 py-5">
                                            <VersionCell
                                                agentVersion={device.agentVersion}
                                                latestVersion={device.latestVersion}
                                                updateStatus={device.updateStatus}
                                                updateAvailable={device.updateAvailable}
                                            />
                                        </td>
                                        <td className="px-6 py-5 text-xs text-muted-foreground">{formatDateTime(device.lastSeenAtUtc)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, accent = 'text-foreground', compact = false }) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className={`mt-4 font-bold tracking-tight ${compact ? 'text-lg' : 'text-3xl'} ${accent}`}>{formatMetricValue(value)}</p>
        </div>
    );
}

function FilterPillGroup({ label, options, value, onChange }) {
    return (
        <fieldset className="space-y-2">
            <legend className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</legend>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const Icon = option.icon;
                    const isActive = value === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            aria-pressed={isActive}
                            className={`inline-flex h-10 items-center gap-2 rounded-full border px-3 text-xs font-bold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isActive
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}

function SortableHeader({ label, sortKey, sortConfig, onSort }) {
    const isActive = sortConfig.key === sortKey;
    const direction = isActive ? sortConfig.direction : null;
    const SortIcon = !isActive ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown;

    return (
        <th
            scope="col"
            aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}
            className="px-6 py-3 font-bold tracking-widest text-muted-foreground"
        >
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                aria-label={`Sort by ${label}${isActive ? `, currently ${direction === 'asc' ? 'ascending' : 'descending'}` : ''}`}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-left text-xs font-bold uppercase tracking-widest transition hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isActive ? 'text-foreground' : ''}`}
            >
                {label}
                <SortIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
        </th>
    );
}

function VersionSummaryPanel({ groups, highlights, error, loading, onUpdatePublished }) {
    const maxCount = Math.max(...groups.map((group) => group.count), 1);

    return (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_minmax(340px,0.9fr)]">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Rollout Summary</p>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Agent version adoption</h2>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <VersionHighlightCard label="Latest Version" value={highlights.latestVersion} />
                        <VersionHighlightCard label="Recommended Version" value={highlights.recommendedVersion} />
                    </div>

                    {highlights.options.length > 0 && (
                        <div className="rounded-xl border border-border bg-background p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Recommended Options</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {highlights.options.map((version) => (
                                    <span key={version} className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs font-bold text-foreground">
                                        {version}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full space-y-3">
                    {error ? (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-medium text-amber-700 dark:text-amber-500">
                            {error}
                        </div>
                    ) : loading ? (
                        <div className="rounded-xl border border-border bg-background p-4 text-sm font-medium text-muted-foreground">
                            Loading version summary...
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="rounded-xl border border-border bg-background p-4 text-sm font-medium text-muted-foreground">
                            No version groups returned yet.
                        </div>
                    ) : (
                        groups.map((group) => (
                            <div key={group.version} className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-[140px_minmax(0,1fr)_80px] sm:items-center">
                                <div className="flex items-center gap-2">
                                    <GitBranch className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                    <span className="font-mono text-sm font-bold text-foreground">{group.version}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-foreground"
                                        style={{ width: `${Math.max((group.count / maxCount) * 100, 6)}%` }}
                                    />
                                </div>
                                <div className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {group.count} {group.count === 1 ? 'device' : 'devices'}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <AgentUpdateForm onPublished={onUpdatePublished} />
            </div>
        </section>
    );
}

function AgentUpdateForm({ onPublished }) {
    const [form, setForm] = useState(DEFAULT_AGENT_UPDATE_FORM);
    const [submitting, setSubmitting] = useState(false);

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            version: form.version.trim(),
            downloadUrl: form.downloadUrl.trim(),
            sha256: form.sha256.trim().toUpperCase(),
            isMandatory: form.isMandatory,
            makeActive: form.makeActive,
            releaseNotes: form.releaseNotes.trim(),
        };
        const validationError = validateAgentUpdateForm(payload);

        if (validationError) {
            toast.error(validationError);
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch('/api/admin/agent-updates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || 'Unable to upload agent version.');
            }

            toast.success(`Agent version ${payload.version} uploaded.`);
            setForm(DEFAULT_AGENT_UPDATE_FORM);
            await onPublished?.();
        } catch (publishError) {
            toast.error(publishError.message || 'Unable to upload agent version.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Upload Version</p>
                    <h3 className="text-lg font-bold tracking-tight text-foreground">New agent release</h3>
                </div>
                <UploadCloud className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <FieldInput
                    id="agent-version"
                    label="Version"
                    value={form.version}
                    onChange={(value) => updateField('version', value)}
                    placeholder="1.0.10"
                    required
                />
                <FieldInput
                    id="agent-sha256"
                    label="SHA-256"
                    value={form.sha256}
                    onChange={(value) => updateField('sha256', value.toUpperCase())}
                    placeholder="64 character hash"
                    className="font-mono"
                    required
                />
            </div>

            <div className="mt-3">
                <FieldInput
                    id="agent-download-url"
                    label="Download URL"
                    value={form.downloadUrl}
                    onChange={(value) => updateField('downloadUrl', value)}
                    placeholder="https://github.com/.../EPDeskAgentSetup-1.0.10.msi"
                    type="url"
                    required
                />
            </div>

            <div className="mt-3 space-y-2">
                <label htmlFor="agent-release-notes" className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Release Notes
                </label>
                <textarea
                    id="agent-release-notes"
                    value={form.releaseNotes}
                    onChange={(event) => updateField('releaseNotes', event.target.value)}
                    placeholder="Endpoint changed, exclusions support added, version updated."
                    rows={4}
                    className="min-h-24 w-full rounded-xl border border-input bg-card px-3 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <BooleanOption
                    label="Mandatory"
                    checked={form.isMandatory}
                    onChange={(checked) => updateField('isMandatory', checked)}
                />
                <BooleanOption
                    label="Make Active"
                    checked={form.makeActive}
                    onChange={(checked) => updateField('makeActive', checked)}
                />
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {submitting ? <RefreshCw className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
                {submitting ? 'Uploading Version' : 'Upload New Version'}
            </button>
        </form>
    );
}

function FieldInput({ id, label, value, onChange, placeholder, type = 'text', className = '', required = false }) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                required={required}
                autoComplete="off"
                spellCheck={false}
                className={`h-10 w-full rounded-full border border-input bg-card px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
            />
        </div>
    );
}

function BooleanOption({ label, checked, onChange }) {
    return (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-border bg-background text-foreground"
            />
            {label}
        </label>
    );
}

function validateAgentUpdateForm(payload) {
    if (!payload.version) return 'Version is required.';
    if (!payload.downloadUrl) return 'Download URL is required.';
    if (!isValidHttpUrl(payload.downloadUrl)) return 'Download URL must be a valid HTTP or HTTPS URL.';
    if (!payload.sha256) return 'SHA-256 hash is required.';
    if (!/^[A-F0-9]{64}$/.test(payload.sha256)) return 'SHA-256 hash must be 64 hex characters.';
    return '';
}

function isValidHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function VersionHighlightCard({ label, value }) {
    return (
        <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
            <p className="mt-2 font-mono text-lg font-bold text-foreground">{value || 'Unknown'}</p>
        </div>
    );
}

function VersionCell({ agentVersion, latestVersion, updateStatus, updateAvailable }) {
    return (
        <div className="min-w-[180px] space-y-1">
            <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-sm font-bold text-foreground">{agentVersion || 'Unknown'}</p>
                <UpdateStatusBadge status={updateStatus} updateAvailable={updateAvailable} showHint={false} />
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">Latest {latestVersion || 'Unknown'}</p>
        </div>
    );
}

function UpdateStatusBadge({ status, updateAvailable, showHint = true }) {
    const normalizedStatus = normalizeUpdateStatus(status);
    const meta = UPDATE_STATUS_META[normalizedStatus];

    return (
        <div className="space-y-1">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.className}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClassName}`} />
                {meta.label}
            </span>
            {showHint && updateAvailable ? (
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-500">Update available</p>
            ) : null}
        </div>
    );
}

function NicknameCell({ device, isEditing, draft, isSaving, onStart, onDraftChange, onCancel, onSave }) {
    if (!device.deviceCode) {
        return <span className="text-xs font-medium text-muted-foreground">Unavailable</span>;
    }

    if (isEditing) {
        return (
            <div className="flex min-w-[220px] items-center gap-2">
                <input
                    name="deviceNickname"
                    type="text"
                    value={draft}
                    onChange={(event) => onDraftChange(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => {
                        event.stopPropagation();
                        if (event.key === 'Enter') onSave();
                        if (event.key === 'Escape') onCancel();
                    }}
                    placeholder="Office Laptop"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Device nickname"
                    disabled={isSaving}
                    className="h-11 w-44 rounded-full border border-input bg-background px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                />
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onSave();
                    }}
                    disabled={isSaving}
                    aria-label="Save nickname"
                    title="Save nickname"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10 text-green-600 transition hover:bg-green-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                >
                    <Check className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onCancel();
                    }}
                    disabled={isSaving}
                    aria-label="Cancel nickname edit"
                    title="Cancel"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex min-w-[180px] items-center gap-2">
            <span className="max-w-40 truncate font-semibold text-foreground">
                {device.nickname || <span className="font-medium text-muted-foreground">No nickname</span>}
            </span>
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    onStart();
                }}
                aria-label="Edit nickname"
                title="Edit nickname"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
        </div>
    );
}

function compareDevices(firstDevice, secondDevice, sortConfig) {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    let result = 0;

    if (sortConfig.key === 'updateStatus') {
        result = compareNumbers(
            UPDATE_STATUS_SORT_ORDER[normalizeUpdateStatus(firstDevice.updateStatus)] ?? UPDATE_STATUS_SORT_ORDER.unknown,
            UPDATE_STATUS_SORT_ORDER[normalizeUpdateStatus(secondDevice.updateStatus)] ?? UPDATE_STATUS_SORT_ORDER.unknown
        );
    } else if (sortConfig.key === 'lastSeenAtUtc') {
        result = compareNumbers(getDateTime(firstDevice.lastSeenAtUtc), getDateTime(secondDevice.lastSeenAtUtc));
    } else if (sortConfig.key === 'agentVersion') {
        result = compareVersions(firstDevice.agentVersion, secondDevice.agentVersion);
    }

    return result * direction;
}

function getDefaultSortDirection(key) {
    return key === 'lastSeenAtUtc' ? 'desc' : 'asc';
}

function getDeviceRowClass(status) {
    const normalizedStatus = String(status || '').toLowerCase();

    if (normalizedStatus === 'online') {
        return 'bg-green-500/[0.04] hover:bg-green-500/[0.08]';
    }

    if (normalizedStatus === 'offline') {
        return 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]';
    }

    return 'hover:bg-muted/30';
}

function compareNumbers(firstValue, secondValue) {
    if (firstValue === secondValue) return 0;
    return firstValue > secondValue ? 1 : -1;
}

function getDateTime(value) {
    const time = new Date(value || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
}

function compareVersions(firstVersion, secondVersion) {
    const first = parseVersion(firstVersion);
    const second = parseVersion(secondVersion);

    if (!first.hasValue && !second.hasValue) return 0;
    if (!first.hasValue) return 1;
    if (!second.hasValue) return -1;

    const maxLength = Math.max(first.parts.length, second.parts.length);

    for (let index = 0; index < maxLength; index++) {
        const firstPart = first.parts[index] ?? 0;
        const secondPart = second.parts[index] ?? 0;

        if (typeof firstPart === 'number' && typeof secondPart === 'number') {
            const result = compareNumbers(firstPart, secondPart);
            if (result) return result;
            continue;
        }

        const result = String(firstPart).localeCompare(String(secondPart), undefined, { numeric: true, sensitivity: 'base' });
        if (result) return result;
    }

    return 0;
}

function parseVersion(value) {
    const rawVersion = String(value || '').trim();

    if (!rawVersion) {
        return { hasValue: false, parts: [] };
    }

    return {
        hasValue: true,
        parts: rawVersion
            .split(/[.-]/)
            .filter(Boolean)
            .map((part) => (/^\d+$/.test(part) ? Number(part) : part.toLowerCase())),
    };
}

async function fetchJson(url, fallbackMessage) {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
        throw new Error(data?.error || fallbackMessage);
    }

    return data;
}

function getSummaryValues(summary) {
    const source = summary && typeof summary === 'object'
        ? { ...summary, ...(summary.totals && typeof summary.totals === 'object' ? summary.totals : {}) }
        : {};

    return {
        total: pickNumber(source, ['totalDevices', 'deviceCount', 'devices', 'total']),
        online: pickNumber(source, ['onlineDevices', 'onlineCount', 'online']),
        latest: pickNumber(source, ['latestDevices', 'latestCount', 'latest']),
        outdated: pickNumber(source, ['outdatedDevices', 'outdatedCount', 'outdated']),
        unknown: pickNumber(source, ['unknownVersionDevices', 'unknownDevices', 'unknownCount', 'unknown']),
        newer: pickNumber(source, ['newerDevices', 'newerCount', 'newer']),
    };
}

function getVersionGroups(summary) {
    const rawGroups = summary?.versionGroups || summary?.versions || summary?.byVersion || summary?.groups;

    if (Array.isArray(rawGroups)) {
        return rawGroups
            .map((group) => normalizeVersionGroup(group))
            .filter(Boolean)
            .sort((a, b) => b.count - a.count);
    }

    if (rawGroups && typeof rawGroups === 'object') {
        return Object.entries(rawGroups)
            .map(([version, value]) => normalizeVersionGroup({ version, ...(typeof value === 'object' ? value : { count: value }) }))
            .filter(Boolean)
            .sort((a, b) => b.count - a.count);
    }

    return [];
}

function getVersionHighlights(summary, devices, groups) {
    const source = summary && typeof summary === 'object'
        ? { ...summary, ...(summary.totals && typeof summary.totals === 'object' ? summary.totals : {}) }
        : {};
    const latestVersion =
        firstString(source, ['latestVersion', 'currentLatestVersion', 'latestAgentVersion', 'targetVersion']) ||
        mostCommonVersion(devices.map((device) => device.latestVersion)) ||
        highestVersion(groups.map((group) => group.version));
    const recommendedVersion =
        firstString(source, ['recommendedVersion', 'recommendedAgentVersion', 'recommendedLatestVersion', 'targetAgentVersion']) ||
        latestVersion;
    const sourceOptions = getVersionOptionsFromSource(source);
    const groupOptions = [...groups]
        .map((group) => group.version)
        .filter(Boolean)
        .sort((first, second) => compareVersions(second, first));

    return {
        latestVersion: latestVersion || 'Unknown',
        recommendedVersion: recommendedVersion || 'Unknown',
        options: uniqueVersions([recommendedVersion, latestVersion, ...sourceOptions, ...groupOptions]).slice(0, 3),
    };
}

function getVersionOptionsFromSource(source) {
    const optionKeys = ['recommendedVersions', 'versionOptions', 'availableVersions', 'targetVersions'];

    for (const key of optionKeys) {
        const value = source?.[key];
        if (!Array.isArray(value)) continue;

        return value
            .map((option) => {
                if (typeof option === 'string') return option;
                if (option && typeof option === 'object') {
                    return option.version || option.name || option.latestVersion || option.agentVersion;
                }

                return null;
            })
            .filter(Boolean);
    }

    return [];
}

function firstString(source, keys) {
    for (const key of keys) {
        const value = source?.[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
    }

    return '';
}

function mostCommonVersion(values) {
    const counts = new Map();

    for (const value of values) {
        const version = String(value || '').trim();
        if (!version) continue;
        counts.set(version, (counts.get(version) || 0) + 1);
    }

    return [...counts.entries()].sort((first, second) => second[1] - first[1])[0]?.[0] || '';
}

function highestVersion(values) {
    return uniqueVersions(values).sort((first, second) => compareVersions(second, first))[0] || '';
}

function uniqueVersions(values) {
    const seen = new Set();
    const versions = [];

    for (const value of values) {
        const version = String(value || '').trim();
        if (!version || seen.has(version)) continue;
        seen.add(version);
        versions.push(version);
    }

    return versions;
}

function normalizeVersionGroup(group) {
    if (!group || typeof group !== 'object') return null;

    const version = group.version || group.agentVersion || group.latestVersion || group.name || 'Unknown';
    const count = pickNumber(group, ['count', 'devices', 'deviceCount', 'total']);

    return {
        version: String(version),
        count: count ?? 0,
    };
}

function pickNumber(source, keys) {
    for (const key of keys) {
        const value = source?.[key];
        if (value === null || typeof value === 'undefined' || value === '') continue;

        const number = Number(value);
        if (Number.isFinite(number)) return number;
    }

    return null;
}

function normalizeUpdateStatus(status) {
    const normalizedStatus = String(status || 'unknown').toLowerCase();
    return UPDATE_STATUS_META[normalizedStatus] ? normalizedStatus : 'unknown';
}

function formatMetricValue(value) {
    if (value === null || typeof value === 'undefined' || value === '') return '-';
    return value;
}

function formatDateTime(value) {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}
