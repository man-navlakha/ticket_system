import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import UserInventoryLink from "@/components/UserInventoryLink";
import InventorySearch from "@/components/InventorySearch";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Hardware Inventory" };

import BulkInventoryUpload from "@/components/BulkInventoryUpload";

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
        <div className="max-w-[100%] mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-gray-400 mt-2 text-lg">Manage hardware assets and assignments.</p>
                </div>
                {(user.role === 'ADMIN' || user.role === 'AGENT') && (
                    <div className="flex gap-4">
                        <BulkInventoryUpload />
                        <Link
                            href="/dashboard/inventory/create"
                            className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-lg"
                        >
                            Add New Item
                        </Link>
                    </div>
                )}
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                    <p className="text-sm font-medium text-gray-400">Total Assets</p>
                    <p className="text-3xl font-bold text-white mt-2">{items.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                    <p className="text-sm font-medium text-gray-400">Assigned</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <p className="text-3xl font-bold text-blue-400">
                            {items.filter(i => i.userId).length}
                        </p>
                        <span className="text-sm text-gray-500">
                            ({((items.filter(i => i.userId).length / items.length) * 100).toFixed(0)}%)
                        </span>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                    <p className="text-sm font-medium text-gray-400">In Maintenance</p>
                    <p className="text-3xl font-bold text-yellow-400 mt-2">
                        {items.filter(i => i.status === 'MAINTENANCE').length}
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                    <p className="text-sm font-medium text-gray-400">Total Value</p>
                    <p className="text-3xl font-bold text-green-400 mt-2">
                        ${items.reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString()}
                    </p>
                </div>
            </div>

            {user.role === 'USER' && <UserInventoryLink />}

            <InventorySearch
                items={serializedItems}
                users={users}
                userRole={user.role}
            />
        </div>
    );
}
