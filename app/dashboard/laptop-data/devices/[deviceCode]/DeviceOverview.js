'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Activity,
    ClipboardList,
    Database,
    FileText,
    HardDrive,
    Clock,
    PieChart,
    RefreshCw,
    TerminalSquare,
} from 'lucide-react';
import { formatBytes, formatNumber, formatDateTime, timeAgo, extensionOf } from './deviceFormat';

const BAR_COLORS = [
    '#6d2db7', '#2563eb', '#059669', '#d97706', '#dc2626',
    '#0891b2', '#7c3aed', '#db2777',
];

export default function DeviceOverview({ deviceCode }) {
    const [scan, setScan] = useState({ totalFiles: 0, totalBytes: 0, byExt: [], largest: [], capped: false });
    const [scanLoading, setScanLoading] = useState(true);
    const [diag, setDiag] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    // Scan every indexed file to build storage-by-type + largest-files + totals.
    const runScan = useCallback(async () => {
        const SCAN_SIZE = 1000;
        const MAX_PAGES = 200;
        setScanLoading(true);
        try {
            const extMap = new Map();
            const largest = [];
            let totalBytes = 0;
            let totalFiles = 0;
            let collected = 0;
            let total = Infinity;
            let pageNum = 1;
            let capped = false;

            while (pageNum <= MAX_PAGES) {
                const res = await fetch(
                    `/api/admin/devices/${encodeURIComponent(deviceCode)}/files?page=${pageNum}&pageSize=${SCAN_SIZE}`,
                    { cache: 'no-store' }
                );
                const data = await res.json().catch(() => null);
                if (!res.ok) throw new Error(data?.error || 'scan failed');
                const files = Array.isArray(data?.files) ? data.files : [];
                total = Number(data?.totalFiles || collected + files.length);

                for (const f of files) {
                    const size = Number(f.sizeBytes || 0);
                    totalBytes += size;
                    const ext = extensionOf(f.fullPath || f.name);
                    extMap.set(ext, (extMap.get(ext) || 0) + size);
                    // keep a running top-10 largest
                    if (largest.length < 10) {
                        largest.push({ path: f.fullPath || f.name || '(unknown)', size });
                        largest.sort((a, b) => b.size - a.size);
                    } else if (size > largest[largest.length - 1].size) {
                        largest[largest.length - 1] = { path: f.fullPath || f.name || '(unknown)', size };
                        largest.sort((a, b) => b.size - a.size);
                    }
                }

                collected += files.length;
                totalFiles = total;
                if (files.length === 0 || collected >= total) break;
                pageNum += 1;
                if (pageNum > MAX_PAGES && collected < total) capped = true;
            }

            const byExt = [...extMap.entries()]
                .map(([ext, bytes]) => ({ ext, bytes }))
                .sort((a, b) => b.bytes - a.bytes)
                .slice(0, 8);

            setScan({ totalFiles, totalBytes, byExt, largest, capped });
        } catch {
            // leave whatever we have
        } finally {
            setScanLoading(false);
        }
    }, [deviceCode]);

    const loadMeta = useCallback(async () => {
        setLoading(true);
        try {
            const [diagRes, logRes, cmdRes] = await Promise.all([
                fetch(`/api/admin/devices/${encodeURIComponent(deviceCode)}/diagnostics?take=1`, { cache: 'no-store' }),
                fetch(`/api/admin/devices/${encodeURIComponent(deviceCode)}/logs?take=8`, { cache: 'no-store' }),
                fetch(`/api/admin/remote-commands?deviceCode=${encodeURIComponent(deviceCode)}&take=8`, { cache: 'no-store' }),
            ]);
            const diagData = await diagRes.json().catch(() => null);
            const logData = await logRes.json().catch(() => null);
            const cmdData = await cmdRes.json().catch(() => null);

            setDiag(Array.isArray(diagData) ? diagData[0] || null : null);

            const logs = (Array.isArray(logData) ? logData : []).map((l) => ({
                id: `log-${l.id || l.createdAtUtc}`,
                kind: 'log',
                level: l.level,
                title: l.message || l.category || 'Log',
                at: l.createdAtUtc,
            }));
            const cmds = (Array.isArray(cmdData) ? cmdData : []).map((c) => ({
                id: `cmd-${c.id}`,
                kind: 'command',
                level: c.status,
                title: c.commandType || 'Command',
                at: c.requestedAtUtc,
            }));
            const merged = [...logs, ...cmds]
                .filter((x) => x.at)
                .sort((a, b) => new Date(b.at) - new Date(a.at))
                .slice(0, 12);
            setActivity(merged);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [deviceCode]);

    useEffect(() => { runScan(); loadMeta(); }, [runScan, loadMeta]);

    const maxExtBytes = useMemo(
        () => scan.byExt.reduce((m, e) => Math.max(m, e.bytes), 0) || 1,
        [scan.byExt]
    );

    return (
        <div className="space-y-6">
            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatTile icon={FileText} label="Indexed Files" value={scanLoading && !scan.totalFiles ? '…' : formatNumber(scan.totalFiles)} />
                <StatTile icon={Database} label="Total Size" value={scanLoading && !scan.totalBytes ? '…' : `${formatBytes(scan.totalBytes)}${scan.capped ? '+' : ''}`} accent="text-[#6d2db7]" />
                <StatTile icon={HardDrive} label="Free Disk" value={diag ? formatBytes(diag.systemDriveFreeBytes) : '—'} />
                <StatTile icon={Clock} label="Last Check-in" value={diag ? timeAgo(diag.lastHeartbeatUtc || diag.createdAtUtc) : '—'} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Storage by type */}
                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <SectionHead icon={PieChart} eyebrow="Storage" title="By file type" onRefresh={runScan} busy={scanLoading} />
                    {scan.byExt.length === 0 ? (
                        <Empty label={scanLoading ? 'Scanning files…' : 'No files indexed.'} spinning={scanLoading} />
                    ) : (
                        <div className="mt-5 space-y-3">
                            {scan.byExt.map((e, i) => (
                                <div key={e.ext} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-mono font-bold text-foreground">.{e.ext}</span>
                                        <span className="text-muted-foreground">{formatBytes(e.bytes)}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${Math.max(3, (e.bytes / maxExtBytes) * 100)}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Largest files */}
                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <SectionHead icon={Database} eyebrow="Storage" title="Largest files" onRefresh={runScan} busy={scanLoading} />
                    {scan.largest.length === 0 ? (
                        <Empty label={scanLoading ? 'Scanning files…' : 'No files indexed.'} spinning={scanLoading} />
                    ) : (
                        <ol className="mt-5 space-y-2">
                            {scan.largest.map((f, i) => (
                                <li key={`${f.path}-${i}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
                                    <span className="flex min-w-0 items-center gap-2">
                                        <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
                                        <span className="truncate text-xs text-foreground" title={f.path}>{f.path}</span>
                                    </span>
                                    <span className="shrink-0 text-xs font-bold text-foreground">{formatBytes(f.size)}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            </div>

            {/* Activity timeline */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <SectionHead icon={Activity} eyebrow="Recent" title="Activity" onRefresh={loadMeta} busy={loading} />
                {activity.length === 0 ? (
                    <Empty label={loading ? 'Loading activity…' : 'No recent logs or commands.'} spinning={loading} />
                ) : (
                    <ul className="mt-5 space-y-1">
                        {activity.map((item) => (
                            <li key={item.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40">
                                {item.kind === 'command'
                                    ? <TerminalSquare className="h-4 w-4 shrink-0 text-amber-600" />
                                    : <ClipboardList className="h-4 w-4 shrink-0 text-blue-600" />}
                                <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={item.title}>{item.title}</span>
                                <LevelDot level={item.level} />
                                <span className="shrink-0 text-[11px] text-muted-foreground" title={formatDateTime(item.at)}>{timeAgo(item.at)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

function StatTile({ icon: Icon, label, value, accent = 'text-foreground' }) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`mt-4 text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
        </div>
    );
}

function SectionHead({ icon: Icon, eyebrow, title, onRefresh, busy }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">{eyebrow}</p>
                <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
            </div>
            <button
                type="button"
                onClick={onRefresh}
                disabled={busy}
                className="rounded-full border border-border bg-background p-2 text-muted-foreground transition hover:bg-muted/50 disabled:opacity-50"
                aria-label="Refresh"
            >
                <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
            </button>
        </div>
    );
}

function Empty({ label, spinning }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
            <RefreshCw className={`h-6 w-6 ${spinning ? 'animate-spin' : ''}`} />
            <p className="mt-3 font-medium">{label}</p>
        </div>
    );
}

function LevelDot({ level }) {
    const l = String(level || '').toLowerCase();
    let color = 'bg-muted-foreground/40';
    if (['error', 'failed'].includes(l)) color = 'bg-red-500';
    else if (['warning', 'warn'].includes(l)) color = 'bg-amber-500';
    else if (['completed', 'success', 'info'].includes(l)) color = 'bg-green-500';
    else if (['pending', 'sent_to_agent'].includes(l)) color = 'bg-blue-500';
    return <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} title={level || ''} />;
}
