'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Clock3, FolderOpen, MonitorSmartphone, Pencil, RefreshCw, Search, X, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export default function DevicesClient() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [editingDeviceCode, setEditingDeviceCode] = useState('');
    const [nicknameDraft, setNicknameDraft] = useState('');
    const [savingNickname, setSavingNickname] = useState('');

    const fetchDevices = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const res = await fetch('/api/admin/devices', { cache: 'no-store' });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || 'Unable to load devices.');
            }

            setDevices(Array.isArray(data) ? data : []);
        } catch (fetchError) {
            setError(fetchError.message || 'Unable to load devices.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    const filteredDevices = useMemo(() => {
        const term = search.trim().toLowerCase();
        const sorted = [...devices].sort((a, b) => {
            if (a.status === b.status) {
                return new Date(b.lastSeenAtUtc || 0).getTime() - new Date(a.lastSeenAtUtc || 0).getTime();
            }

            return a.status === 'online' ? -1 : 1;
        });

        if (!term) return sorted;

        return sorted.filter((device) =>
            [device.deviceCode, device.hostname, device.username, device.status]
                .concat(device.nickname)
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term))
        );
    }, [devices, search]);

    const startNicknameEdit = (device) => {
        setEditingDeviceCode(device.deviceCode || '');
        setNicknameDraft(device.nickname || '');
    };

    const cancelNicknameEdit = () => {
        setEditingDeviceCode('');
        setNicknameDraft('');
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
        const online = devices.filter((device) => device.status === 'online').length;
        const offline = devices.filter((device) => device.status === 'offline').length;
        const latestSeen = devices.reduce((latest, device) => {
            const current = new Date(latest || 0).getTime();
            const next = new Date(device.lastSeenAtUtc || 0).getTime();
            return next > current ? device.lastSeenAtUtc : latest;
        }, null);

        return {
            total: devices.length,
            online,
            offline,
            latestSeen,
        };
    }, [devices]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={MonitorSmartphone} label="Total Devices" value={stats.total} />
                <MetricCard icon={Wifi} label="Online" value={stats.online} accent="text-green-600" />
                <MetricCard icon={WifiOff} label="Offline" value={stats.offline} accent="text-amber-600" />
                <MetricCard icon={Clock3} label="Latest Seen" value={formatDateTime(stats.latestSeen)} compact />
            </div>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Device Registry</p>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Connected laptop agents</h2>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-80">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search device, host, user..."
                                className="h-11 w-full rounded-full border border-input bg-background pl-11 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={fetchDevices}
                            disabled={loading}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-bold text-foreground transition hover:bg-muted/50 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>
            </section>

            {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive" role="alert">
                    {error}
                </div>
            )}

            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left text-sm">
                        <thead className="border-b border-border bg-muted/30 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Device</th>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Nickname</th>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Hostname</th>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Signed In User</th>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Status</th>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Last Seen</th>
                                <th className="px-6 py-4 text-right font-bold tracking-widest text-muted-foreground">Files</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading && devices.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-sm text-muted-foreground">
                                        Loading laptop devices...
                                    </td>
                                </tr>
                            ) : filteredDevices.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-sm text-muted-foreground">
                                        {search ? 'No devices matched the current search.' : 'No laptop devices were returned.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredDevices.map((device, index) => (
                                    <tr key={`${device.deviceCode || device.hostname || 'device'}-${index}`} className="transition-colors hover:bg-muted/20">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
                                                    <MonitorSmartphone className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    {device.deviceCode ? (
                                                        <Link
                                                            href={`/dashboard/laptop-data/devices/${encodeURIComponent(device.deviceCode)}`}
                                                            className="font-mono text-sm font-bold text-foreground underline-offset-4 hover:underline"
                                                        >
                                                            {device.deviceCode}
                                                        </Link>
                                                    ) : (
                                                        <p className="font-mono text-sm font-bold text-foreground">No code</p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">Agent device</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
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
                                        </td>
                                        <td className="px-6 py-5 font-semibold text-foreground">{device.hostname || '-'}</td>
                                        <td className="px-6 py-5 font-mono text-xs text-muted-foreground">{device.username || '-'}</td>
                                        <td className="px-6 py-5"><StatusBadge status={device.status} /></td>
                                        <td className="px-6 py-5 text-xs text-muted-foreground">{formatDateTime(device.lastSeenAtUtc)}</td>
                                        <td className="px-6 py-5 text-right">
                                            {device.deviceCode ? (
                                                <Link
                                                    href={`/dashboard/laptop-data/devices/${encodeURIComponent(device.deviceCode)}`}
                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-xs font-bold text-foreground transition hover:bg-muted/50"
                                                >
                                                    <FolderOpen className="h-3.5 w-3.5" />
                                                    View Files
                                                </Link>
                                            ) : (
                                                <span className="text-xs font-medium text-muted-foreground">Unavailable</span>
                                            )}
                                        </td>
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
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`mt-4 font-bold tracking-tight ${compact ? 'text-lg' : 'text-3xl'} ${accent}`}>{value || '-'}</p>
        </div>
    );
}

function StatusBadge({ status }) {
    const isOnline = status === 'online';

    return (
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isOnline
            ? 'border-green-500/20 bg-green-500/10 text-green-600'
            : 'border-amber-500/20 bg-amber-500/10 text-amber-600'
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-500'}`} />
            {status || 'unknown'}
        </span>
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
                    type="text"
                    value={draft}
                    onChange={(event) => onDraftChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') onSave();
                        if (event.key === 'Escape') onCancel();
                    }}
                    placeholder="Office Laptop"
                    disabled={isSaving}
                    autoFocus
                    className="h-9 w-40 rounded-full border border-input bg-background px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                />
                <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    aria-label="Save nickname"
                    title="Save nickname"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10 text-green-600 transition hover:bg-green-500/15 disabled:opacity-50"
                >
                    <Check className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    aria-label="Cancel nickname edit"
                    title="Cancel"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-muted/50 disabled:opacity-50"
                >
                    <X className="h-4 w-4" />
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
                onClick={onStart}
                aria-label="Edit nickname"
                title="Edit nickname"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
            >
                <Pencil className="h-3.5 w-3.5" />
            </button>
        </div>
    );
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
