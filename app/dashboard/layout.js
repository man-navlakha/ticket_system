import Link from 'next/link';
import InventoryOnboarding from '@/components/InventoryOnboarding';
import { getCurrentUser } from '@/lib/session';

export default async function DashboardLayout({ children }) {
    const user = await getCurrentUser();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-gray-800">
            <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center justify-between px-6">
                    <Link href="/dashboard" className="text-xl font-bold tracking-tight">
                        Man's <span className="text-gray-500">Ticket System</span>
                    </Link>
                    <nav className="flex items-center gap-6">
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            Overview
                        </Link>
                        <Link
                            href="/dashboard/create"
                            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            New Ticket
                        </Link>
                        <Link
                            href="/dashboard/inventory"
                            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            Inventory
                        </Link>
                        {(user?.role === 'ADMIN' || user?.role === 'AGENT') && (
                            <Link
                                href="/dashboard/team"
                                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                            >
                                Team
                            </Link>
                        )}
                        {/* Simple logout link logic would go here */}
                    </nav>
                </div>
            </header>
            <InventoryOnboarding />
            <main className="container mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}
