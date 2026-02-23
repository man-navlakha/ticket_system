'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function SystemReportsClient({ user }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/system-reports');
            if (!res.ok) throw new Error('Failed to fetch reports');
            const data = await res.json();
            setReports(data || []);
        } catch (error) {
            console.error('Error fetching system reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = useMemo(() => {
        if (!searchTerm) return reports;
        const term = searchTerm.toLowerCase();
        return reports.filter(r =>
            (r.tagNumber || '').toLowerCase().includes(term) ||
            (r.userName || '').toLowerCase().includes(term) ||
            (r.manufacturer || '').toLowerCase().includes(term) ||
            (r.model || '').toLowerCase().includes(term) ||
            (r.serialNumber || '').toLowerCase().includes(term)
        );
    }, [reports, searchTerm]);

    const handleExportAll = () => {
        if (!filteredReports.length) return alert('No reports to export');

        const headers = ["Tag Number", "User Name", "Report Date", "System Name", "Make", "Model", "Serial Number", "Processor", "Total RAM (GB)", "Windows Edition", "Windows Version"];
        const rows = filteredReports.map(r => [
            r.tagNumber || '',
            r.userName || '',
            r.reportDate || '',
            r.systemName || '',
            r.manufacturer || '',
            r.model || '',
            r.serialNumber || '',
            r.processor || '',
            r.totalRamGB || '',
            r.windowsEdition || '',
            r.windowsVersion || ''
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "system-reports.csv");
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

            // Remove from state
            setReports(prev => prev.filter(r => r.tagNumber !== tagNumber));

        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Failed to delete report');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">System Reports</h1>
                    <p className="text-muted-foreground mt-1">
                        View synced hardware specifications from devices.
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by Tag Number, User, Make, Model, SN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                </div>
                <button
                    onClick={fetchReports}
                    className="px-4 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-md transition-colors text-sm font-medium flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
                <button
                    onClick={handleExportAll}
                    className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors text-sm font-medium flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                </button>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground bg-muted/30 uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">Tag Number</th>
                                <th className="px-4 py-3 font-medium">User Name</th>
                                <th className="px-4 py-3 font-medium">Make & Model</th>
                                <th className="px-4 py-3 font-medium">Serial Number</th>
                                <th className="px-4 py-3 font-medium">Last Sync</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">
                                        Loading reports...
                                    </td>
                                </tr>
                            ) : filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">
                                        {searchTerm ? 'No reports matched your search.' : 'No system reports found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                            {report.tagNumber}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {report.userName || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-foreground font-medium">{report.manufacturer || 'Unknown Make'}</div>
                                            <div className="text-xs text-muted-foreground">{report.model || 'Unknown Model'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                            {report.serialNumber || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                                            {report.reportDate || new Date(report.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/dashboard/system-reports/${report.tagNumber}`}
                                                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md text-center"
                                                >
                                                    View Details
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(report.tagNumber)}
                                                    className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md"
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
        </div>
    );
}
