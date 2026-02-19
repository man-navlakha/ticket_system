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
                }
            },
            maintenanceRecords: {
                orderBy: { startDate: 'desc' }
            }
        }
    });

    if (!item) notFound();

    if (user.role === 'USER' && item.userId !== user.id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
                <p className="text-gray-500 mt-2 max-w-sm">This hardware asset is not registered to your account.</p>
                <Link href="/dashboard/inventory" className="mt-8 px-6 py-2 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-200 transition-all">
                    Return to Inventory
                </Link>
            </div>
        );
    }

    const isAdmin = user.role === 'ADMIN' || user.role === 'AGENT';

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header / Breadcrumbs */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-widest">
                    <Link href="/dashboard/inventory" className="hover:text-white transition-colors">Inventory</Link>
                    <span>/</span>
                    <span className="text-white font-mono">{item.pid}</span>
                </div>

                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 pb-8 border-b border-white/5">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">{item.pid}</h1>
                            <StatusBadge status={item.status} />
                        </div>
                        <div className="flex items-center gap-2 text-lg text-gray-400">
                            <span className="font-bold text-white tracking-tight">{item.brand}</span>
                            <span className="text-gray-700">/</span>
                            <span>{item.model}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {item.ownership} Portfolio
                        </span>
                        {isAdmin && (
                            <Link
                                href={`/dashboard/inventory/${item.id}/edit`}
                                className="h-10 px-5 bg-white/[0.03] border border-white/10 text-white rounded-lg text-sm font-bold hover:bg-white/[0.08] transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Details
                            </Link>
                        )}
                        <InventoryActions item={item} />
                    </div>
                </div>
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Assignment Detail */}
                <InfoCard title="Fleet Deployment">
                    <div className="space-y-4">
                        <DetailRow label="Primary Asset Holder" value={item.user ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[9px] font-mono text-gray-400">{item.user.username?.[0]}</div>
                                <span className="text-white font-bold">{item.user.username}</span>
                            </div>
                        ) : (item.assignedUser ? <span className="text-amber-400 font-bold">{item.assignedUser}</span> : 'Unassigned')} />
                        <DetailRow label="Department Unit" value={item.department} />
                        <DetailRow label="Physical Station" value={item.location} />
                        <DetailRow label="Condition Grade" value={item.condition} isMono />
                        <DetailRow label="Deployed Date" value={item.assignedDate ? new Date(item.assignedDate).toLocaleDateString() : '-'} />
                    </div>
                </InfoCard>

                {/* Hardware Spec Matrix */}
                <InfoCard title="Hardware Architecture">
                    <div className="space-y-3">
                        <DetailRow label="Core Processor" value={item.processor} />
                        <DetailRow label="System Memory" value={item.ram} />
                        <DetailRow label="Primary Storage" value={item.storage} />
                        <DetailRow label="Operating System" value={item.os} />
                        <DetailRow label="Graphics Unit" value={item.graphicsCard} />
                        <div className="flex gap-4 pt-2 border-t border-white/5 mt-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${item.hasCharger ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>CHARGER: {item.hasCharger ? 'INCL' : 'MISS'}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${item.hasMouse ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>MOUSE: {item.hasMouse ? 'INCL' : 'MISS'}</span>
                        </div>
                    </div>
                </InfoCard>

                {/* Procurement & Specs */}
                <InfoCard title="Lifecycle & Security">
                    <div className="space-y-4">
                        <DetailRow label="Serial Number" value={item.serialNumber} isMono />
                        <DetailRow label="Acquisition Value" value={item.price ? `$${item.price.toLocaleString()}` : '-'} isGreen />
                        <DetailRow label="Internal Password" value={item.password ? '••••••••' : 'None Set'} isFaded />
                        <DetailRow label="Warranty Expiry" value={item.warrantyDate ? new Date(item.warrantyDate).toLocaleDateString() : '-'} />
                        <DetailRow label="Invoice Ref" value={item.vendorInvoice} />
                    </div>
                </InfoCard>
            </div>

            {/* Extended Attributes */}
            {item.systemSpecs && typeof item.systemSpecs === 'object' && Object.keys(item.systemSpecs).length > 0 && (
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
                    <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em] mb-6">Extended Telemetry</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(item.systemSpecs).map(([key, value]) => (
                            <div key={key} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                                <div className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter mb-0.5">{key}</div>
                                <div className="text-[12px] font-mono text-gray-300 truncate tracking-tight">{String(value)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Note Section */}
            {item.note && (
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6">
                    <h4 className="text-[9px] font-bold text-amber-500 uppercase tracking-[.2em] mb-2">Administrative Observation</h4>
                    <p className="text-sm text-gray-400 leading-relaxed italic">"{item.note}"</p>
                </div>
            )}

            {/* Table Sections */}
            <div className="grid grid-cols-1 gap-12">
                {/* Repair History */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Operational History</h3>
                        <Link href={`/dashboard/create?inventoryId=${item.id}`} className="px-4 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-all">
                            Initialize Repair
                        </Link>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left text-[13px]">
                            <thead className="bg-white/[0.02] border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Incident</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Timeline</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest text-right">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {item.tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-gray-700 font-bold uppercase tracking-[0.2em] text-[10px]">No documented repairs</td>
                                    </tr>
                                ) : (
                                    item.tickets.map(ticket => (
                                        <tr key={ticket.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold group-hover:text-blue-400 transition-colors uppercase tracking-tight">{ticket.title}</span>
                                                    <span className="text-[10px] text-gray-600">{ticket.componentName || 'General System'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${ticket.status === 'RESOLVED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 font-mono text-gray-500 text-xs">
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Link href={`/dashboard/${ticket.id}`} className="text-[10px] font-bold text-gray-600 hover:text-white transition-all uppercase tracking-widest">
                                                    Inspect →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Maintenance Section */}
                {item.maintenanceRecords.length > 0 && (
                    <div className="space-y-6">
                        <div className="border-b border-white/5 pb-4">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Lifecycle Maintenance</h3>
                        </div>
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                            <table className="w-full text-left text-[13px]">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Objective</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Fleet Engineer</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Cost Center</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest text-right">Schedule</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                    {item.maintenanceRecords.map(record => (
                                        <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-5 text-gray-300">{record.description}</td>
                                            <td className="px-6 py-5 uppercase font-bold text-xs text-white tracking-widest">{record.technician || 'External'}</td>
                                            <td className="px-6 py-5 font-mono text-green-500">${record.cost?.toFixed(2) || '0.00'}</td>
                                            <td className="px-6 py-5 text-right font-mono text-gray-500 text-xs">
                                                {new Date(record.startDate).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const colors = {
        ACTIVE: 'bg-green-500/10 text-green-500 border-green-500/20',
        MAINTENANCE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        RETIRED: 'bg-red-500/10 text-red-500 border-red-500/20',
        STORAGE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] border ${colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
            {status}
        </span>
    );
}

function InfoCard({ title, children }) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/[0.03] to-transparent -mr-16 -mt-16 rounded-full group-hover:scale-125 transition-transform duration-700" />
            <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em] mb-6">{title}</h3>
            {children}
        </div>
    );
}

function DetailRow({ label, value, isMono = false, isFaded = false, isGreen = false }) {
    return (
        <div className={`flex justify-between items-center py-2 border-b border-white/[0.03] last:border-0 ${isFaded ? 'opacity-50' : ''}`}>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{label}</span>
            <span className={`text-[13px] font-medium tracking-tight ${isMono ? 'font-mono' : ''} ${isGreen ? 'text-green-500 font-bold' : 'text-white'}`}>
                {value || '-'}
            </span>
        </div>
    );
}
