'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SystemReportDetailClient({ tagNumber }) {
    const router = useRouter();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                setError('');
                const res = await fetch(`/api/system-reports/${tagNumber}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error('System report not found.');
                    throw new Error('Unable to load this system report right now.');
                }
                const data = await res.json();
                setReport(data);
            } catch (fetchError) {
                console.error(fetchError);
                setError(fetchError.message || 'Unable to load this system report right now.');
            } finally {
                setLoading(false);
            }
        };

        if (tagNumber) {
            fetchReport();
        }
    }, [tagNumber]);

    const handleExport = () => {
        if (!report) return;

        const lines = [];
        lines.push(['Category', 'Field', 'Value']);
        lines.push(['General', 'Tag Number', report.tagNumber || '']);
        lines.push(['General', 'User Name', report.userName || '']);
        lines.push(['General', 'Report Date', report.reportDate || '']);
        lines.push(['General', 'Created At', formatDateTime(report.createdAt)]);
        lines.push(['System', 'System Name', report.systemName || '']);
        lines.push(['System', 'Manufacturer', report.manufacturer || '']);
        lines.push(['System', 'Model', report.model || '']);
        lines.push(['System', 'Serial Number', report.serialNumber || '']);
        lines.push(['System', 'Processor', report.processor || '']);
        lines.push(['System', 'Total RAM (GB)', report.totalRamGB || '']);
        lines.push(['OS', 'Windows Edition', report.windowsEdition || '']);
        lines.push(['OS', 'Windows Version', report.windowsVersion || '']);
        lines.push(['OS', 'Build Number', report.buildNumber || '']);

        const generateArrayLines = (category, items) => {
            if (!items || !Array.isArray(items) || items.length === 0) return;

            items.forEach((entry, index) => {
                Object.entries(entry).forEach(([key, value]) => {
                    lines.push([category, `${key} [${index + 1}]`, value !== null ? String(value) : '']);
                });
            });
        };

        generateArrayLines('RAM Details', report.ramDetails);
        generateArrayLines('GPU Details', report.gpuDetails);
        generateArrayLines('Storage Details', report.diskDetails);

        const csvContent = `data:text/csv;charset=utf-8,${lines.map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `system-report-${report.tagNumber}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="rounded-[2rem] border border-border bg-card px-10 py-12 shadow-sm">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
                    <p className="mt-4 text-sm font-medium text-muted-foreground">Loading system report...</p>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="rounded-[2rem] border border-border bg-card p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/40">
                    <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Report Status</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Error Loading Report</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{error || 'Report not found.'}</p>
                <button
                    onClick={() => router.push('/dashboard/system-reports')}
                    className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-bold text-background transition hover:opacity-90"
                >
                    Back to System Reports
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-8 py-8 shadow-sm">
                <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-foreground/[0.04] to-transparent" />
                <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-foreground/[0.05] blur-3xl" />

                <div className="relative space-y-6">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        <Link href="/dashboard/system-reports" className="transition-colors hover:text-foreground">System Reports</Link>
                        <span>/</span>
                        <span className="font-mono text-foreground">{report.tagNumber}</span>
                    </div>

                    <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl space-y-4">
                            <div className="flex flex-wrap gap-3">
                                <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-blue-500">
                                    System Sync
                                </span>
                                <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                                    {report.manufacturer || 'Unknown Manufacturer'}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <h1 className="flex flex-wrap items-center gap-3 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                                    <span className="font-mono">{report.tagNumber}</span>
                                </h1>
                                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                                    A synced system snapshot for {report.userName || 'this device'}, capturing hardware, operating system, and component-level metadata.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <HeroChip label="User" value={report.userName || 'Unlinked'} />
                                <HeroChip label="Model" value={`${report.manufacturer || 'Unknown'} ${report.model || ''}`.trim()} />
                                <HeroChip label="Synced" value={formatDateTime(report.reportDate || report.createdAt)} />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href="/dashboard/system-reports"
                                className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-bold text-foreground transition hover:bg-muted/50"
                            >
                                Back to Reports
                            </Link>
                            <button
                                onClick={handleExport}
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
                <MetricCard label="System Name" value={report.systemName || '-'} accent="text-foreground" compact />
                <MetricCard label="Serial Number" value={report.serialNumber || '-'} accent="text-blue-500" compact />
                <MetricCard label="Processor" value={report.processor || '-'} accent="text-amber-500" compact />
                <MetricCard label="Total RAM" value={report.totalRamGB ? `${report.totalRamGB} GB` : '-'} accent="text-green-600" compact />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <InfoCard title="General Summary" subtitle="Owner, sync time, and primary machine identity.">
                    <div className="space-y-4">
                        <DetailRow label="User Name" value={report.userName} />
                        <DetailRow label="Report Date" value={report.reportDate || '-'} />
                        <DetailRow label="First Synced" value={formatDateTime(report.createdAt)} />
                        <DetailRow label="System Name" value={report.systemName} />
                        <DetailRow label="Manufacturer" value={report.manufacturer} />
                        <DetailRow label="Model" value={report.model} />
                    </div>
                </InfoCard>

                <InfoCard title="Operating System" subtitle="Edition, version, and build alignment for this device.">
                    <div className="space-y-4">
                        <DetailRow label="Windows Edition" value={report.windowsEdition} />
                        <DetailRow label="Windows Version" value={report.windowsVersion} />
                        <DetailRow label="Build Number" value={report.buildNumber} />
                        <DetailRow label="License Status" value={report.licenseStatus} />
                        <DetailRow label="Office License" value={report.officeLicense} />
                    </div>
                </InfoCard>

                <InfoCard title="Hardware Health" subtitle="Quick-access indicators for battery and platform status.">
                    <div className="space-y-4">
                        <DetailRow label="Battery Health" value={report.batteryHealth} />
                        <DetailRow label="Battery Rating" value={report.batteryRating} />
                        <DetailRow label="Processor" value={report.processor} />
                        <DetailRow label="Total RAM (GB)" value={report.totalRamGB} />
                        <DetailRow label="Serial Number" value={report.serialNumber} isMono />
                    </div>
                </InfoCard>
            </div>

            <div className="grid gap-8">
                <DeviceArraySection title="RAM Component Details" eyebrow="Component telemetry" items={report.ramDetails} icon="Hardware" />
                <DeviceArraySection title="GPU / Graphics Details" eyebrow="Graphics telemetry" items={report.gpuDetails} icon="Display" />
                <DeviceArraySection title="Storage & Drives" eyebrow="Disk telemetry" items={report.diskDetails} icon="Storage" />
            </div>
        </div>
    );
}

function HeroChip({ label, value }) {
    return (
        <div className="rounded-2xl border border-border bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-bold text-foreground">{value || '-'}</p>
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

function InfoCard({ title, subtitle, children }) {
    return (
        <div className="group relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-foreground/5 to-transparent transition-transform duration-700 group-hover:scale-125" />
            <div className="relative space-y-6">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
                </div>
                {children}
            </div>
        </div>
    );
}

function DetailRow({ label, value, isMono = false }) {
    if (!value && value !== 0) return null;

    return (
        <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
            <span className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground">{label}</span>
            <span className={`text-right text-[13px] font-medium tracking-tight text-foreground ${isMono ? 'font-mono' : ''}`}>
                {value || '-'}
            </span>
        </div>
    );
}

function DeviceArraySection({ title, eyebrow, icon, items }) {
    if (!items || !Array.isArray(items) || items.length === 0) return null;

    const keys = Object.keys(items[0] || {});
    if (keys.length === 0) return null;

    let iconPath;
    if (icon === 'Storage') {
        iconPath = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />;
    } else if (icon === 'Display') {
        iconPath = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
    } else {
        iconPath = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />;
    }

    return (
        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <div className="space-y-5">
                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
                    <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            {iconPath}
                        </svg>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-widest">
                                <tr>
                                    {keys.map((key) => (
                                        <th key={key} className="px-4 py-3 font-bold text-muted-foreground">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {items.map((item, index) => (
                                    <tr key={index} className="transition-colors hover:bg-muted/20">
                                        {keys.map((key) => (
                                            <td key={key} className="px-4 py-3 text-foreground">
                                                {item[key] !== null && item[key] !== undefined ? String(item[key]) : '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
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
