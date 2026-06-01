'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function SystemReportsClient({ user }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await fetch('/api/system-reports');
            if (!res.ok) throw new Error('Unable to load system reports right now.');
            const data = await res.json();
            setReports(data || []);
        } catch (fetchError) {
            console.error('Error fetching system reports:', fetchError);
            setError(fetchError.message || 'Unable to load system reports right now.');
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = useMemo(() => {
        if (!searchTerm) return reports;

        const term = searchTerm.toLowerCase();
        return reports.filter((report) =>
            (report.tagNumber || '').toLowerCase().includes(term) ||
            (report.userName || '').toLowerCase().includes(term) ||
            (report.manufacturer || '').toLowerCase().includes(term) ||
            (report.model || '').toLowerCase().includes(term) ||
            (report.serialNumber || '').toLowerCase().includes(term)
        );
    }, [reports, searchTerm]);

    const uniqueManufacturers = useMemo(() => new Set(reports.map((report) => report.manufacturer).filter(Boolean)).size, [reports]);
    const linkedUsers = useMemo(() => reports.filter((report) => report.userName).length, [reports]);
    const latestSync = useMemo(() => {
        if (!reports.length) return '-';
        const latest = reports.reduce((current, report) => {
            const currentDate = new Date(current.createdAt || current.updatedAt || 0).getTime();
            const nextDate = new Date(report.createdAt || report.updatedAt || 0).getTime();
            return nextDate > currentDate ? report : current;
        }, reports[0]);

        return formatDateTime(latest.reportDate || latest.createdAt || latest.updatedAt);
    }, [reports]);

    const handleExportAll = () => {
        if (!filteredReports.length) {
            alert('No reports available to export.');
            return;
        }

        const headers = ['Tag Number', 'User Name', 'Report Date', 'System Name', 'Make', 'Model', 'Serial Number', 'Processor', 'Total RAM (GB)', 'Windows Edition', 'Windows Version'];
        const rows = filteredReports.map((report) => [
            report.tagNumber || '',
            report.userName || '',
            report.reportDate || '',
            report.systemName || '',
            report.manufacturer || '',
            report.model || '',
            report.serialNumber || '',
            report.processor || '',
            report.totalRamGB || '',
            report.windowsEdition || '',
            report.windowsVersion || '',
        ]);

        const csvContent = `data:text/csv;charset=utf-8,${headers.join(',')}\n${rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'system-reports.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = async (tagNumber) => {
        if (!confirm(`Are you sure you want to delete the system report for ${tagNumber}?`)) return;

        try {
            const res = await fetch(`/api/system-reports/${tagNumber}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete report');
            setReports((prev) => prev.filter((report) => report.tagNumber !== tagNumber));
        } catch (deleteError) {
            console.error('Error deleting report:', deleteError);
            alert('Failed to delete report');
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-8 py-8 shadow-sm">
                <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-foreground/[0.04] to-transparent" />
                <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-foreground/[0.05] blur-3xl" />

                <div className="relative space-y-6">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        <Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link>
                        <span>/</span>
                        <span className="text-foreground">System Reports</span>
                    </div>

                    <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl space-y-4">
                            <div className="flex flex-wrap gap-3">
                                <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                                    Synced Device Intelligence
                                </span>
                                <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                                    {user.role}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">System Reports</h1>
                                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                                    Review synced hardware snapshots, exported diagnostics, and machine inventory context from one aligned command view.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={fetchReports}
                                className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-bold text-foreground transition hover:bg-muted/50"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </button>
                            <button
                                onClick={handleExportAll}
                                className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background shadow-lg transition hover:opacity-90"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Report Count" value={`${reports.length}`} accent="text-foreground" />
                <MetricCard label="Linked Users" value={`${linkedUsers}`} accent="text-blue-500" />
                <MetricCard label="Manufacturers" value={`${uniqueManufacturers}`} accent="text-amber-500" />
                <MetricCard label="Latest Sync" value={latestSync} accent="text-green-600" compact />
            </div>

            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Registry Controls</p>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Search the synced fleet</h2>
                        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                            Filter by asset tag, owner, manufacturer, model, or serial number to jump directly into a report.
                        </p>
                    </div>

                    <div className="relative w-full lg:max-w-xl">
                        <svg
                            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by tag, user, make, model, or serial number"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-12 w-full rounded-full border border-input bg-background pl-11 pr-4 text-sm text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                </div>
            </section>

            {error && (
                <div aria-live="polite" className="rounded-[1.5rem] border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive shadow-sm">
                    {error}
                </div>
            )}

            <section className="space-y-5">
                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Device Snapshots</p>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Synced report registry</h2>
                        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                            A structured table of all system reports, aligned to the same visual style as the rest of the asset workspace.
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border bg-muted/30 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Tag Number</th>
                                    <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">User Name</th>
                                    <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Make & Model</th>
                                    <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Serial Number</th>
                                    <th className="px-6 py-4 font-bold tracking-widest text-muted-foreground">Last Sync</th>
                                    <th className="px-6 py-4 text-right font-bold tracking-widest text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center text-sm text-muted-foreground">
                                            Loading reports...
                                        </td>
                                    </tr>
                                ) : filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center text-sm text-muted-foreground">
                                            {searchTerm ? 'No reports matched the current search.' : 'No system reports have been synced yet.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports.map((report) => (
                                        <tr key={report.id} className="transition-colors hover:bg-muted/20">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-sm font-bold text-foreground">{report.tagNumber}</span>
                                                    <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                                                        {report.systemName || 'System snapshot'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-muted-foreground">
                                                {report.userName || 'Unlinked'}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground">{report.manufacturer || 'Unknown make'}</span>
                                                    <span className="text-xs text-muted-foreground">{report.model || 'Unknown model'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-mono text-xs text-muted-foreground">
                                                {report.serialNumber || '-'}
                                            </td>
                                            <td className="px-6 py-5 text-xs text-muted-foreground">
                                                {formatDateTime(report.reportDate || report.createdAt)}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/dashboard/system-reports/${report.tagNumber}`}
                                                        className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-4 text-xs font-bold text-foreground transition hover:bg-muted/50"
                                                    >
                                                        View Details
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(report.tagNumber)}
                                                        className="inline-flex h-9 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 px-4 text-xs font-bold text-red-500 transition hover:bg-red-500 hover:text-white"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}

function MetricCard({ label, value, accent, compact = false }) {
    return (
        <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
            <p className={`mt-3 font-bold tracking-tight ${compact ? 'text-lg' : 'text-2xl'} ${accent}`}>{value || '-'}</p>
        </div>
    );
}

function formatDateTime(value) {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}
