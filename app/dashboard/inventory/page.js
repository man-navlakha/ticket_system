import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import UserInventoryLink from "@/components/UserInventoryLink";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Hardware Inventory" };

export default async function InventoryPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    const where = user.role === 'USER' ? { userId: user.id } : {};

    const items = await prisma.inventoryItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { username: true, email: true } }
        }
    });

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

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-gray-200 uppercase font-bold text-xs">
                        <tr>
                            <th className="px-6 py-4">PID</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Brand</th>
                            <th className="px-6 py-4">Assigned To</th>
                            <th className="px-6 py-4">Return Date</th>
                            <th className="px-6 py-4">Maintenance</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-mono text-white">{item.pid}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium 
                    ${item.type === 'COMPUTER' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                        {item.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{item.brand || '-'}</td>
                                <td className="px-6 py-4">
                                    {item.user ? (
                                        <div className="flex flex-col">
                                            <span className="text-white">{item.user.username}</span>
                                            <span className="text-xs">{item.user.email}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600 italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {item.returnDate ? (
                                        <span className={new Date(item.returnDate) < new Date() ? 'text-red-400' : ''}>
                                            {new Date(item.returnDate).toLocaleDateString()}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 font-mono text-xs">
                                    {item.maintenanceDate ? new Date(item.maintenanceDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/dashboard/inventory/${item.id}`} className="text-blue-400 hover:text-white hover:underline">
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    No inventory items found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
