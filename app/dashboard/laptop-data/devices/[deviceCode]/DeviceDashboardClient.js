'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Check, LayoutDashboard, FolderOpen, Stethoscope,
    Pencil, ScrollText, Laptop, User, Cpu, Wifi, WifiOff, Loader2,
    ShieldAlert, Trash2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import DeviceOverview from './DeviceOverview';
import DeviceFilesClient from './DeviceFilesClient';
import DeviceOperationsPanel from './DeviceOperationsPanel';
import { timeAgo, isRecent } from './deviceFormat';

const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'files', label: 'Files', icon: FolderOpen },
    { id: 'diagnostics', label: 'Diagnostics & Activity', icon: Stethoscope },
];

const REMOVAL_CONFIRMATION = 'REMOVE EPDesk Agent';

export default function DeviceDashboardClient({ deviceCode, requestedByDefault, canRemoveAgent = false }) {
    const [tab, setTab] = useState('overview');
    const [device, setDevice] = useState(null);
    const [nickname, setNickname] = useState('');
    const [editingNick, setEditingNick] = useState(false);
    const [nickDraft, setNickDraft] = useState('');
    const [savingNick, setSavingNick] = useState(false);
    const [runningDiag, setRunningDiag] = useState(false);
    const [requestingLogs, setRequestingLogs] = useState(false);
    const [removalDialogOpen, setRemovalDialogOpen] = useState(false);
    const [removalConfirmation, setRemovalConfirmation] = useState('');
    const [removingAgent, setRemovingAgent] = useState(false);

    // Pull this device's row from the devices list for header metadata.
    const loadDevice = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/devices', { cache: 'no-store' });
            const data = await res.json().catch(() => null);
            const list = Array.isArray(data) ? data : (data?.devices || data?.items || []);
            const match = list.find((d) => String(d.deviceCode) === String(deviceCode)) || null;
            if (match) {
                setDevice(match);
                setNickname(match.nickname || '');
            }
        } catch {
            /* header degrades gracefully */
        }
    }, [deviceCode]);

    useEffect(() => { loadDevice(); }, [loadDevice]);

    useEffect(() => {
        if (!removalDialogOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event) => {
            if (event.key === 'Escape' && !removingAgent) {
                setRemovalDialogOpen(false);
                setRemovalConfirmation('');
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [removalDialogOpen, removingAgent]);

    const saveNickname = async () => {
        const value = nickDraft.trim();
        if (!value) { setEditingNick(false); return; }
        setSavingNick(true);
        try {
            const res = await fetch(`/api/admin/devices/${encodeURIComponent(deviceCode)}/nickname`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: value }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || 'Failed to save nickname.');
            setNickname(value);
            setEditingNick(false);
            toast.success('Nickname updated.');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSavingNick(false);
        }
    };

    const runDiagnostics = async () => {
        setRunningDiag(true);
        try {
            const res = await fetch('/api/admin/remote-commands/run-diagnostics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceCode, requestedBy: requestedByDefault || 'Dashboard' }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || data?.success === false) throw new Error(data?.error || data?.message || 'Unable to run diagnostics.');
            toast.success('Diagnostics command queued.');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setRunningDiag(false);
        }
    };

    const requestLogs = async () => {
        setRequestingLogs(true);
        try {
            const res = await fetch('/api/admin/remote-commands/request-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceCode, requestedBy: requestedByDefault || 'Dashboard', logType: 'all', takeLines: 500 }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || data?.success === false) throw new Error(data?.error || data?.message || 'Unable to request logs.');
            toast.success('Log collection queued.');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setRequestingLogs(false);
        }
    };

    const openRemovalDialog = () => {
        setRemovalConfirmation('');
        setRemovalDialogOpen(true);
    };

    const closeRemovalDialog = () => {
        if (removingAgent) return;
        setRemovalDialogOpen(false);
        setRemovalConfirmation('');
    };

    const removeAgent = async () => {
        if (removalConfirmation !== REMOVAL_CONFIRMATION) return;

        setRemovingAgent(true);
        try {
            const res = await fetch('/api/admin/remote-commands/remove-epdesk-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceCode,
                    confirmation: removalConfirmation,
                }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok || data?.success === false) {
                throw new Error(data?.error || data?.message || 'Unable to queue Agent removal.');
            }

            setRemovalDialogOpen(false);
            setRemovalConfirmation('');
            setTab('diagnostics');
            toast.success('EPDesk Agent removal queued.');
        } catch (error) {
            toast.error(error.message || 'Unable to queue Agent removal.');
        } finally {
            setRemovingAgent(false);
        }
    };

    const lastSeen = device?.lastSeenAtUtc;
    const online = device ? (String(device.status || '').toLowerCase() === 'online' || isRecent(lastSeen)) : false;
    const removalSupported = supportsAgentRemoval(device?.agentVersion);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-5">
                <Link
                    href="/dashboard/laptop-data/devices"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Devices
                </Link>

                <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">{deviceCode}</h1>
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${online
                                ? 'border-green-500/20 bg-green-500/10 text-green-600'
                                : 'border-border bg-muted text-muted-foreground'}`}>
                                {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                                {online ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        {/* Nickname (inline editable) */}
                        {editingNick ? (
                            <div className="flex items-center gap-2">
                                <input
                                    autoFocus
                                    value={nickDraft}
                                    onChange={(e) => setNickDraft(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveNickname(); if (e.key === 'Escape') setEditingNick(false); }}
                                    placeholder="Add a nickname"
                                    className="h-8 w-56 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#6d2db7]/30"
                                />
                                <button onClick={saveNickname} disabled={savingNick} className="inline-flex h-8 items-center gap-1 rounded-lg bg-foreground px-3 text-xs font-bold text-background disabled:opacity-50">
                                    {savingNick ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setNickDraft(nickname); setEditingNick(true); }}
                                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
                            >
                                {nickname ? <span className="font-semibold text-foreground">{nickname}</span> : <span className="italic">Add a nickname</span>}
                                <Pencil className="h-3 w-3" />
                            </button>
                        )}

                        {/* Meta chips */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                            {device?.hostname && <span className="inline-flex items-center gap-1"><Laptop className="h-3 w-3" /> {device.hostname}</span>}
                            {device?.username && <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {device.username}</span>}
                            {device?.agentVersion && <span className="inline-flex items-center gap-1"><Cpu className="h-3 w-3" /> v{device.agentVersion}</span>}
                            {lastSeen && <span className="inline-flex items-center gap-1"><Wifi className="h-3 w-3" /> seen {timeAgo(lastSeen)}</span>}
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={runDiagnostics}
                            disabled={runningDiag}
                            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-bold text-foreground transition hover:bg-muted/50 disabled:opacity-50"
                        >
                            {runningDiag ? <Loader2 className="h-4 w-4 animate-spin" /> : <Stethoscope className="h-4 w-4" />} Run diagnostics
                        </button>
                        <button
                            onClick={requestLogs}
                            disabled={requestingLogs}
                            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-bold text-foreground transition hover:bg-muted/50 disabled:opacity-50"
                        >
                            {requestingLogs ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />} Request logs
                        </button>
                        {canRemoveAgent && (
                            <button
                                type="button"
                                onClick={openRemovalDialog}
                                disabled={!removalSupported}
                                title={
                                    removalSupported
                                        ? 'Remove EPDesk Agent from this device'
                                        : 'Requires EPDesk Agent version 1.0.13 or newer'
                                }
                                className="inline-flex h-10 items-center gap-2 rounded-full border border-red-500/30 bg-red-500/5 px-4 text-sm font-bold text-red-600 transition hover:border-red-500/50 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                <Trash2 className="h-4 w-4" />
                                Remove Agent
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1">
                    {TABS.map((t) => {
                        const Icon = t.icon;
                        const active = tab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`inline-flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-bold transition ${active
                                    ? 'bg-foreground text-background'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                            >
                                <Icon className="h-4 w-4" /> {t.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab content */}
            {tab === 'overview' && <DeviceOverview deviceCode={deviceCode} />}
            {tab === 'files' && <DeviceFilesClient deviceCode={deviceCode} requestedByDefault={requestedByDefault} />}
            {tab === 'diagnostics' && <DeviceOperationsPanel deviceCode={deviceCode} requestedByDefault={requestedByDefault} />}

            {removalDialogOpen && (
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeRemovalDialog();
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="remove-agent-title"
                        aria-describedby="remove-agent-description"
                        className="w-full max-w-lg overflow-hidden rounded-2xl border border-red-500/25 bg-card shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-red-500/20 bg-red-500/10 p-6">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/25 bg-card text-red-600">
                                    <ShieldAlert className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-red-600">
                                        Destructive action
                                    </p>
                                    <h2 id="remove-agent-title" className="mt-1 text-xl font-bold tracking-tight text-foreground">
                                        Remove EPDesk Agent?
                                    </h2>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeRemovalDialog}
                                disabled={removingAgent}
                                aria-label="Close removal confirmation"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-5 p-6">
                            <p id="remove-agent-description" className="text-sm leading-relaxed text-muted-foreground">
                                This will uninstall every MSI named <strong className="text-foreground">EPDesk Agent</strong> from{' '}
                                <strong className="font-mono text-foreground">{deviceCode}</strong>. The device will stop sending
                                heartbeats and must be manually reinstalled to reconnect.
                            </p>

                            <div className="rounded-xl border border-border bg-muted/50 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Type this phrase to confirm
                                </p>
                                <code className="mt-2 block select-all text-sm font-bold text-foreground">
                                    {REMOVAL_CONFIRMATION}
                                </code>
                            </div>

                            <label className="block space-y-2">
                                <span className="text-sm font-bold text-foreground">Confirmation</span>
                                <input
                                    autoFocus
                                    type="text"
                                    value={removalConfirmation}
                                    onChange={(event) => setRemovalConfirmation(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && removalConfirmation === REMOVAL_CONFIRMATION) {
                                            removeAgent();
                                        }
                                    }}
                                    autoComplete="off"
                                    spellCheck={false}
                                    placeholder={REMOVAL_CONFIRMATION}
                                    className="h-11 w-full rounded-xl border border-input bg-background px-4 font-mono text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20"
                                />
                            </label>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeRemovalDialog}
                                    disabled={removingAgent}
                                    className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-bold text-foreground transition hover:bg-muted/50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={removeAgent}
                                    disabled={removingAgent || removalConfirmation !== REMOVAL_CONFIRMATION}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    {removingAgent ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                    {removingAgent ? 'Queuing removal...' : 'Remove Agent'}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

function supportsAgentRemoval(version) {
    const parts = String(version || '')
        .replace(/^v/i, '')
        .split('.')
        .slice(0, 3)
        .map((part) => Number.parseInt(part, 10));

    if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return false;

    const minimum = [1, 0, 13];
    for (let index = 0; index < minimum.length; index += 1) {
        if (parts[index] > minimum[index]) return true;
        if (parts[index] < minimum[index]) return false;
    }

    return true;
}
