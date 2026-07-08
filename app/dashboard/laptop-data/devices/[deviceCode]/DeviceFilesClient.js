'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, ArrowLeft, ChevronLeft, ChevronRight, Database, Download, FileText, Filter, FolderArchive, RefreshCw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import {
    createFileRequest,
    createFolderZipRequest,
    createZipFileRequest,
    downloadRequestFile,
    getFileKey,
    waitForCompletedRequest,
} from '../../_components/fileRequestClient';

const DEFAULT_RESULT = {
    page: 1,
    pageSize: 100,
    totalFiles: 0,
    totalPages: 0,
    files: [],
};

export default function DeviceFilesClient({ deviceCode, requestedByDefault }) {
    const [result, setResult] = useState(DEFAULT_RESULT);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [queryInput, setQueryInput] = useState('');
    const [extensionInput, setExtensionInput] = useState('');
    const [query, setQuery] = useState('');
    const [extension, setExtension] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [downloadingFileKey, setDownloadingFileKey] = useState('');
    const [selectedFiles, setSelectedFiles] = useState({});
    const [folderPath, setFolderPath] = useState('');
    const [zipRequesting, setZipRequesting] = useState(false);
    const [folderRequesting, setFolderRequesting] = useState(false);

    const loadFiles = useCallback(async () => {
        const params = new URLSearchParams({
            page: String(page),
            pageSize: String(pageSize),
        });

        if (query) params.append('query', query);
        if (extension) params.append('extension', extension);

        try {
            setLoading(true);
            setError('');
            const res = await fetch(
                `/api/admin/devices/${encodeURIComponent(deviceCode)}/files?${params.toString()}`,
                { cache: 'no-store' }
            );
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || 'Unable to load device files.');
            }

            setResult({
                deviceCode: data?.deviceCode || deviceCode,
                page: Number(data?.page || page),
                pageSize: Number(data?.pageSize || pageSize),
                totalFiles: Number(data?.totalFiles || 0),
                totalPages: Number(data?.totalPages || 0),
                files: Array.isArray(data?.files) ? data.files : [],
            });
        } catch (fetchError) {
            setError(fetchError.message || 'Unable to load device files.');
        } finally {
            setLoading(false);
        }
    }, [deviceCode, extension, page, pageSize, query]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    const visibleFiles = useMemo(() => result.files || [], [result.files]);
    const activeFilters = Boolean(query || extension);
    const totalPages = Math.max(Number(result.totalPages || 0), 1);
    const canGoPrevious = page > 1;
    const canGoNext = page < totalPages;
    const isAnyRequesting = Boolean(downloadingFileKey) || zipRequesting || folderRequesting;

    const stats = useMemo(() => {
        const pageBytes = visibleFiles.reduce((total, file) => total + Number(file.sizeBytes || 0), 0);
        const deleted = visibleFiles.filter((file) => file.isDeleted).length;

        return {
            totalFiles: result.totalFiles || 0,
            pageFiles: visibleFiles.length,
            pageBytes,
            deleted,
        };
    }, [result.totalFiles, visibleFiles]);

    const selectedFileList = useMemo(() => Object.values(selectedFiles), [selectedFiles]);
    const selectedPaths = useMemo(
        () => selectedFileList.map((file) => file.fullPath).filter(Boolean),
        [selectedFileList]
    );
    const selectableVisibleFiles = useMemo(
        () => visibleFiles.filter((file) => !file.isDeleted && file.fullPath),
        [visibleFiles]
    );
    const allVisibleSelected = selectableVisibleFiles.length > 0
        && selectableVisibleFiles.every((file) => selectedFiles[getFileKey(file)]);
    const folderOptionsId = 'device-folder-options';
    const visibleDirectories = useMemo(() => {
        const directories = new Set();

        visibleFiles.forEach((file) => {
            if (file.directoryPath) directories.add(file.directoryPath);
        });

        return Array.from(directories).sort((a, b) => a.localeCompare(b));
    }, [visibleFiles]);

    const handleFilterSubmit = (event) => {
        event.preventDefault();
        setPage(1);
        setQuery(queryInput.trim());
        setExtension(extensionInput.trim());
    };

    const handleClearFilters = () => {
        setQueryInput('');
        setExtensionInput('');
        setQuery('');
        setExtension('');
        setPage(1);
    };

    const handlePageSizeChange = (event) => {
        setPageSize(Number(event.target.value));
        setPage(1);
    };

    const toggleFileSelection = (file) => {
        if (file.isDeleted || !file.fullPath) return;

        const fileKey = getFileKey(file);

        setSelectedFiles((current) => {
            const next = { ...current };

            if (next[fileKey]) {
                delete next[fileKey];
            } else {
                next[fileKey] = {
                    ...file,
                    deviceCode: file.deviceCode || deviceCode,
                };
            }

            return next;
        });
    };

    const toggleVisibleSelection = () => {
        setSelectedFiles((current) => {
            const next = { ...current };

            selectableVisibleFiles.forEach((file) => {
                const fileKey = getFileKey(file);

                if (allVisibleSelected) {
                    delete next[fileKey];
                } else {
                    next[fileKey] = {
                        ...file,
                        deviceCode: file.deviceCode || deviceCode,
                    };
                }
            });

            return next;
        });
    };

    const clearSelection = () => {
        setSelectedFiles({});
    };

    const waitAndDownload = async (requestId, fallbackName) => {
        toast.success('ZIP request created. Waiting for agent to finish...');
        const completedRequest = await waitForCompletedRequest(requestId);

        if (!completedRequest) {
            toast.info('Request is queued. Open File Requests when it completes to download it.');
            return false;
        }

        await downloadRequestFile(requestId, completedRequest.originalFileName || fallbackName);
        toast.success('Download started.');
        return true;
    };

    const handleDownload = async (file) => {
        if (file.isDeleted) {
            toast.error('This indexed file is marked deleted.');
            return;
        }

        const fileKey = getFileKey(file);

        try {
            setDownloadingFileKey(fileKey);
            const data = await createFileRequest(file, {
                requestedBy: requestedByDefault || 'Dashboard',
                reason: `Direct download requested from ${deviceCode} file list`,
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

    const handleZipDownload = async () => {
        if (!selectedPaths.length) {
            toast.error('Select at least one file first.');
            return;
        }

        try {
            setZipRequesting(true);
            const data = await createZipFileRequest({
                deviceCode,
                requestedPaths: selectedPaths,
                requestedBy: requestedByDefault || 'Dashboard',
                reason: `${selectedPaths.length} selected files requested as ZIP from ${deviceCode}`,
            });
            const requestId = data?.requestId;

            if (!requestId) {
                throw new Error('ZIP request was created, but no request ID was returned.');
            }

            const downloaded = await waitAndDownload(requestId, `${deviceCode}-selected-files.zip`);
            if (downloaded) clearSelection();
        } catch (zipError) {
            toast.error(zipError.message || 'Unable to create ZIP request.');
        } finally {
            setZipRequesting(false);
        }
    };

    const handleFolderZipDownload = async () => {
        const trimmedFolderPath = folderPath.trim();

        if (!trimmedFolderPath) {
            toast.error('Select or enter a folder path first.');
            return;
        }

        try {
            setFolderRequesting(true);
            const data = await createFolderZipRequest({
                deviceCode,
                folderPath: trimmedFolderPath,
                requestedBy: requestedByDefault || 'Dashboard',
                reason: `Folder ZIP requested from ${deviceCode}`,
            });
            const requestId = data?.requestId;

            if (!requestId) {
                throw new Error('Folder ZIP request was created, but no request ID was returned.');
            }

            await waitAndDownload(requestId, `${getPathBaseName(trimmedFolderPath) || deviceCode}-folder.zip`);
        } catch (folderError) {
            toast.error(folderError.message || 'Unable to create folder ZIP request.');
        } finally {
            setFolderRequesting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                    href="/dashboard/laptop-data/devices"
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-bold text-foreground transition hover:bg-muted/50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Devices
                </Link>

                <button
                    type="button"
                    onClick={loadFiles}
                    disabled={loading}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-bold text-foreground transition hover:bg-muted/50 disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Database} label="Total Indexed" value={formatNumber(stats.totalFiles)} />
                <MetricCard icon={FileText} label="This Page" value={formatNumber(stats.pageFiles)} accent="text-blue-600" />
                <MetricCard icon={Filter} label="Page Size" value={formatNumber(result.pageSize || pageSize)} />
                <MetricCard icon={Database} label="Page Bytes" value={formatBytes(stats.pageBytes)} compact />
            </div>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <form onSubmit={handleFilterSubmit} className="space-y-4">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Device File Index</p>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">Files on {deviceCode}</h2>
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">
                            Page {result.page || page} of {totalPages}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_150px_auto]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                value={queryInput}
                                onChange={(event) => setQueryInput(event.target.value)}
                                placeholder="Search files on this device..."
                                className="h-11 w-full rounded-full border border-input bg-background pl-11 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>

                        <input
                            type="text"
                            value={extensionInput}
                            onChange={(event) => setExtensionInput(event.target.value)}
                            placeholder="Extension: xlsx"
                            className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />

                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <option value={50}>50 / page</option>
                            <option value={100}>100 / page</option>
                            <option value={200}>200 / page</option>
                        </select>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Apply
                        </button>
                    </div>

                    {activeFilters && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active:</span>
                            {query && <FilterPill label={`Query: ${query}`} />}
                            {extension && <FilterPill label={`Extension: ${extension}`} />}
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="text-xs font-bold text-foreground underline-offset-4 hover:underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </form>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.7fr)]">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Selected Files ZIP</p>
                            <h2 className="text-xl font-bold tracking-tight text-foreground">Build a multi-file download</h2>
                            <p className="text-sm text-muted-foreground">
                                {selectedPaths.length
                                    ? `${formatNumber(selectedPaths.length)} file${selectedPaths.length === 1 ? '' : 's'} selected across this device.`
                                    : 'Select files from the table below, then request them as one ZIP.'}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {selectedPaths.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    disabled={isAnyRequesting}
                                    className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-xs font-bold text-foreground transition hover:bg-muted/50 disabled:opacity-50"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Clear
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleZipDownload}
                                disabled={!selectedPaths.length || isAnyRequesting}
                                className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-xs font-bold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                {zipRequesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                                {zipRequesting ? 'Preparing ZIP' : 'Download Selected ZIP'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Folder ZIP</p>
                        <h2 className="text-xl font-bold tracking-tight text-foreground">Request a full folder</h2>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <FolderArchive className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                list={folderOptionsId}
                                value={folderPath}
                                onChange={(event) => setFolderPath(event.target.value)}
                                placeholder="Select or paste folder path"
                                className="h-11 w-full rounded-full border border-input bg-background pl-11 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <datalist id={folderOptionsId}>
                                {visibleDirectories.map((directory) => (
                                    <option key={directory} value={directory} />
                                ))}
                            </datalist>
                        </div>
                        <button
                            type="button"
                            onClick={handleFolderZipDownload}
                            disabled={!folderPath.trim() || isAnyRequesting}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            {folderRequesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FolderArchive className="h-4 w-4" />}
                            Folder ZIP
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
                    <table className="w-full min-w-[1180px] text-left text-sm">
                        <thead className="border-b border-border bg-muted/30 text-xs uppercase">
                            <tr>
                                <th className="w-12 px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={allVisibleSelected}
                                        onChange={toggleVisibleSelection}
                                        disabled={!selectableVisibleFiles.length || isAnyRequesting}
                                        aria-label="Select all files on this page"
                                        className="h-4 w-4 rounded border-border bg-background text-foreground"
                                    />
                                </th>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">File</th>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Directory</th>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Size</th>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Updated</th>
                                <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Indexed</th>
                                <th className="px-6 py-4 text-right font-bold tracking-widest text-muted-foreground">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading && visibleFiles.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-sm text-muted-foreground">
                                        Loading files from {deviceCode}...
                                    </td>
                                </tr>
                            ) : visibleFiles.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-sm text-muted-foreground">
                                        {activeFilters ? 'No files matched these filters.' : 'No files were returned for this device.'}
                                    </td>
                                </tr>
                            ) : (
                                visibleFiles.map((file) => {
                                    const fileKey = getFileKey(file);
                                    const isDownloading = downloadingFileKey === fileKey;

                                    return (
                                        <tr key={file.id || fileKey} className="transition-colors hover:bg-muted/20">
                                            <td className="px-6 py-5">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(selectedFiles[fileKey])}
                                                    onChange={() => toggleFileSelection(file)}
                                                    disabled={file.isDeleted || !file.fullPath || isAnyRequesting}
                                                    aria-label={`Select ${file.fileName || file.fullPath || 'file'}`}
                                                    className="h-4 w-4 rounded border-border bg-background text-foreground disabled:opacity-40"
                                                />
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-semibold text-foreground">{file.fileName || '-'}</p>
                                                        {file.isDeleted && (
                                                            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                                                                Deleted
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="font-mono text-[11px] text-muted-foreground">{file.extension || 'file'}</p>
                                                </div>
                                            </td>
                                            <td className="max-w-md px-6 py-5">
                                                <p className="truncate font-mono text-xs text-muted-foreground" title={file.fullPath || file.directoryPath}>
                                                    {file.directoryPath || file.fullPath || '-'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-xs text-muted-foreground">{formatBytes(file.sizeBytes)}</td>
                                            <td className="px-6 py-5 text-xs text-muted-foreground">{formatDateTime(file.updatedAtUtc)}</td>
                                            <td className="px-6 py-5 text-xs text-muted-foreground">{formatDateTime(file.lastIndexedAtUtc)}</td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownload(file)}
                                                    disabled={isAnyRequesting || file.isDeleted}
                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-xs font-bold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                                                >
                                                    {isDownloading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                                    {isDownloading ? 'Preparing' : 'Download'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs font-medium text-muted-foreground">
                        Showing {formatNumber(visibleFiles.length)} of {formatNumber(result.totalFiles || 0)} indexed files
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            disabled={!canGoPrevious || loading}
                            className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-background px-4 text-xs font-bold text-foreground transition hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </button>
                        <span className="rounded-full border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground">
                            {result.page || page} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                            disabled={!canGoNext || loading}
                            className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-background px-4 text-xs font-bold text-foreground transition hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
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

function FilterPill({ label }) {
    return (
        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-muted-foreground">
            {label}
        </span>
    );
}

function formatNumber(value) {
    return new Intl.NumberFormat('en-IN').format(Number(value || 0));
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

function getPathBaseName(path) {
    if (!path) return '';
    const parts = String(path).split(/[\\/]/).filter(Boolean);
    return parts.at(-1) || '';
}
