'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    Clock3,
    CloudUpload,
    FileText,
    Loader2,
    Plus,
    RefreshCw,
    RotateCcw,
    Save,
    Search,
    ShieldCheck,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_EXTENSIONS = [
    '.pdf',
    '.doc',
    '.docx',
    '.docm',
    '.xls',
    '.xlsx',
    '.xlsm',
    '.xlsb',
    '.csv',
    '.ppt',
    '.pptx',
    '.pptm',
    '.excle',
];

const INITIAL_FILTERS = {
    deviceCode: '',
    status: '',
    take: '200',
};

const STATUS_STYLES = {
    completed: 'border-green-500/20 bg-green-500/10 text-green-600',
    uploading: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
    failed: 'border-red-500/20 bg-red-500/10 text-red-600',
    aborted: 'border-red-500/20 bg-red-500/10 text-red-600',
};

export default function UploadsClient() {
    const [savedPolicy, setSavedPolicy] = useState(null);
    const [isEnabled, setIsEnabled] = useState(true);
    const [maxFileSizeBytes, setMaxFileSizeBytes] = useState('1073741824');
    const [extensions, setExtensions] = useState(DEFAULT_EXTENSIONS);
    const [extensionInput, setExtensionInput] = useState('');
    const [policyLoading, setPolicyLoading] = useState(true);
    const [policySaving, setPolicySaving] = useState(false);
    const [policyError, setPolicyError] = useState('');

    const [uploads, setUploads] = useState([]);
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [uploadsLoading, setUploadsLoading] = useState(true);
    const [uploadsError, setUploadsError] = useState('');

    const applyPolicy = useCallback((policy) => {
        const nextExtensions = normalizeExtensions(policy?.extensions);

        setSavedPolicy(policy);
        setIsEnabled(policy?.isEnabled !== false);
        setMaxFileSizeBytes(String(policy?.maxFileSizeBytes || 1073741824));
        setExtensions(nextExtensions.length > 0 ? nextExtensions : DEFAULT_EXTENSIONS);
        setExtensionInput('');
    }, []);

    const loadPolicy = useCallback(async () => {
        try {
            setPolicyLoading(true);
            setPolicyError('');
            const response = await fetch('/api/admin/file-upload-policy', { cache: 'no-store' });
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.error || 'Unable to load the file upload policy.');
            }

            applyPolicy(data || {});
        } catch (error) {
            setPolicyError(error.message || 'Unable to load the file upload policy.');
        } finally {
            setPolicyLoading(false);
        }
    }, [applyPolicy]);

    const loadUploads = useCallback(async (nextFilters) => {
        try {
            setUploadsLoading(true);
            setUploadsError('');

            const searchParams = new URLSearchParams();
            const deviceCode = nextFilters.deviceCode.trim();

            if (deviceCode) searchParams.set('deviceCode', deviceCode);
            if (nextFilters.status) searchParams.set('status', nextFilters.status);
            searchParams.set('take', nextFilters.take);

            const response = await fetch(`/api/admin/file-uploads?${searchParams.toString()}`, {
                cache: 'no-store',
            });
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.error || 'Unable to load automatic file uploads.');
            }

            setUploads(Array.isArray(data) ? data : []);
        } catch (error) {
            setUploadsError(error.message || 'Unable to load automatic file uploads.');
        } finally {
            setUploadsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPolicy();
        loadUploads(INITIAL_FILTERS);
    }, [loadPolicy, loadUploads]);

    const stats = useMemo(() => {
        let completed = 0;
        let uploading = 0;
        let attention = 0;
        let totalBytes = 0;

        for (const upload of uploads) {
            const status = String(upload.status || '').toLowerCase();
            totalBytes += Number(upload.sizeBytes || 0);

            if (status === 'completed') completed += 1;
            if (status === 'uploading') uploading += 1;
            if (status === 'failed' || status === 'aborted' || upload.errorMessage) attention += 1;
        }

        return { completed, uploading, attention, totalBytes };
    }, [uploads]);

    const policyUnavailable = policyLoading || policySaving || !savedPolicy;

    const handleAddExtensions = () => {
        const candidates = splitExtensions(extensionInput);
        if (candidates.length === 0) return;

        const invalid = candidates.find((extension) => extension.length > 32);
        if (invalid) {
            toast.error(`${invalid} is longer than 32 characters.`);
            return;
        }

        const nextExtensions = normalizeExtensions([...extensions, ...candidates]);
        if (nextExtensions.length > 500) {
            toast.error('A maximum of 500 file extensions is allowed.');
            return;
        }

        setExtensions(nextExtensions);
        setExtensionInput('');
    };

    const handleExtensionKeyDown = (event) => {
        if (event.key !== 'Enter' && event.key !== ',') return;
        event.preventDefault();
        handleAddExtensions();
    };

    const handleRemoveExtension = (extension) => {
        setExtensions((current) => current.filter((item) => item !== extension));
    };

    const handleSavePolicy = async (event) => {
        event.preventDefault();

        const pendingExtensions = splitExtensions(extensionInput);
        const nextExtensions = normalizeExtensions([...extensions, ...pendingExtensions]);
        const maximumBytes = Number(maxFileSizeBytes);

        if (!Number.isSafeInteger(maximumBytes) || maximumBytes <= 0) {
            toast.error('Maximum file size must be a positive whole number of bytes.');
            return;
        }
        if (nextExtensions.length === 0) {
            toast.error('At least one file extension is required.');
            return;
        }
        if (nextExtensions.length > 500) {
            toast.error('A maximum of 500 file extensions is allowed.');
            return;
        }
        if (nextExtensions.some((extension) => extension.length > 32)) {
            toast.error('A file extension cannot be longer than 32 characters.');
            return;
        }

        try {
            setPolicySaving(true);
            setPolicyError('');
            const response = await fetch('/api/admin/file-upload-policy', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isEnabled,
                    maxFileSizeBytes: maximumBytes,
                    extensions: nextExtensions,
                }),
            });
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.error || 'Unable to save the file upload policy.');
            }

            applyPolicy(data || {});
            toast.success('Global file upload policy updated.');
        } catch (error) {
            const message = error.message || 'Unable to save the file upload policy.';
            setPolicyError(message);
            toast.error(message);
        } finally {
            setPolicySaving(false);
        }
    };

    const handleFilterSubmit = (event) => {
        event.preventDefault();
        loadUploads(filters);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)] xl:items-start">
                <aside className="space-y-4 xl:sticky xl:top-6">
                    <form onSubmit={handleSavePolicy} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Global Policy</p>
                                <h2 className="text-xl font-bold tracking-tight text-foreground">Automatic uploads</h2>
                                <p className="text-xs leading-relaxed text-muted-foreground">Applies to every managed laptop agent.</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={isEnabled}
                                aria-label="Enable automatic file uploads"
                                onClick={() => setIsEnabled((current) => !current)}
                                disabled={policyUnavailable}
                                className={`relative mt-1 h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${isEnabled ? 'border-foreground bg-foreground' : 'border-border bg-muted'}`}
                            >
                                <span className={`absolute top-0.5 h-5 w-5 rounded-full border border-border bg-white shadow-sm transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>

                        <div className={`mt-5 rounded-xl border p-3 ${isEnabled ? 'border-green-500/20 bg-green-500/10' : 'border-amber-500/20 bg-amber-500/10'}`}>
                            <div className="flex items-start gap-2.5">
                                {isEnabled ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                                <div>
                                    <p className={`text-xs font-bold ${isEnabled ? 'text-green-600' : 'text-amber-600'}`}>
                                        {isEnabled ? 'New uploads are allowed' : 'New uploads will be paused'}
                                    </p>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                                        Existing multipart uploads are not stopped by this setting.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {policyError ? (
                            <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive" role="alert">
                                {policyError}
                            </div>
                        ) : null}

                        <div className="mt-6 space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="maxFileSizeBytes" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Maximum File Size</label>
                                <div className="relative">
                                    <input
                                        id="maxFileSizeBytes"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={maxFileSizeBytes}
                                        onChange={(event) => setMaxFileSizeBytes(event.target.value)}
                                        disabled={policyUnavailable}
                                        className="h-11 w-full rounded-xl border border-input bg-background px-4 pr-16 font-mono text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                                        required
                                    />
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bytes</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">{formatBytes(maxFileSizeBytes)} per file</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <label htmlFor="extensionInput" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Allowed Extensions</label>
                                    <span className="font-mono text-[10px] text-muted-foreground">{extensions.length}/500</span>
                                </div>
                                <div className="rounded-xl border border-input bg-background p-3">
                                    <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto">
                                        {extensions.map((extension) => (
                                            <span key={extension} className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-muted px-2.5 font-mono text-[11px] font-bold text-foreground">
                                                {extension}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExtension(extension)}
                                                    disabled={policyUnavailable}
                                                    className="rounded text-muted-foreground transition hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    aria-label={`Remove ${extension}`}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                                        <input
                                            id="extensionInput"
                                            value={extensionInput}
                                            onChange={(event) => setExtensionInput(event.target.value)}
                                            onKeyDown={handleExtensionKeyDown}
                                            placeholder="Add .ext"
                                            disabled={policyUnavailable}
                                            className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1 font-mono text-xs text-foreground focus-visible:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddExtensions}
                                            disabled={!extensionInput.trim() || policyUnavailable}
                                            className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-[11px] font-bold text-foreground transition hover:bg-muted disabled:opacity-40"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Add
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[11px] leading-relaxed text-muted-foreground">Press Enter or comma to add. Values are normalized to lowercase with one leading period.</p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4 border-t border-border pt-5">
                            <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Updated {formatDateTime(savedPolicy?.updatedAtUtc)}</span>
                                <button
                                    type="button"
                                    onClick={loadPolicy}
                                    disabled={policyLoading || policySaving}
                                    className="inline-flex items-center gap-1.5 font-bold transition hover:text-foreground disabled:opacity-50"
                                >
                                    <RotateCcw className={`h-3.5 w-3.5 ${policyLoading ? 'animate-spin' : ''}`} />Reload
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={policyUnavailable}
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-bold text-background shadow-sm transition hover:opacity-90 disabled:opacity-50"
                            >
                                {policySaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {policySaving ? 'Saving global policy...' : 'Save Global Policy'}
                            </button>
                        </div>
                    </form>

                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                                <strong className="mb-1 block text-amber-600">Global configuration</strong>
                                Saving replaces all configurable policy values for every agent. Concurrent changes use last-write-wins behavior.
                            </p>
                        </div>
                    </div>
                </aside>

                <div className="min-w-0 space-y-6">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <MetricCard icon={CloudUpload} label="Records Loaded" value={uploads.length} />
                        <MetricCard icon={CheckCircle2} label="Completed" value={stats.completed} accent="text-green-600" />
                        <MetricCard icon={RefreshCw} label="Uploading" value={stats.uploading} accent="text-amber-600" spin={uploadsLoading} />
                        <MetricCard icon={AlertTriangle} label="Needs Attention" value={stats.attention} accent="text-red-600" />
                    </div>

                    <form onSubmit={handleFilterSubmit} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Automatic Upload Ledger</p>
                                <h2 className="text-xl font-bold tracking-tight text-foreground">Latest upload activity</h2>
                                <p className="text-xs text-muted-foreground">{formatBytes(stats.totalBytes)} across the records currently loaded.</p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        aria-label="Device code"
                                        value={filters.deviceCode}
                                        onChange={(event) => setFilters((current) => ({ ...current, deviceCode: event.target.value }))}
                                        placeholder="Device code"
                                        className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-44"
                                    />
                                </div>
                                <select
                                    aria-label="Upload status"
                                    value={filters.status}
                                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                                    className="h-10 rounded-full border border-input bg-background px-4 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="">All statuses</option>
                                    <option value="uploading">Uploading</option>
                                    <option value="completed">Completed</option>
                                    <option value="failed">Failed</option>
                                    <option value="aborted">Aborted</option>
                                </select>
                                <select
                                    aria-label="Maximum records"
                                    value={filters.take}
                                    onChange={(event) => setFilters((current) => ({ ...current, take: event.target.value }))}
                                    className="h-10 rounded-full border border-input bg-background px-4 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    {[50, 100, 200, 500, 1000].map((value) => <option key={value} value={value}>Latest {value}</option>)}
                                </select>
                                <button
                                    type="submit"
                                    disabled={uploadsLoading}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-xs font-bold text-foreground transition hover:bg-muted disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${uploadsLoading ? 'animate-spin' : ''}`} />Refresh
                                </button>
                            </div>
                        </div>
                    </form>

                    {uploadsError ? (
                        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive" role="alert">
                            {uploadsError}
                        </div>
                    ) : null}

                    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1020px] text-left text-sm">
                                <caption className="sr-only">Automatic file uploads ordered by the latest update time.</caption>
                                <thead className="border-b border-border bg-muted/30 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">File</th>
                                        <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Device</th>
                                        <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Size</th>
                                        <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Status</th>
                                        <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Lifecycle</th>
                                        <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Diagnostics</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {uploadsLoading && uploads.length === 0 ? (
                                        <tr><td colSpan="6" className="px-6 py-16 text-center text-sm text-muted-foreground">Loading automatic uploads...</td></tr>
                                    ) : uploads.length === 0 ? (
                                        <tr><td colSpan="6" className="px-6 py-16 text-center text-sm text-muted-foreground">No automatic file uploads matched these filters.</td></tr>
                                    ) : (
                                        uploads.map((upload) => (
                                            <UploadRow key={upload.id} upload={upload} />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, accent = 'text-foreground', spin = false }) {
    return (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                <Icon className={`h-4 w-4 text-muted-foreground ${spin ? 'animate-spin' : ''}`} />
            </div>
            <p className={`mt-3 text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
        </div>
    );
}

function UploadRow({ upload }) {
    const status = String(upload.status || 'unknown').toLowerCase();
    const hasError = Boolean(upload.errorMessage);

    return (
        <tr className="transition-colors hover:bg-muted/20">
            <td className="px-6 py-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="max-w-64 truncate font-semibold text-foreground" title={upload.fileName}>{upload.fileName || '-'}</p>
                        <p className="mt-1 max-w-72 truncate font-mono text-[10px] text-muted-foreground" title={upload.fullPath}>{upload.fullPath || '-'}</p>
                        <p className="mt-1 font-mono text-[10px] font-bold text-muted-foreground">{upload.extension || '-'}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5 font-mono text-xs font-bold text-foreground">{upload.deviceCode || '-'}</td>
            <td className="px-6 py-5 font-mono text-xs text-muted-foreground">{formatBytes(upload.sizeBytes)}</td>
            <td className="px-6 py-5"><StatusBadge status={status} /></td>
            <td className="px-6 py-5">
                <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
                    <p>Modified: {formatDateTime(upload.lastModifiedAtUtc)}</p>
                    <p>Updated: {formatDateTime(upload.updatedAtUtc)}</p>
                    <p className={status === 'completed' ? 'font-bold text-green-600' : ''}>Completed: {formatDateTime(upload.completedAtUtc)}</p>
                </div>
            </td>
            <td className="max-w-72 px-6 py-5">
                {hasError ? (
                    <p className="flex items-start gap-1.5 text-xs font-medium leading-relaxed text-red-600"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{upload.errorMessage}</p>
                ) : (
                    <p className="text-xs text-muted-foreground">No reported error.</p>
                )}
            </td>
        </tr>
    );
}

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[status] || 'border-border bg-muted text-muted-foreground'}`}>
            {status === 'uploading' ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            {status}
        </span>
    );
}

function splitExtensions(value) {
    return String(value || '')
        .split(/[\s,;]+/)
        .map(normalizeExtension)
        .filter(Boolean);
}

function normalizeExtensions(values) {
    return [...new Set((Array.isArray(values) ? values : []).map(normalizeExtension).filter(Boolean))].sort();
}

function normalizeExtension(value) {
    const extension = String(value || '').trim().replace(/^\.+/, '').toLowerCase();
    return extension ? `.${extension}` : '';
}

function formatBytes(value) {
    const bytes = Number(value || 0);
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const size = bytes / (1024 ** index);

    return `${size.toFixed(size >= 10 || index === 0 ? 0 : 2)} ${units[index]}`;
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
