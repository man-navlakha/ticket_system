import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import UserInventoryLink from "@/components/UserInventoryLink";
import InventorySearch from "@/components/InventorySearch";
import BulkInventoryUpload from "@/components/BulkInventoryUpload";
import PageHeader from "@/components/PageHeader";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Hardware Inventory" };

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
        // Only fetch users if admin/agent to save resources
        (user.role === 'ADMIN' || user.role === 'AGENT')
            ? prisma.user.findMany({ select: { id: true, username: true, email: true }, orderBy: { username: 'asc' } })
            : Promise.resolve([])
    ]);

    // Serialize dates for client component
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
        <div className="min-h-screen rounded-xl bg-[#0B0E14] text-white p-6 md:p-12 font-sans">
            <div className="max-w-[100%] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-white/5 pb-8">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-2">Inventory</h1>
                        <p className="text-gray-400 text-lg">Manage hardware assets and assignments.</p>
                    </div>
                    {(user.role === 'ADMIN' || user.role === 'AGENT') && (
                        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                            <BulkInventoryUpload />
                            <Link
                                href="/dashboard/inventory/create"
                                className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-lg whitespace-nowrap"
                            >
                                + Add New Item
                            </Link>
                        </div>
                    )}
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl p-6 transition-all">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Total Assets</p>
                        <p className="text-4xl font-light text-white">{items.length}</p>
                    </div>
                    <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl p-6 transition-all">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Assigned</p>
                        <div className="flex items-end gap-2">
                            <p className="text-4xl font-light text-blue-400">
                                {items.filter(i => i.userId).length}
                            </p>
                            <span className="text-sm font-medium text-gray-500 mb-1">
                                ({items.length > 0 ? ((items.filter(i => i.userId).length / items.length) * 100).toFixed(0) : 0}%)
                            </span>
                        </div>
                    </div>
                    <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl p-6 transition-all">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">In Maintenance</p>
                        <p className="text-4xl font-light text-amber-400">
                            {items.filter(i => i.status === 'MAINTENANCE').length}
                        </p>
                    </div>
                    <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl p-6 transition-all">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Total Value</p>
                        <p className="text-4xl font-light text-green-400">
                            ${items.reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                {user.role === 'USER' && <UserInventoryLink />}

                <div className="bg-[#141820] border border-transparent rounded-2xl overflow-hidden p-1 shadow-sm">
                    <InventorySearch
                        items={serializedItems}
                        users={users}
                        userRole={user.role}
                    />
                </div>
            </div>
        </div>
    );
}
