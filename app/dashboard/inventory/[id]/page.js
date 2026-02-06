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
        <div className="max-w-4xl mx-auto">
            <Link
                href="/dashboard/inventory"
                className="text-sm text-gray-400 hover:text-white mb-6 inline-block transition-colors"
            >
                ← Back to Inventory
            </Link>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            {item.pid}
                            <span className="text-lg font-normal text-gray-400">({item.type})</span>
                        </h1>
                        <p className="text-gray-400 mt-1">
                            {item.brand || 'Unknown Brand'}
                            {item.model && <span className="text-gray-500"> — {item.model}</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            item.status === 'MAINTENANCE' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                item.status === 'RETIRED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            }`}>
                            {item.status || 'UNKNOWN'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {item.ownership}
                        </span>
                        {(user.role === 'ADMIN' || user.role === 'AGENT') && (
                            <Link
                                href={`/dashboard/inventory/${item.id}/edit`}
                                className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-bold hover:bg-white/20 transition-colors"
                            >
                                Edit
                            </Link>
                        )}
                        <InventoryActions item={item} />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b border-white/10 pb-2">Assignment Details</h3>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            <span className="text-gray-500">Assigned To:</span>
                            <span className="col-span-2 text-white font-medium">
                                {item.user ? `${item.user.username} (${item.user.email})` : (item.assignedUser || 'Unassigned')}
                            </span>

                            <span className="text-gray-500">Assigned Date:</span>
                            <span className="col-span-2 text-white">{item.assignedDate ? new Date(item.assignedDate).toLocaleDateString() : '-'}</span>

                            <span className="text-gray-500">Return Date:</span>
                            <span className="col-span-2 text-white">{item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '-'}</span>

                            <span className="text-gray-500">Old User:</span>
                            <span className="col-span-2 text-white">{item.oldUser || '-'}</span>

                            <span className="text-gray-500">Old Tag:</span>
                            <span className="col-span-2 text-white">{item.oldTag || '-'}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b border-white/10 pb-2">Asset Details</h3>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            <span className="text-gray-500">Serial Number:</span>
                            <span className="col-span-2 text-white font-mono">{item.serialNumber || '-'}</span>

                            <span className="text-gray-500">Purchased:</span>
                            <span className="col-span-2 text-white">{item.purchasedDate ? new Date(item.purchasedDate).toLocaleDateString() : '-'}</span>

                            <span className="text-gray-500">Price:</span>
                            <span className="col-span-2 text-white font-mono">{item.price ? `$${item.price.toFixed(2)}` : '-'}</span>

                            <span className="text-gray-500">Maintenance:</span>
                            <span className="col-span-2 text-white">{item.maintenanceDate ? new Date(item.maintenanceDate).toLocaleDateString() : '-'}</span>

                            <span className="text-gray-500">{item.warrantyType || 'Warranty'}:</span>
                            <span className="col-span-2 text-white">{item.warrantyDate ? new Date(item.warrantyDate).toLocaleDateString() : '-'}</span>
                        </div>
                    </div>
                </div>

                {item.systemSpecs && typeof item.systemSpecs === 'object' && Object.keys(item.systemSpecs).length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <h3 className="text-lg font-semibold mb-4">System Specifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(item.systemSpecs).map(([key, value]) => (
                                <div key={key} className="flex flex-col bg-white/5 p-3 rounded-lg border border-white/5">
                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">{key}</span>
                                    <span className="text-white font-mono text-sm">
                                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {item.components && item.components.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <h3 className="text-lg font-semibold mb-4">Components & Accessories</h3>
                        <div className="flex flex-wrap gap-2">
                            {item.components.map((comp, i) => (
                                <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300 border border-white/5">
                                    {comp}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Repair & Maintenance History */}
            <div className="space-y-6 pb-12">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Repair History</h2>
                    <Link href={`/dashboard/create?inventoryId=${item.id}`} className="text-sm font-bold text-yellow-500 hover:text-white">
                        + Report Issue
                    </Link>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-6">
                    {item.tickets.length === 0 ? (
                        <p className="text-gray-500 text-center py-6">No repair history available for this item.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-white/5 text-gray-200 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Issue</th>
                                        <th className="px-4 py-3">Component</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Resolution Notes</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {item.tickets.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-white font-medium">{ticket.title}</td>
                                            <td className="px-4 py-3">{ticket.componentName || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border 
                                                    ${ticket.status === 'OPEN' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        ticket.status === 'RESOLVED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate" title={ticket.resolutionDetails}>
                                                {ticket.resolutionDetails || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link href={`/dashboard/${ticket.id}`} className="text-blue-400 hover:text-white hover:underline">
                                                    View
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
            <div className="space-y-6 pb-20">
                <h2 className="text-2xl font-bold">Maintenance Logs</h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-6">
                    {item.maintenanceRecords.length === 0 ? (
                        <p className="text-gray-500 text-center py-6">No maintenance records found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-white/5 text-gray-200 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="px-4 py-3">Start Date</th>
                                        <th className="px-4 py-3">End Date</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3">Technician</th>
                                        <th className="px-4 py-3 text-right">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {item.maintenanceRecords.map((record) => (
                                        <tr key={record.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3">{new Date(record.startDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                {record.endDate ? (
                                                    new Date(record.endDate).toLocaleDateString()
                                                ) : (
                                                    <span className="text-yellow-500 font-bold text-xs uppercase tracking-wider">Ongoing</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">{record.description || '-'}</td>
                                            <td className="px-4 py-3">{record.technician || '-'}</td>
                                            <td className="px-4 py-3 text-right font-mono text-white">
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
    );
}
