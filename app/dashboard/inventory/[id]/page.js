import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import InventoryActions from "@/components/InventoryActions";

export const dynamic = 'force-dynamic';

export default async function InventoryItemPage({ params }) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    const item = await prisma.inventoryItem.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, username: true, email: true } },
            tickets: {
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                    createdAt: true,
                    componentName: true,
                    resolutionDetails: true
                }
            },
            maintenanceRecords: {
                orderBy: { startDate: 'desc' }
            }
        }
    });

    if (!item) notFound();

    // Basic access control
    if (user.role === 'USER' && item.userId !== user.id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-2xl font-bold text-red-500">Unauthorized Access</h2>
                <p className="text-gray-400 mt-2">You do not have permission to view this item.</p>
                <Link href="/dashboard/inventory" className="mt-4 text-blue-400 hover:underline">Return to Inventory</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen rounded-xl bg-[#0B0E14] text-white p-6 md:p-12 font-sans">
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="space-y-6">
                    <Link
                        href="/dashboard/inventory"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <span>←</span> Back to Inventory
                    </Link>

                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-white/5 pb-8">
                        <div>
                            <div className="flex flex-wrap items-baseline gap-3 mb-2">
                                <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-2">{item.pid}</h1>
                                <span className={`self-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${item.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                    item.status === 'MAINTENANCE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                        item.status === 'RETIRED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                    }`}>
                                    {item.status || 'UNKNOWN'}
                                </span>
                            </div>
                            <p className="text-gray-400 text-lg">
                                {item.brand || 'Unknown Brand'} <span className="text-gray-600 mx-2">|</span> {item.model}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <span className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {item.ownership}
                            </span>
                            {(user.role === 'ADMIN' || user.role === 'AGENT') && (
                                <Link
                                    href={`/dashboard/inventory/${item.id}/edit`}
                                    className="px-6 py-2 bg-white/5 text-white rounded-lg text-sm font-bold hover:bg-white/10 border border-white/10 transition-colors"
                                >
                                    Edit Details
                                </Link>
                            )}
                            <InventoryActions item={item} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Assignment Details Card */}
                    <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl p-8 shadow-sm transition-all">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Assignment Details</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-500 text-sm">Assigned To</span>
                                <span className="font-medium text-white text-right">
                                    {item.user ? (
                                        <div className="flex items-center gap-2 justify-end">
                                            <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                                                {item.user.username?.[0]?.toUpperCase()}
                                            </div>
                                            {item.user.username}
                                        </div>
                                    ) : (item.assignedUser || 'Unassigned')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-500 text-sm">Assigned Date</span>
                                <span className="text-white">{item.assignedDate ? new Date(item.assignedDate).toLocaleDateString() : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-500 text-sm">Return Date</span>
                                <span className="text-white">{item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-500 text-sm">Previous User</span>
                                <span className="text-white">{item.oldUser || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Asset Details Card */}
                    <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl p-8 shadow-sm transition-all">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Asset Details</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-500 text-sm">Serial Number</span>
                                <span className="font-mono text-white tracking-wider">{item.serialNumber || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-500 text-sm">Purchased Date</span>
                                <span className="text-white">{item.purchasedDate ? new Date(item.purchasedDate).toLocaleDateString() : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-500 text-sm">Price</span>
                                <span className="font-mono text-green-400">{item.price ? `$${item.price.toFixed(2)}` : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-500 text-sm">Warranty Expiry</span>
                                <span className="text-white">{item.warrantyDate ? new Date(item.warrantyDate).toLocaleDateString() : '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Specs & Components */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {item.systemSpecs && typeof item.systemSpecs === 'object' && Object.keys(item.systemSpecs).length > 0 && (
                        <div className="md:col-span-2 bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl p-8 shadow-sm transition-all h-full">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">System Specifications</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {Object.entries(item.systemSpecs).map(([key, value]) => (
                                    <div key={key} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 opacity-70">{key}</div>
                                        <div className="text-white font-mono text-sm break-all">
                                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {item.components && item.components.length > 0 && (
                        <div className="md:col-span-1 bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl p-8 shadow-sm transition-all h-full">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Components</h3>
                            <div className="flex flex-wrap gap-2 content-start">
                                {item.components.map((comp, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-white/5 rounded-lg text-sm text-gray-300 border border-white/10 font-medium">
                                        {comp}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Repair History */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <h2 className="text-2xl font-light text-white">Repair History</h2>
                        <Link href={`/dashboard/create?inventoryId=${item.id}`} className="text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors">
                            + Report Issue
                        </Link>
                    </div>

                    <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl overflow-hidden shadow-sm transition-all">
                        {item.tickets.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-3 opacity-20">🔧</div>
                                <p className="text-gray-500">No repair history available.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-white/5 text-gray-300 uppercase font-bold text-xs tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Date</th>
                                            <th className="px-6 py-4 font-bold">Issue</th>
                                            <th className="px-6 py-4 font-bold">Component</th>
                                            <th className="px-6 py-4 font-bold">Status</th>
                                            <th className="px-6 py-4 font-bold text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {item.tickets.map((ticket) => (
                                            <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4 font-mono text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-white font-medium group-hover:text-amber-400 transition-colors">{ticket.title}</td>
                                                <td className="px-6 py-4">{ticket.componentName || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border 
                                                        ${ticket.status === 'OPEN' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            ticket.status === 'RESOLVED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                                        {ticket.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href={`/dashboard/${ticket.id}`} className="text-gray-500 hover:text-white font-medium text-xs uppercase tracking-wider">
                                                        View Details →
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Maintenance Logs */}
                <div className="space-y-6 pb-12">
                    <div className="border-b border-white/5 pb-4">
                        <h2 className="text-2xl font-light text-white">Maintenance Logs</h2>
                    </div>
                    <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl overflow-hidden shadow-sm transition-all">
                        {item.maintenanceRecords.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-3 opacity-20">📋</div>
                                <p className="text-gray-500">No maintenance records found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-white/5 text-gray-300 uppercase font-bold text-xs tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Start Date</th>
                                            <th className="px-6 py-4 font-bold">End Date</th>
                                            <th className="px-6 py-4 font-bold">Description</th>
                                            <th className="px-6 py-4 font-bold">Technician</th>
                                            <th className="px-6 py-4 font-bold text-right">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {item.maintenanceRecords.map((record) => (
                                            <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4 font-mono text-gray-500">{new Date(record.startDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    {record.endDate ? (
                                                        <span className="font-mono text-gray-500">{new Date(record.endDate).toLocaleDateString()}</span>
                                                    ) : (
                                                        <span className="text-amber-400 font-bold text-[10px] uppercase tracking-wider bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20">Ongoing</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-white">{record.description || '-'}</td>
                                                <td className="px-6 py-4">{record.technician || '-'}</td>
                                                <td className="px-6 py-4 text-right font-mono text-green-400 bg-green-400/5">
                                                    {record.cost ? `$${record.cost.toFixed(2)}` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
