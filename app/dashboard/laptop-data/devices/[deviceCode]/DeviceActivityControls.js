'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    CloudUpload,
    Loader2,
    RefreshCw,
    Search,
} from 'lucide-react';
import { toast } from 'sonner';

const CONTROLS = [
    {
        id: 'scan',
        label: 'File scanning',
        description: 'Indexes device files and synchronizes their metadata.',
        icon: Search,
        endpoint: '/api/admin/remote-commands/scan',
        commandTypes: ['START_SCAN', 'STOP_SCAN'],
    },
    {
        id: 'file-upload',
        label: 'Automatic uploads',
        description: 'Runs the automatic Backblaze upload pipeline.',
        icon: CloudUpload,
        endpoint: '/api/admin/remote-commands/file-upload',
        commandTypes: ['START_FILE_UPLOAD', 'STOP_FILE_UPLOAD'],
    },
];

export default function DeviceActivityControls({ deviceCode, compact = false }) {
    const [commands, setCommands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [queueing, setQueueing] = useState('');
    const [error, setError] = useState('');

    const loadCommands = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setLoading(true);

        try {
            const params = new URLSearchParams({
                deviceCode,
                take: '50',
            });
            const response = await fetch(
                `/api/admin/remote-commands?${params.toString()}`,
                { cache: 'no-store' }
            );
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.error || 'Unable to load activity controls.');
            }

            setCommands(Array.isArray(data) ? data : []);
            setError('');
        } catch (loadError) {
            setError(loadError.message || 'Unable to load activity controls.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [deviceCode]);

    useEffect(() => {
        loadCommands();
    }, [loadCommands]);

    const controlStates = useMemo(
        () => CONTROLS.map((control) => ({
            ...control,
            state: deriveControlState(commands, control.commandTypes),
        })),
        [commands]
    );

    const hasPendingCommand = controlStates.some((control) => control.state.pending);

    useEffect(() => {
        if (!hasPendingCommand) return undefined;

        const interval = window.setInterval(() => {
            loadCommands(true);
        }, 5000);

        return () => window.clearInterval(interval);
    }, [hasPendingCommand, loadCommands]);

    const queueCommand = async (control, action) => {
        const queueKey = `${control.id}-${action}`;
        setQueueing(queueKey);
        setError('');

        try {
            const response = await fetch(`${control.endpoint}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceCode }),
            });
            const data = await response.json().catch(() => null);

            if (!response.ok || data?.success === false) {
                throw new Error(data?.error || data?.message || `Unable to ${action} ${control.label.toLowerCase()}.`);
            }

            if (data?.command?.id) {
                setCommands((current) => [
                    data.command,
                    ...current.filter((command) => command.id !== data.command.id),
                ]);
            } else {
                await loadCommands(true);
            }

            toast.success(data?.message || `${control.label} ${action} command queued.`);
        } catch (queueError) {
            toast.error(queueError.message || `Unable to ${action} ${control.label.toLowerCase()}.`);
        } finally {
            setQueueing('');
        }
    };

    if (compact) {
        return (
            <div className="min-w-[220px] space-y-2">
                {controlStates.map((control) => (
                    <CompactActivityControl
                        key={control.id}
                        control={control}
                        loading={loading}
                        queueing={queueing}
                        onQueue={queueCommand}
                    />
                ))}
                {error && (
                    <p className="max-w-[240px] text-[10px] font-semibold leading-snug text-red-600" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }

    return (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
                        Agent operations
                    </p>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                        Activity control
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Changes are applied only after the device reports the command as completed.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => loadCommands(true)}
                    disabled={loading || refreshing}
                    aria-label="Refresh activity controls"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading || refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {error && (
                <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-600" role="alert">
                    {error}
                </p>
            )}

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {controlStates.map((control) => (
                    <ActivityControl
                        key={control.id}
                        control={control}
                        loading={loading}
                        queueing={queueing}
                        onQueue={queueCommand}
                    />
                ))}
            </div>
        </section>
    );
}

function CompactActivityControl({ control, loading, queueing, onQueue }) {
    const Icon = control.icon;
    const { state } = control;
    const queueingControl = queueing.startsWith(`${control.id}-`);
    const enabled = state.enabled === true;
    const busy = loading || state.pending || queueingControl;
    const nextAction = enabled ? 'stop' : 'start';
    const shortLabel = control.id === 'scan' ? 'Scan' : 'Upload';

    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                    <p className="text-xs font-bold leading-none text-foreground">{shortLabel}</p>
                    <p className={`mt-1 flex items-center gap-1 text-[10px] font-semibold leading-none ${getCompactStatusClass(state.tone)}`}>
                        {(loading || queueingControl || state.pending) && (
                            <Loader2 className="h-2.5 w-2.5 animate-spin" aria-hidden="true" />
                        )}
                        {loading ? 'Loading' : queueingControl ? 'Queuing' : state.label}
                    </p>
                </div>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={`${enabled ? 'Disable' : 'Enable'} ${control.label} for this device`}
                title={`${enabled ? 'Disable' : 'Enable'} ${control.label}`}
                onClick={() => onQueue(control, nextAction)}
                disabled={busy}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
                    enabled
                        ? 'border-green-600 bg-green-600'
                        : 'border-border bg-muted'
                }`}
            >
                <span
                    aria-hidden="true"
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </button>
        </div>
    );
}

function ActivityControl({ control, loading, queueing, onQueue }) {
    const Icon = control.icon;
    const { state } = control;
    const queueingControl = queueing.startsWith(`${control.id}-`);
    const enabled = state.enabled === true;
    const busy = loading || state.pending || queueingControl;
    const nextAction = enabled ? 'stop' : 'start';

    return (
        <article className="rounded-xl border border-border bg-background p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
                        <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-foreground">{control.label}</h3>
                            <StatusBadge state={state} loading={loading} queueing={queueingControl} />
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            {state.detail || control.description}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 sm:pt-1">
                    <span className="text-xs font-bold text-muted-foreground">
                        {enabled ? 'On' : 'Off'}
                    </span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={`${enabled ? 'Disable' : 'Enable'} ${control.label}`}
                        onClick={() => onQueue(control, nextAction)}
                        disabled={busy}
                        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
                            enabled
                                ? 'border-green-600 bg-green-600'
                                : 'border-border bg-muted'
                        }`}
                    >
                        <span
                            aria-hidden="true"
                            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                                enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>
        </article>
    );
}

function getCompactStatusClass(tone) {
    if (tone === 'ok') return 'text-green-600';
    if (tone === 'pending') return 'text-amber-600';
    if (tone === 'failed') return 'text-red-600';
    return 'text-muted-foreground';
}

function StatusBadge({ state, loading, queueing }) {
    const styles = {
        ok: 'border-green-500/20 bg-green-500/10 text-green-600',
        paused: 'border-border bg-muted text-muted-foreground',
        pending: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
        failed: 'border-red-500/20 bg-red-500/10 text-red-600',
        unknown: 'border-blue-500/20 bg-blue-500/10 text-blue-600',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${styles[state.tone] || styles.unknown}`}>
            {(loading || queueing || state.pending) && <Loader2 className="h-3 w-3 animate-spin" />}
            {loading ? 'Loading' : queueing ? 'Queuing' : state.label}
        </span>
    );
}

