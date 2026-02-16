'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LogoutButton from './LogoutButton';

export default function Sidebar({ user }) {
    const pathname = usePathname();
    const [openSubMenu, setOpenSubMenu] = useState({});

    const toggleSubMenu = (label) => {
        setOpenSubMenu(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const isActive = (path) => {
        if (path === '/dashboard' && pathname === '/dashboard') return true;
        if (path !== '/dashboard' && pathname.startsWith(path)) return true;
        return false;
    };

    const menuItems = [
        {
            label: 'Overview',
            href: '/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            label: 'Tickets',
            href: '/dashboard', // Main link, sub-items follow
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
            ),
            subItems: [
                { label: 'All Tickets', href: '/dashboard' },
                { label: 'New Ticket', href: '/dashboard/create' },
            ]
        },
        {
            label: 'Inventory',
            href: '/dashboard/inventory',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            subItems: [
                { label: 'All Items', href: '/dashboard/inventory' },
            ]
        },
        {
            label: 'Knowledge Base',
            href: '/dashboard/knowledge-base',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            )
        },
    ];

    if (user?.role === 'ADMIN' || user?.role === 'AGENT') {
        menuItems.push({
            label: 'Team',
            href: '/dashboard/team',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        });
        menuItems.push({
            label: 'Proposals',
            href: '/dashboard/proposals',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        });
    } else {
        menuItems.push({
            label: 'Help',
            href: '/dashboard/help',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        });
    }

    return (
        <aside className="hidden md:flex flex-col w-64 min-h-screen bg-[#0a0a0a] border-r border-white/10 sticky top-0 h-screen overflow-y-auto z-50">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10 shrink-0">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Image
                        src="/logo_my.png"
                        alt="Logo"
                        width={32}
                        height={32}
                        className="rounded-lg"
                    />
                    <span className="font-bold text-lg tracking-tight">Man&apos;s <span className="text-gray-500">Desk</span></span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                {menuItems.map((item) => (
                    <div key={item.label}>
                        {item.subItems ? (
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleSubMenu(item.label)}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${isActive(item.href) ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon}
                                        {item.label}
                                    </div>
                                    <svg
                                        className={`w-4 h-4 transition-transform duration-200 ${openSubMenu[item.label] ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {openSubMenu[item.label] && (
                                    <div className="pl-11 space-y-1">
                                        {item.subItems.map((subItem) => (
                                            <Link
                                                key={subItem.href}
                                                href={subItem.href}
                                                className={`block px-3 py-2 text-sm transition-colors rounded-lg ${isActive(subItem.href) ? 'text-white' : 'text-gray-500 hover:text-white'
                                                    }`}
                                            >
                                                {subItem.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive(item.href) ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            {/* User / Logout */}
            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <LogoutButton />
                </div>
            </div>
        </aside>
    );
}
