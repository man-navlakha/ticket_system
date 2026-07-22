'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Check, LayoutDashboard, FolderOpen, Stethoscope,
    Pencil, ScrollText, Laptop, User, Cpu, Wifi, WifiOff, Loader2,
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

export default function DeviceDashboardClient({ deviceCode, requestedByDefault }) {
    const [tab, setTab] = useState('overview');
    const [device, setDevice] = useState(null);
    const [nickname, setNickname] = useState('');
    const [editingNick, setEditingNick] = useState(false);
    const [nickDraft, setNickDraft] = useState('');
    const [savingNick, setSavingNick] = useState(false);
    const [runningDiag, setRunningDiag] = useState(false);
    const [requestingLogs, setRequestingLogs] = useState(false);

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

    const lastSeen = device?.lastSeenAtUtc;
    const online = device ? (String(device.status || '').toLowerCase() === 'online' || isRecent(lastSeen)) : false;

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
        </div>
    );
}