function deriveControlState(commands, commandTypes) {
    const relevant = commands
        .filter((command) => commandTypes.includes(String(command.commandType || '').toUpperCase()))
        .sort((left, right) =>
            new Date(right.requestedAtUtc || 0).getTime() -
            new Date(left.requestedAtUtc || 0).getTime()
        );

    const latest = relevant[0];
    if (!latest) {
        return {
            enabled: null,
            pending: false,
            label: 'Unknown',
            tone: 'unknown',
            detail: 'No completed activity-control command is available yet.',
        };
    }

    const status = String(latest.status || '').toLowerCase();
    const startsActivity = String(latest.commandType || '').toUpperCase().startsWith('START_');
    const actionLabel = startsActivity ? 'Start' : 'Stop';
    const lastCompleted = relevant.find(
        (command) => String(command.status || '').toLowerCase() === 'completed'
    );
    const acknowledgedEnabled = lastCompleted
        ? String(lastCompleted.commandType || '').toUpperCase().startsWith('START_')
        : null;

    if (status === 'pending' || status === 'sent_to_agent') {
        return {
            enabled: acknowledgedEnabled,
            pending: true,
            label: `${actionLabel} queued`,
            tone: 'pending',
            detail:
                status === 'sent_to_agent'
                    ? 'Delivered to the Agent; waiting for its completed acknowledgement.'
                    : 'Waiting for the Agent to collect this command.',
        };
    }

    if (status === 'failed') {
        return {
            enabled: acknowledgedEnabled,
            pending: false,
            label: 'Command failed',
            tone: 'failed',
            detail: latest.errorMessage || 'The Agent could not apply the last command.',
        };
    }

    if (status === 'completed') {
        return {
            enabled: startsActivity,
            pending: false,
            label: startsActivity ? 'Enabled' : 'Paused',
            tone: startsActivity ? 'ok' : 'paused',
            detail: startsActivity
                ? 'The device acknowledged that this activity is enabled.'
                : 'The device acknowledged that this activity is paused.',
        };
    }

    return {
        enabled: acknowledgedEnabled,
        pending: false,
        label: 'Unknown',
        tone: 'unknown',
        detail: 'The latest command has an unrecognized status.',
    };
}
