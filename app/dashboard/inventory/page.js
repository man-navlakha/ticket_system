import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import UserInventoryLink from "@/components/UserInventoryLink";
import InventorySearch from "@/components/InventorySearch";
import BulkInventoryUpload from "@/components/BulkInventoryUpload";

export const dynamic = 'force-dynamic';
export const metadata = {
    title: "Hardware Inventory & Asset Management",
    description: "Track and manage enterprise hardware assets. Real-time visibility into laptop assignments, warranty status, and lifecycle management.",
    openGraph: {
        title: "Hardware Inventory | Man's Support Desk",
        description: "Enterprise-grade asset management for modern IT teams.",
    }
};

export default async function InventoryPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    const where = user.role === 'USER' ? { userId: user.id } : {};

    const [items, users] = await Promise.all([
        prisma.inventoryItem.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { username: true, email: true } }
            }
        }),
        (user.role === 'ADMIN' || user.role === 'AGENT')
            ? prisma.user.findMany({ select: { id: true, username: true, email: true }, orderBy: { username: 'asc' } })
            : Promise.resolve([])
    ]);

    const serializedItems = items.map(item => ({
        ...item,
        createdAt: item.createdAt?.toISOString(),
        updatedAt: item.updatedAt?.toISOString(),
        assignedDate: item.assignedDate?.toISOString() || null,
        returnDate: item.returnDate?.toISOString() || null,
        maintenanceDate: item.maintenanceDate?.toISOString() || null,
        purchasedDate: item.purchasedDate?.toISOString() || null,
        warrantyDate: item.warrantyDate?.toISOString() || null,
    }));

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Minimal Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-widest">
                    <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                    <span>/</span>
                    <span className="text-white">Inventory</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Hardware Assets</h1>
                        <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                            Full lifecycle tracking and assignment management for all enterprise hardware.
                        </p>
                    </div>

                    {(user.role === 'ADMIN' || user.role === 'AGENT') && (
                        <div className="flex items-center gap-3">
                            <BulkInventoryUpload />
                            <Link
                                href="/dashboard/inventory/create"
                                className="h-10 px-5 bg-white text-black rounded-lg text-sm font-bold shadow-lg hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center gap-2 group"
                            >
                                <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Asset
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Assets" value={items.length.toString()} color="text-white" />
                <StatCard
                    label="Assigned"
                    value={items.filter(i => i.userId || i.assignedUser).length.toString()}
                    percentage={`${items.length > 0 ? ((items.filter(i => i.userId || i.assignedUser).length / items.length) * 100).toFixed(0) : 0}%`}
                    color="text-blue-400"
                />
                <StatCard
                    label="Maintenance"
                    value={items.filter(i => i.status === 'MAINTENANCE').length.toString()}
                    color="text-amber-400"
                />
                <StatCard
                    label="Portfolio Value"
                    value={`$${items.reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString()}`}
                    color="text-green-400"
                />
            </div>

            {user.role === 'USER' && <UserInventoryLink />}

            {/* Table Container */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <InventorySearch
                    items={serializedItems}
                    users={users}
                    userRole={user.role}
                />
            </div>

            {/* Bottom Support Callout */}
            <div className="pt-8 border-t border-white/5 text-center">
                <p className="text-sm text-gray-500">
                    Need to audit a specific rack or department? <Link href="/dashboard/help" className="text-white hover:underline font-medium">Contact Asset Management</Link>.
                </p>
            </div>
        </div>
    );
}

function StatCard({ label, value, percentage, color }) {
    return (
        <div className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/[0.02] to-transparent -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">{label}</p>
            <div className="flex items-baseline gap-2">
                <h3 className={`text-3xl font-bold tracking-tighter ${color}`}>{value}</h3>
                {percentage && (
                    <span className="text-xs font-medium text-gray-600">({percentage})</span>
                )}
            </div>
        </div>
    );
}
