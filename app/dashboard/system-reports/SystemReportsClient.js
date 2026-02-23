'use client';

import { useState, useEffect, useMemo } from 'react';

export default function SystemReportsClient({ user }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);

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

    const handleView = (report) => {
        setSelectedReport(report);
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

            // If the deleted report was open in modal, close it
            if (selectedReport?.tagNumber === tagNumber) {
                setSelectedReport(null);
            }
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
                                                <button
                                                    onClick={() => handleView(report)}
                                                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md"
                                                >
                                                    View Details
                                                </button>
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

            {/* Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col my-auto relative overflow-hidden">
                        <div className="p-6 border-b border-border bg-muted/10 sticky top-0 flex justify-between items-start z-10">
                            <div>
                                <h2 className="text-xl font-bold font-mono tracking-tight">{selectedReport.tagNumber}</h2>
                                <p className="text-sm text-muted-foreground mt-1">System Report Details</p>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-8">
                            {/* General Information */}
                            <section>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-2">General Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    <DetailItem label="User Name" value={selectedReport.userName} />
                                    <DetailItem label="Report Date" value={selectedReport.reportDate} />
                                    <DetailItem label="Created At" value={new Date(selectedReport.createdAt).toLocaleString()} />
                                    <DetailItem label="System Name" value={selectedReport.systemName} />
                                    <DetailItem label="Manufacturer" value={selectedReport.manufacturer} />
                                    <DetailItem label="Model" value={selectedReport.model} />
                                    <DetailItem label="Serial Number" value={selectedReport.serialNumber} />
                                    <DetailItem label="Processor" value={selectedReport.processor} />
                                    <DetailItem label="Total RAM (GB)" value={selectedReport.totalRamGB} />
                                </div>
                            </section>

                            {/* Windows Information */}
                            <section>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-2">Operating System</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    <DetailItem label="Windows Edition" value={selectedReport.windowsEdition} />
                                    <DetailItem label="Windows Version" value={selectedReport.windowsVersion} />
                                    <DetailItem label="Build Number" value={selectedReport.buildNumber} />
                                </div>
                            </section>

                            {/* Hardware Details rendering */}
                            <DeviceArraySection title="RAM Details" items={selectedReport.ramDetails} />
                            <DeviceArraySection title="GPU Details" items={selectedReport.gpuDetails} />
                            <DeviceArraySection title="Storage Details" items={selectedReport.diskDetails} />

                        </div>
                        <div className="p-4 border-t border-border bg-muted/10 sticky bottom-0 text-right">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="px-4 py-2 bg-foreground text-background font-medium rounded-md hover:opacity-90 transition-opacity"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper components for Modal
function DetailItem({ label, value }) {
    if (!value && value !== 0) return null;
    return (
        <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">{label}</div>
            <div className="text-sm font-medium text-foreground">{value}</div>
        </div>
    );
}

function DeviceArraySection({ title, items }) {
    if (!items || !Array.isArray(items) || items.length === 0) return null;

    // Auto-detect keys from the first item
    const keys = Object.keys(items[0] || {});
    if (keys.length === 0) return null;

    return (
        <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-2">{title}</h3>
            <div className="bg-muted/10 border border-border rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/30 text-xs text-muted-foreground uppercase">
                        <tr>
                            {keys.map((k) => <th key={k} className="px-4 py-2 font-medium">{k.replace(/([A-Z])/g, ' $1').trim()}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                                {keys.map((k) => (
                                    <td key={k} className="px-4 py-3 text-foreground whitespace-nowrap">{item[k] !== null && item[k] !== undefined ? String(item[k]) : '-'}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
