'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    ClipboardList,
    FileText,
    RefreshCw,
    Stethoscope,
    TerminalSquare,
} from 'lucide-react';
import { toast } from 'sonner';

const LOG_LEVELS = [
    { label: 'All', value: '' },
    { label: 'Info', value: 'INFO' },
    { label: 'Warning', value: 'WARNING' },
    { label: 'Error', value: 'ERROR' },
];

export default function DeviceOperationsPanel({ deviceCode, requestedByDefault }) {
    const [logs, setLogs] = useState([]);
    const [diagnostics, setDiagnostics] = useState([]);
    const [commands, setCommands] = useState([]);
    const [logLevel, setLogLevel] = useState('');
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [loadingDiagnostics, setLoadingDiagnostics] = useState(true);
    const [loadingCommands, setLoadingCommands] = useState(true);
    const [requestingLogs, setRequestingLogs] = useState(false);
    const [requestingDiagnostics, setRequestingDiagnostics] = useState(false);
    const [error, setError] = useState('');

    const loadLogs = useCallback(async () => {
        const params = new URLSearchParams({ take: '200' });
        if (logLevel) params.set('level', logLevel);

        try {
            setLoadingLogs(true);
            const res = await fetch(
                `/api/admin/devices/${encodeURIComponent(deviceCode)}/logs?${params.toString()}`,
                { cache: 'no-store' }
            );
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || 'Unable to load device logs.');
            }

            setLogs(Array.isArray(data) ? data : []);
        } catch (fetchError) {
            setError(fetchError.message || 'Unable to load device logs.');
        } finally {
            setLoadingLogs(false);
        }
    }, [deviceCode, logLevel]);

    const loadDiagnostics = useCallback(async () => {
        try {
            setLoadingDiagnostics(true);
            const res = await fetch(
                `/api/admin/devices/${encodeURIComponent(deviceCode)}/diagnostics?take=20`,
                { cache: 'no-store' }
            );
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || 'Unable to load diagnostics.');
            }

            setDiagnostics(Array.isArray(data) ? data : []);
        } catch (fetchError) {
            setError(fetchError.message || 'Unable to load diagnostics.');
        } finally {
            setLoadingDiagnostics(false);
        }
    }, [deviceCode]);

    const loadCommands = useCallback(async () => {
        const params = new URLSearchParams({
            deviceCode,
            take: '25',
        });

        try {
            setLoadingCommands(true);
            const res = await fetch(`/api/admin/remote-commands?${params.toString()}`, { cache: 'no-store' });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || 'Unable to load remote commands.');
            }

            setCommands(Array.isArray(data) ? data : []);
        } catch (fetchError) {
            setError(fetchError.message || 'Unable to load remote commands.');
        } finally {
            setLoadingCommands(false);
        }
    }, [deviceCode]);

    const refreshAll = useCallback(async () => {
        setError('');
        await Promise.all([loadLogs(), loadDiagnostics(), loadCommands()]);
    }, [loadCommands, loadDiagnostics, loadLogs]);

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    const latestDiagnostic = diagnostics[0] || null;

    const stats = useMemo(() => {
        const errorLogs = logs.filter((log) => String(log.level || '').toUpperCase() === 'ERROR').length;
        const activeCommands = commands.filter((command) =>
            ['pending', 'sent_to_agent'].includes(String(command.status || '').toLowerCase())
        ).length;

        return {
            logs: logs.length,
            errorLogs,
            diagnostics: diagnostics.length,
            activeCommands,
        };
    }, [commands, diagnostics.length, logs]);

    const requestLogs = async () => {
        try {
            setRequestingLogs(true);
            setError('');

            const res = await fetch('/api/admin/remote-commands/request-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceCode,
                    requestedBy: requestedByDefault || 'Dashboard',
                    logType: 'all',
                    takeLines: 500,
                }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok || data?.success === false) {
                throw new Error(data?.error || data?.message || 'Unable to request device logs.');
            }

            toast.success('Log collection queued.');
            await loadCommands();
        } catch (requestError) {
            toast.error(requestError.message || 'Unable to request device logs.');
        } finally {
            setRequestingLogs(false);
        }
    };

    const runDiagnostics = async () => {
        try {
            setRequestingDiagnostics(true);
            setError('');

            const res = await fetch('/api/admin/remote-commands/run-diagnostics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceCode,
                    requestedBy: requestedByDefault || 'Dashboard',
                }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok || data?.success === false) {
                throw new Error(data?.error || data?.message || 'Unable to run diagnostics.');
            }

            toast.success('Diagnostics command queued.');
            await loadCommands();
        } catch (requestError) {
            toast.error(requestError.message || 'Unable to run diagnostics.');
        } finally {
            setRequestingDiagnostics(false);
        }
    };

    const loading = loadingLogs || loadingDiagnostics || loadingCommands;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={FileText} label="Recent Logs" value={stats.logs} />
                <MetricCard icon={AlertTriangle} label="Error Logs" value={stats.errorLogs} accent="text-red-600" />
                <MetricCard icon={Stethoscope} label="Diagnostics" value={stats.diagnostics} accent="text-blue-600" />
                <MetricCard icon={TerminalSquare} label="Active Commands" value={stats.activeCommands} accent="text-amber-600" />
            </div>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Device Operations</p>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Logs, diagnostics, and support commands</h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={requestLogs}
                            disabled={requestingLogs}
                            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-xs font-bold text-foreground transition hover:bg-muted/50 disabled:opacity-50"
                        >
                            {requestingLogs ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                            Request Logs
                        </button>
                        <button
                            type="button"
                            onClick={runDiagnostics}
                            disabled={requestingDiagnostics}
                            className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-xs font-bold text-background transition hover:opacity-90 disabled:opacity-50"
                        >
                            {requestingDiagnostics ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Stethoscope className="h-3.5 w-3.5" />}
                            Run Diagnostics
                        </button>
                        <button
                            type="button"
                            onClick={refreshAll}
                            disabled={loading}
                            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-xs font-bold text-foreground transition hover:bg-muted/50 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
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

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
                <div className="rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Agent Logs</p>
                            <h3 className="text-xl font-bold tracking-tight text-foreground">Recent device log stream</h3>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {LOG_LEVELS.map((level) => (
                                <button
                                    key={level.label}
                                    type="button"
                                    onClick={() => setLogLevel(level.value)}
                                    className={`inline-flex h-9 items-center rounded-full border px-3 text-[11px] font-bold uppercase tracking-wider transition ${logLevel === level.value
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="max-h-[520px] overflow-auto">
                        {loadingLogs && logs.length === 0 ? (
                            <EmptyState icon={RefreshCw} label="Loading logs..." spinning />
                        ) : logs.length === 0 ? (
                            <EmptyState icon={FileText} label="No logs returned." />
                        ) : (
                            <div className="divide-y divide-border">
                                {logs.map((log) => (
                                    <article key={log.id || `${log.createdAtUtc}-${log.message}`} className="p-5">
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0 space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <StatusBadge status={log.level} tone={getLogTone(log.level)} />
                                                    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        {log.category || 'Log'}
                                                    </span>
                                                    {log.step && (
                                                        <span className="font-mono text-[11px] text-muted-foreground">{log.step}</span>
                                                    )}
                                                </div>
                                                <p className="break-words text-sm font-semibold text-foreground">{log.message || '-'}</p>
                                                {log.detailsJson && (
                                                    <p className="break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
                                                        {formatJsonPreview(log.detailsJson)}
                                                    </p>
                                                )}
                                            </div>
                                            <time className="shrink-0 font-mono text-[11px] text-muted-foreground">
                                                {formatDateTime(log.createdAtUtc)}
                                            </time>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Diagnostics</p>
                                <h3 className="text-xl font-bold tracking-tight text-foreground">Latest health snapshot</h3>
                            </div>
                            <Stethoscope className="h-5 w-5 text-muted-foreground" />
                        </div>

                        {loadingDiagnostics && diagnostics.length === 0 ? (
                            <EmptyState icon={RefreshCw} label="Loading diagnostics..." spinning compact />
                        ) : latestDiagnostic ? (
                            <div className="mt-5 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <HealthItem label="Service" value={latestDiagnostic.serviceStatus || '-'} />
                                    <HealthItem label="API" value={latestDiagnostic.apiReachable ? 'Reachable' : 'Not reachable'} tone={latestDiagnostic.apiReachable ? 'ok' : 'bad'} />
                                    <HealthItem label="Internet" value={latestDiagnostic.internetWorking ? 'Working' : 'Offline'} tone={latestDiagnostic.internetWorking ? 'ok' : 'bad'} />
                                    <HealthItem label="Free Disk" value={formatBytes(latestDiagnostic.systemDriveFreeBytes)} />
                                </div>
                                <div className="space-y-2 rounded-xl border border-border bg-background p-4">
                                    <DetailRow label="Agent" value={latestDiagnostic.agentVersion || '-'} />
                                    <DetailRow label="Windows" value={latestDiagnostic.windowsVersion || '-'} />
                                    <DetailRow label="Task" value={latestDiagnostic.currentRunningTask || '-'} />
                                    <DetailRow label="Heartbeat" value={formatDateTime(latestDiagnostic.lastHeartbeatUtc)} />
                                    <DetailRow label="Captured" value={formatDateTime(latestDiagnostic.createdAtUtc)} />
                                </div>
                                {latestDiagnostic.lastError && (
                                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-600">
                                        {latestDiagnostic.lastError}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <EmptyState icon={Stethoscope} label="No diagnostics returned." compact />
                        )}
                    </section>

                    <section className="rounded-2xl border border-border bg-card shadow-sm">
                        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Remote Commands</p>
                                <h3 className="text-xl font-bold tracking-tight text-foreground">Recent command history</h3>
                            </div>
                            <ClipboardList className="h-5 w-5 text-muted-foreground" />
                        </div>

                        {loadingCommands && commands.length === 0 ? (
                            <EmptyState icon={RefreshCw} label="Loading commands..." spinning compact />
                        ) : commands.length === 0 ? (
                            <EmptyState icon={TerminalSquare} label="No commands returned." compact />
                        ) : (
                            <div className="max-h-[360px] divide-y divide-border overflow-auto">
                                {commands.map((command) => (
                                    <article key={command.id} className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 space-y-2">
                                                <p className="font-mono text-xs font-bold text-foreground">{command.commandType || '-'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {command.requestedBy || 'Dashboard'} at {formatDateTime(command.requestedAtUtc)}
                                                </p>
                                                {command.errorMessage && (
                                                    <p className="text-xs font-medium text-red-600">{command.errorMessage}</p>
                                                )}
                                            </div>
                                            <StatusBadge status={command.status} tone={getCommandTone(command.status)} />
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </section>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, accent = 'text-foreground' }) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`mt-4 text-3xl font-bold tracking-tight ${accent}`}>{value || '0'}</p>
        </div>
    );
}

function EmptyState({ icon: Icon, label, spinning = false, compact = false }) {
    return (
        <div className={`flex flex-col items-center justify-center px-6 text-center text-sm text-muted-foreground ${compact ? 'py-10' : 'py-16'}`}>
            <Icon className={`h-7 w-7 ${spinning ? 'animate-spin' : ''}`} />
            <p className="mt-3 font-medium">{label}</p>
        </div>
    );
}

function StatusBadge({ status, tone = 'neutral' }) {
    const styles = {
        ok: 'border-green-500/20 bg-green-500/10 text-green-600',
        info: 'border-blue-500/20 bg-blue-500/10 text-blue-600',
        warn: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
        bad: 'border-red-500/20 bg-red-500/10 text-red-600',
        neutral: 'border-border bg-muted text-muted-foreground',
    };

    return (
        <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${styles[tone] || styles.neutral}`}>
            {status || 'unknown'}
        </span>
    );
}

function HealthItem({ label, value, tone = 'neutral' }) {
    const toneClass = tone === 'ok' ? 'text-green-600' : tone === 'bad' ? 'text-red-600' : 'text-foreground';

    return (
        <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={`mt-2 break-words text-sm font-bold ${toneClass}`}>{value || '-'}</p>
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-3 text-xs">
            <span className="font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
            <span className="text-right font-mono text-foreground">{value || '-'}</span>
        </div>
    );
}

function getLogTone(level) {
    const normalized = String(level || '').toUpperCase();
    if (normalized === 'ERROR') return 'bad';
    if (normalized === 'WARNING' || normalized === 'WARN') return 'warn';
    if (normalized === 'INFO') return 'info';
    return 'neutral';
}

function getCommandTone(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'completed') return 'ok';
    if (normalized === 'failed') return 'bad';
    if (normalized === 'pending' || normalized === 'sent_to_agent') return 'warn';
    return 'neutral';
}

function formatJsonPreview(value) {
    if (!value) return '';

    try {
        return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
        return String(value);
    }
}

function formatBytes(value) {
    const bytes = Number(value || 0);
    if (!bytes) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const size = bytes / (1024 ** index);

    return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
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
