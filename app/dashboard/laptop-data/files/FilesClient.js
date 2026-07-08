'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, FileText, FolderSearch, HardDrive, RefreshCw, Search, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
    createFileRequest,
    downloadRequestFile,
    getFileKey,
    waitForCompletedRequest,
} from '../_components/fileRequestClient';

export default function FilesClient({ requestedByDefault }) {
    const [query, setQuery] = useState('csv');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [requestedBy, setRequestedBy] = useState(requestedByDefault || '');
    const [reason, setReason] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [downloadingFileKey, setDownloadingFileKey] = useState('');

    const searchFiles = useCallback(async (nextQuery) => {
        const trimmedQuery = String(nextQuery || '').trim();

        if (!trimmedQuery) {
            setFiles([]);
            setError('Enter a file name, extension, or keyword to search.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const res = await fetch(`/api/admin/files/search?query=${encodeURIComponent(trimmedQuery)}`, { cache: 'no-store' });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || 'Unable to search files.');
            }

            setFiles(Array.isArray(data) ? data : []);
        } catch (fetchError) {
            setError(fetchError.message || 'Unable to search files.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        searchFiles('csv');
    }, [searchFiles]);

    useEffect(() => {
        setRequestedBy(requestedByDefault || '');
    }, [requestedByDefault]);

    const stats = useMemo(() => {
        const devices = new Set(files.map((file) => file.deviceCode).filter(Boolean));
        const totalBytes = files.reduce((total, file) => total + Number(file.sizeBytes || 0), 0);

        return {
            count: files.length,
            devices: devices.size,
            totalBytes,
        };
    }, [files]);

    const handleSubmit = (event) => {
        event.preventDefault();
        searchFiles(query);
    };

    const handleCreateRequest = async (event) => {
        event.preventDefault();

        if (!selectedFile) return;
        if (!requestedBy.trim()) {
            toast.error('Requested by is required.');
            return;
        }

        try {
            setRequesting(true);
            const data = await createFileRequest(selectedFile, {
                requestedBy: requestedBy.trim(),
                reason: reason.trim() || 'Requested from Laptop Data dashboard',
            });
            toast.success(`File request created${data?.requestId ? `: ${data.requestId}` : ''}`);
            setSelectedFile(null);
            setReason('');
        } catch (requestError) {
            toast.error(requestError.message || 'Unable to create file request.');
        } finally {
            setRequesting(false);
        }
    };

    const handleDirectDownload = async (file) => {
        const fileKey = getFileKey(file);

        try {
            setDownloadingFileKey(fileKey);
            const data = await createFileRequest(file, {
                requestedBy: requestedBy.trim() || requestedByDefault || 'Dashboard',
                reason: 'Direct download requested from File Search',
            });
            const requestId = data?.requestId;

            if (!requestId) {
                throw new Error('File request was created, but no request ID was returned.');
            }

            toast.success('File request created. Waiting for agent to finish...');
            const completedRequest = await waitForCompletedRequest(requestId);

            if (!completedRequest) {
                toast.info('Request is queued. Open File Requests when it completes to download it.');
                return;
            }

            await downloadRequestFile(requestId, completedRequest.originalFileName || file.fileName);
            toast.success('Download started.');
        } catch (downloadError) {
            toast.error(downloadError.message || 'Unable to download file.');
        } finally {
            setDownloadingFileKey('');
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <MetricCard icon={FileText} label="Matches" value={stats.count} />
                <MetricCard icon={HardDrive} label="Devices" value={stats.devices} accent="text-blue-600" />
                <MetricCard icon={FolderSearch} label="Total Size" value={formatBytes(stats.totalBytes)} compact />
            </div>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Search Index</p>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Find files across laptops</h2>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="csv, sales, antigravity.py..."
                                className="h-11 w-full rounded-full border border-input bg-background pl-11 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Search
                        </button>
                    </div>
                </form>
            </section>

            {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive" role="alert">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-left text-sm">
                            <thead className="border-b border-border bg-muted/30 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">File</th>
                                    <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Device</th>
                                    <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Directory</th>
                                    <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Size</th>
                                    <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Updated</th>
                                    <th className="px-6 py-4 text-right font-bold tracking-widest text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading && files.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center text-sm text-muted-foreground">
                                            Searching laptop file indexes...
                                        </td>
                                    </tr>
                                ) : files.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center text-sm text-muted-foreground">
                                            No files found. Try another keyword or extension.
                                        </td>
                                    </tr>
                                ) : (
                                    files.map((file) => {
                                        const isSelected = selectedFile?.fullPath === file.fullPath && selectedFile?.deviceCode === file.deviceCode;
                                        const fileKey = getFileKey(file);
                                        const isDownloading = downloadingFileKey === fileKey;

                                        return (
                                            <tr key={`${file.deviceCode}-${file.fullPath}`} className={`transition-colors hover:bg-muted/20 ${isSelected ? 'bg-muted/30' : ''}`}>
                                                <td className="px-6 py-5">
                                                    <div className="min-w-0 space-y-1">
                                                        <p className="font-semibold text-foreground">{file.fileName || '-'}</p>
                                                        <p className="font-mono text-[11px] text-muted-foreground">{file.extension || 'file'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 font-mono text-xs font-bold text-foreground">{file.deviceCode || '-'}</td>
                                                <td className="max-w-sm px-6 py-5">
                                                    <p className="truncate font-mono text-xs text-muted-foreground" title={file.directoryPath || file.fullPath}>
                                                        {file.directoryPath || '-'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5 text-xs text-muted-foreground">{formatBytes(file.sizeBytes)}</td>
                                                <td className="px-6 py-5 text-xs text-muted-foreground">{formatDateTime(file.updatedAtUtc)}</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDirectDownload(file)}
                                                            disabled={Boolean(downloadingFileKey)}
                                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-xs font-bold text-background transition hover:opacity-90 disabled:opacity-50"
                                                        >
                                                            {isDownloading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                                            {isDownloading ? 'Preparing' : 'Download'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedFile(file)}
                                                            className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-4 text-xs font-bold text-foreground transition hover:bg-muted/50"
                                                        >
                                                            Request
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:sticky xl:top-6 xl:self-start">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Request File</p>
                        <h2 className="text-xl font-bold tracking-tight text-foreground">Create retrieval request</h2>
                    </div>

                    {selectedFile ? (
                        <form onSubmit={handleCreateRequest} className="mt-5 space-y-5">
                            <div className="rounded-xl border border-border bg-background p-4">
                                <p className="text-sm font-bold text-foreground">{selectedFile.fileName}</p>
                                <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-muted-foreground">{selectedFile.fullPath}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {selectedFile.deviceCode || 'No device'}
                                    </span>
                                    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {formatBytes(selectedFile.sizeBytes)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="requestedBy" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Requested By</label>
                                <input
                                    id="requestedBy"
                                    value={requestedBy}
                                    onChange={(event) => setRequestedBy(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reason</label>
                                <textarea
                                    id="reason"
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                    placeholder="Why is this file needed?"
                                    className="min-h-28 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={requesting}
                                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-50"
                                >
                                    {requesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Submit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedFile(null)}
                                    className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-bold text-foreground transition hover:bg-muted/50"
                                >
                                    Clear
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mt-6 rounded-xl border border-dashed border-border bg-background p-6 text-center">
                            <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" />
                            <p className="mt-3 text-sm font-semibold text-foreground">Select a file to request</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                Search results appear on the left. Choose Request to prepare the payload for the agent.
                            </p>
                        </div>
                    )}
                </aside>
            </div>
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
