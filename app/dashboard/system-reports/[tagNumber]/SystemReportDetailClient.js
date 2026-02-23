'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SystemReportDetailClient({ user, tagNumber }) {
    const router = useRouter();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/system-reports/${tagNumber}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error('System report not found');
                    throw new Error('Failed to fetch report details');
                }
                const data = await res.json();
                setReport(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
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

        // Creating a simple two-column structured CSV for a single report
        const lines = [];

        // General Info
        lines.push(["Category", "Field", "Value"]);
        lines.push(["General", "Tag Number", report.tagNumber || '']);
        lines.push(["General", "User Name", report.userName || '']);
        lines.push(["General", "Report Date", report.reportDate || '']);
        lines.push(["General", "Created At", new Date(report.createdAt).toLocaleString()]);

        // System Summary
        lines.push(["System", "System Name", report.systemName || '']);
        lines.push(["System", "Manufacturer", report.manufacturer || '']);
        lines.push(["System", "Model", report.model || '']);
        lines.push(["System", "Serial Number", report.serialNumber || '']);
        lines.push(["System", "Processor", report.processor || '']);
        lines.push(["System", "Total RAM (GB)", report.totalRamGB || '']);

        // OS
        lines.push(["OS", "Windows Edition", report.windowsEdition || '']);
        lines.push(["OS", "Windows Version", report.windowsVersion || '']);
        lines.push(["OS", "Build Number", report.buildNumber || '']);

        // Format Arrays
        const generateArrayLines = (cat, items) => {
            if (items && Array.isArray(items) && items.length > 0) {
                items.forEach((item, index) => {
                    Object.entries(item).forEach(([key, val]) => {
                        lines.push([cat, `${key} [${index + 1}]`, val !== null ? String(val) : '']);
                    });
                });
            }
        };

        generateArrayLines("RAM Details", report.ramDetails);
        generateArrayLines("GPU Details", report.gpuDetails);
        generateArrayLines("Storage Details", report.diskDetails);

        const csvContent = "data:text/csv;charset=utf-8,"
            + lines.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `system-report-${report.tagNumber}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="p-8 text-center bg-card border border-border rounded-xl">
                <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-lg font-semibold text-foreground mb-2">Error Loading Report</h2>
                <p className="text-muted-foreground mb-6">{error || 'Report not found'}</p>
                <button
                    onClick={() => router.push('/dashboard/system-reports')}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-colors"
                >
                    Back to System Reports
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/system-reports"
                        className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold font-mono tracking-tight text-foreground flex items-center gap-3">
                            {report.tagNumber}
                            <span className="text-xs font-sans tracking-normal px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                System Sync
                            </span>
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Detailed automated system snapshot.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Content Cards */}
            <div className="grid gap-6">

                {/* General Information Card */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        General summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6 relative z-10">
                        <DetailItem label="User Name" value={report.userName} />
                        <DetailItem label="Report Date" value={report.reportDate} />
                        <DetailItem label="First Synced" value={new Date(report.createdAt).toLocaleString()} />
                        <DetailItem label="System Name" value={report.systemName} />
                        <DetailItem label="Manufacturer" value={report.manufacturer} />
                        <DetailItem label="Model" value={report.model} />
                        <DetailItem label="Serial Number" value={report.serialNumber} />
                        <DetailItem label="Processor" value={report.processor} />
                        <DetailItem label="Total RAM (GB)" value={report.totalRamGB} />
                    </div>
                </div>

                {/* Operating System Card */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Operating System
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6">
                        <DetailItem label="Windows Edition" value={report.windowsEdition} />
                        <DetailItem label="Windows Version" value={report.windowsVersion} />
                        <DetailItem label="Build Number" value={report.buildNumber} />
                    </div>
                </div>

                {/* Hardware Arrays */}
                <DeviceArraySection title="RAM Component Details" icon="Hardware" items={report.ramDetails} />
                <DeviceArraySection title="GPU / Graphics Details" icon="Display" items={report.gpuDetails} />
                <DeviceArraySection title="Storage & Drives" icon="Storage" items={report.diskDetails} />

            </div>
        </div>
    );
}

// Subcomponents

function DetailItem({ label, value }) {
    if (!value && value !== 0 && value !== '') return null;
    return (
        <div className="group">
            <div className="text-xs text-muted-foreground font-medium mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                {label}
            </div>
            <div className="text-[15px] font-medium text-foreground leading-snug break-words">
                {value || '-'}
            </div>
        </div>
    );
}

function DeviceArraySection({ title, icon, items }) {
    if (!items || !Array.isArray(items) || items.length === 0) return null;

    // Auto-detect headers from first item
    const keys = Object.keys(items[0] || {});
    if (keys.length === 0) return null;

    let IconSVG;
    if (icon === 'Storage') {
        IconSVG = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />;
    } else if (icon === 'Display') {
        IconSVG = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
    } else {
        IconSVG = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />; // Chip
    }

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {IconSVG}
                </svg>
                {title}
            </h3>

            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
                        <tr>
                            {keys.map((k) => (
                                <th key={k} className="px-4 py-3 font-medium whitespace-nowrap">
                                    {k.replace(/([A-Z])/g, ' $1').trim()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background/50">
                        {items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                {keys.map((k) => (
                                    <td key={k} className="px-4 py-3 text-foreground whitespace-nowrap">
                                        {item[k] !== null && item[k] !== undefined ? String(item[k]) : '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
