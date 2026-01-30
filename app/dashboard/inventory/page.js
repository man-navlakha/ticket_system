import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import UserInventoryLink from "@/components/UserInventoryLink";
import InventorySearch from "@/components/InventorySearch";

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
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-gray-400 mt-2 text-lg">Manage hardware assets and assignments.</p>
                </div>
                {(user.role === 'ADMIN' || user.role === 'AGENT') && (
                    <Link
                        href="/dashboard/inventory/create"
                        className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-lg"
                    >
                        Add New Item
                    </Link>
                )}
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
