import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function InventoryItemPage({ params }) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    const item = await prisma.inventoryItem.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, username: true, email: true } }
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
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {item.ownership}
                    </span>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b border-white/10 pb-2">Assignment Details</h3>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            <span className="text-gray-500">Assigned To:</span>
                            <span className="col-span-2 text-white font-medium">{item.user ? `${item.user.username} (${item.user.email})` : 'Unassigned'}</span>

                            <span className="text-gray-500">Assigned Date:</span>
                            <span className="col-span-2 text-white">{item.assignedDate ? new Date(item.assignedDate).toLocaleDateString() : '-'}</span>

                            <span className="text-gray-500">Return Date:</span>
                            <span className="col-span-2 text-white">{item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '-'}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b border-white/10 pb-2">Asset Details</h3>
                        <div className="grid grid-cols-3 gap-2 text-sm">
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

        </div>
    );
}
