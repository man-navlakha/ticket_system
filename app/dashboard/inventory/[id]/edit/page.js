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
        redirect('/dashboard/inventory');
    }

    const item = await prisma.inventoryItem.findUnique({
        where: { id },
        include: {
            user: true
        }
    });

    if (!item) notFound();

    const users = await prisma.user.findMany({
        select: { id: true, username: true, email: true },
        orderBy: { username: 'asc' }
    });

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header / Breadcrumbs */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    <Link href="/dashboard/inventory" className="hover:text-foreground transition-colors">Inventory</Link>
                    <span>/</span>
                    <Link href={`/dashboard/inventory/${id}`} className="hover:text-foreground transition-colors font-mono">{item.pid}</Link>
                    <span>/</span>
                    <span className="text-foreground">Edit</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Edit Asset Record</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed"> Modify lifecycle status or technical attributes for this hardware. </p>
                    </div>
                </div>
            </div>

            <EditInventoryForm item={item} users={users} />
        </div>
    );
}
