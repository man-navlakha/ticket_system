import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import CreateInventoryForm from '@/components/CreateInventoryForm';
import Link from 'next/link';

export default async function CreateInventoryPage() {
    const user = await getCurrentUser();

    if (!user) redirect('/auth/login');
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        redirect('/dashboard/inventory');
    }

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
                    <span className="text-foreground">New Asset</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Create Asset</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed"> Register a new hardware item into the enterprise fleet. </p>
                    </div>
                </div>
            </div>

            <CreateInventoryForm users={users} />
        </div>
    );
}
