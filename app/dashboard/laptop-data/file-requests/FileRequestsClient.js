'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Download, Loader2, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function FileRequestsClient() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState('');
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const res = await fetch('/api/admin/file-requests', { cache: 'no-store' });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || 'Unable to load file requests.');
            }

            setRequests(Array.isArray(data) ? data : []);
        } catch (fetchError) {
            setError(fetchError.message || 'Unable to load file requests.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const filteredRequests = useMemo(() => {
        const term = search.trim().toLowerCase();
        const sorted = [...requests].sort((a, b) =>
            new Date(b.requestedAtUtc || 0).getTime() - new Date(a.requestedAtUtc || 0).getTime()
        );

        if (!term) return sorted;

        return sorted.filter((request) =>
            [
                request.id,
                request.deviceCode,
                request.requestedPath,
                request.requestedBy,
                request.reason,
                request.status,
                request.originalFileName,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term))
        );
    }, [requests, search]);

    const stats = useMemo(() => {
        const completed = requests.filter((request) => request.status === 'completed').length;
        const pending = requests.filter((request) => request.status === 'pending').length;
        const failed = requests.filter((request) => request.status === 'failed' || request.errorMessage).length;

        return {
            total: requests.length,
            completed,
            pending,
            failed,
        };
    }, [requests]);

    const handleDownload = async (request) => {
        try {
            setDownloadingId(request.id);
            const res = await fetch(`/api/admin/file-requests/${encodeURIComponent(request.id)}/download`, {
                cache: 'no-store',
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || 'Unable to download file.');
            }

            const blob = await res.blob();
            const filename =
                getFilenameFromDisposition(res.headers.get('content-disposition')) ||
                request.originalFileName ||
                'requested-file';
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            toast.success('Download started.');
        } catch (downloadError) {
            toast.error(downloadError.message || 'Unable to download file.');
        } finally {
            setDownloadingId('');
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={ClipboardList} label="Total Requests" value={stats.total} />
                <MetricCard icon={CheckCircle2} label="Completed" value={stats.completed} accent="text-green-600" />
                <MetricCard icon={Loader2} label="Pending" value={stats.pending} accent="text-amber-600" />
                <MetricCard icon={AlertTriangle} label="Needs Attention" value={stats.failed} accent="text-red-600" />
            </div>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Request Queue</p>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Track file retrievals</h2>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-96">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search request, file, device, status..."
                                className="h-11 w-full rounded-full border border-input bg-background pl-11 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={fetchRequests}
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
                    <table className="w-full min-w-[1080px] text-left text-sm">
                        <thead className="border-b border-border bg-muted/30 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">File</th>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Device</th>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Requested By</th>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Status</th>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Timing</th>
                                <th className="px-6 py-4 text-right font-bold tracking-widest text-muted-foreground">Download</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading && requests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-sm text-muted-foreground">
                                        Loading file requests...
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-sm text-muted-foreground">
                                        {search ? 'No file requests matched the current search.' : 'No file requests have been created yet.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((request) => {
                                    const canDownload = request.status === 'completed';
                                    const isDownloading = downloadingId === request.id;

                                    return (
                                        <tr key={request.id} className="transition-colors hover:bg-muted/20">
                                            <td className="px-6 py-5">
                                                <div className="min-w-0 space-y-1">
                                                    <p className="font-semibold text-foreground">{request.originalFileName || getFileName(request.requestedPath)}</p>
                                                    <p className="max-w-lg break-all font-mono text-[11px] leading-relaxed text-muted-foreground">{request.requestedPath || '-'}</p>
                                                    {request.errorMessage && (
                                                        <p className="text-xs font-medium text-red-600">{request.errorMessage}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-mono text-xs font-bold text-foreground">{request.deviceCode || '-'}</td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-medium text-foreground">{request.requestedBy || '-'}</p>
                                                <p className="max-w-xs truncate text-xs text-muted-foreground" title={request.reason || ''}>{request.reason || '-'}</p>
                                            </td>
                                            <td className="px-6 py-5"><StatusBadge status={request.status} /></td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                                                    <p>Requested: {formatDateTime(request.requestedAtUtc)}</p>
                                                    <p>Started: {formatDateTime(request.startedAtUtc)}</p>
                                                    <p>Done: {formatDateTime(request.completedAtUtc)}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownload(request)}
                                                    disabled={!canDownload || isDownloading}
                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-xs font-bold text-foreground transition hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-45"
                                                >
                                                    {isDownloading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                                    Download
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
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

function StatusBadge({ status }) {
    const normalized = String(status || 'unknown').toLowerCase();
    const styles = {
        completed: 'border-green-500/20 bg-green-500/10 text-green-600',
        pending: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
        started: 'border-blue-500/20 bg-blue-500/10 text-blue-600',
        failed: 'border-red-500/20 bg-red-500/10 text-red-600',
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${styles[normalized] || 'border-border bg-muted text-muted-foreground'}`}>
            {normalized}
        </span>
    );
}

function getFileName(path) {
    if (!path) return '-';
    return String(path).split(/[\\/]/).pop() || path;
}

function getFilenameFromDisposition(disposition) {
    if (!disposition) return '';

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1].replace(/"/g, ''));
        } catch {
            return utf8Match[1].replace(/"/g, '');
        }
    }

    const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
    return filenameMatch?.[1] || '';
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
