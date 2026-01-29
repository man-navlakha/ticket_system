import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import EditInventoryForm from '@/components/EditInventoryForm';
import Link from 'next/link';

export default async function EditInventoryPage({ params }) {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) redirect('/auth/login');
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        redirect('/dashboard/inventory'); // Only admins/agents can edit
    }

    const item = await prisma.inventoryItem.findUnique({
        where: { id },
        include: {
            user: true
        }
    });

    if (!item) notFound();

    // Fetch potential users for assignment
    const users = await prisma.user.findMany({
        select: { id: true, username: true, email: true },
        orderBy: { username: 'asc' }
    });

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-8">
                <Link
                    href={`/dashboard/inventory/${id}`}
                    className="text-sm text-gray-400 hover:text-white mb-4 inline-block transition-colors"
                >
                    ← Back to Item Details
                </Link>
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">Edit Inventory Item</h1>
                    <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/10 text-gray-400">
                        {item.pid}
                    </span>
                </div>
            </div>

            <EditInventoryForm item={item} users={users} />
        </div>
    );
}
