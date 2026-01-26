'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default function DashboardNav({ user }) {
    const pathname = usePathname();
    const router = useRouter();

    const links = [
        { href: '/dashboard', label: 'Overview' },
        { href: '/dashboard/create', label: 'New Ticket' },
        { href: '/dashboard/inventory', label: 'Inventory' },
    ];

    if (user?.role === 'ADMIN' || user?.role === 'AGENT') {
        links.push({ href: '/dashboard/team', label: 'Team' });
    }

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/auth/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const isActive = (path) => {
        if (path === '/dashboard' && pathname === '/dashboard') return true;
        if (path !== '/dashboard' && pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <>
            {/* Desktop Header */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl hidden md:block">
                <div className="container mx-auto px-6">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-3 text-xl font-bold tracking-tight">
                            <Image
                                src="/logo_my.png"
                                alt="Logo"
                                width={32}
                                height={32}
                                className="rounded-lg"
                            />
                            <span>Man&apos;s <span className="text-gray-500">Support Desk</span></span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="flex items-center gap-6">
                            {links.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-sm font-medium transition-colors ${isActive(link.href) ? 'text-white' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <LogoutButton />
                        </nav>
                    </div>
                </div>
            </header>

            {/* Mobile Header (Logo Only) */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl md:hidden">
                <div className="flex h-14 items-center justify-center">
                    <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold">
                        <Image
                            src="/logo_my.png"
                            alt="Logo"
                            width={24}
                            height={24}
                            className="rounded-lg"
                        />
                        <span>Man&apos;s <span className="text-gray-500">Desk</span></span>
                    </Link>
                </div>
            </header>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-white/10 pb-safe">
                <div className="flex items-center justify-around h-16 px-2 relative">

                    {/* Home */}
                    <Link href="/dashboard" className={`flex flex-col items-center justify-center w-14 h-full space-y-1 ${isActive('/dashboard') ? 'text-white' : 'text-gray-500'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-[10px] font-medium">Home</span>
                    </Link>

                    {/* Inventory */}
                    <Link href="/dashboard/inventory" className={`flex flex-col items-center justify-center w-14 h-full space-y-1 ${isActive('/dashboard/inventory') ? 'text-white' : 'text-gray-500'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-[10px] font-medium">Assets</span>
                    </Link>

                    {/* Create Action (FAB) */}
                    <Link href="/dashboard/create" className="flex items-center justify-center -mt-8">
                        <div className="h-14 w-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] border-4 border-[#0a0a0a]">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                    </Link>

                    {/* Team (Conditional) or Help */}
                    {(user?.role === 'ADMIN' || user?.role === 'AGENT') ? (
                        <Link href="/dashboard/team" className={`flex flex-col items-center justify-center w-14 h-full space-y-1 ${isActive('/dashboard/team') ? 'text-white' : 'text-gray-500'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="text-[10px] font-medium">Team</span>
                        </Link>
                    ) : (
                        <Link href="/dashboard/help" className={`flex flex-col items-center justify-center w-14 h-full space-y-1 ${isActive('/dashboard/help') ? 'text-white' : 'text-gray-500'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[10px] font-medium">Help</span>
                        </Link>
                    )}

                    {/* Logout */}
                    <button onClick={handleLogout} className="flex flex-col items-center justify-center w-14 h-full space-y-1 text-gray-500 hover:text-red-500 bg-transparent border-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-[10px] font-medium">Exit</span>
                    </button>

                </div>
            </nav>
        </>
    );
}
