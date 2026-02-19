'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LogoutButton from './LogoutButton';

export default function Sidebar({ user }) {
    const pathname = usePathname();
    // Default open state for specific menus if desired, or let user toggle
    const [openSubMenu, setOpenSubMenu] = useState({
        tickets: true,
        inventory: false,
        settings: false
    });

    const toggleSubMenu = (key) => {
        setOpenSubMenu(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isActive = (path) => {
        if (path === '/dashboard' && pathname === '/dashboard') return true;
        if (path !== '/dashboard' && pathname.startsWith(path)) return true;
        return false;
    };

    const isSubActive = (path) => pathname === path;

    // Define menu structure
    const sidebarStructure = [
        {
            title: 'Overview',
            items: [
                {
                    label: 'Dashboard',
                    href: '/dashboard',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    )
                },
                // Placeholder for future analytics route
                {
                    label: 'Analytics',
                    href: '/dashboard/analytics',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                        </svg>
                    )
                }
            ]
        },
        {
            title: 'Ticket System',
            items: [
                {
                    label: 'Tickets',
                    id: 'tickets',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                    ),
                    subItems: [
                        { label: 'All Tickets', href: '/dashboard' },
                        { label: 'My Assigned', href: '/dashboard?filter=assigned' },
                        { label: 'Open Issues', href: '/dashboard?status=OPEN' },
                        { label: 'Create New', href: '/dashboard/create' },
                    ]
                },
            ]
        },
        {
            title: 'Assets & Knowledge',
            items: [
                {
                    label: 'Inventory',
                    id: 'inventory',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    ),
                    subItems: [
                        { label: 'All Assets', href: '/dashboard/inventory' },
                        { label: 'My Devices', href: '/dashboard/inventory?filter=my-devices' },
                    ]
                },
                {
                    label: 'Knowledge Base',
                    href: '/dashboard/knowledge-base',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    )
                }
            ]
        }
    ];

    // Admin / Config Section
    const configSection = {
        title: 'Configuration',
        items: [
            {
                label: 'Platform Status',
                href: '/dashboard/status',
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            },
            {
                label: 'Help & Support',
                href: '/dashboard/help',
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                )
            },
            {
                label: 'Settings',
                href: '/dashboard/profile?tab=settings',
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                )
            },
            {
                label: 'Profile',
                href: '/dashboard/profile',
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                )
            }
        ]
    };

    if (user?.role === 'ADMIN' || user?.role === 'AGENT') {
        configSection.items.unshift(
            {
                label: 'Team Management',
                href: '/dashboard/team',
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                )
            },
            {
                label: 'Proposals',
                href: '/dashboard/proposals',
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                )
            }
        );
    }

    const fullSidebar = [...sidebarStructure, configSection];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-[280px] min-h-screen bg-black border-r border-white/10 sticky top-0 h-screen overflow-y-auto z-50 no-scrollbar">
                {/* Brand Header */}
                <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10 shrink-0 bg-black/50 backdrop-blur-md sticky top-0 z-10">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                            <Image
                                src="/logo_my.png"
                                alt="Logo"
                                width={20}
                                height={20}
                                className="object-contain"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm text-white tracking-tight">Man&apos;s Support</span>
                            <span className="text-[10px] text-gray-500 font-mono">Enterprise</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-6 px-4 space-y-8">
                    {fullSidebar.map((section, idx) => (
                        <div key={idx} className="space-y-2">
                            {section.title && (
                                <h3 className="px-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">
                                    {section.title}
                                </h3>
                            )}
                            <div className="space-y-0.5">
                                {section.items.map((item) => (
                                    <div key={item.label || item.id}>
                                        {item.subItems ? (
                                            <>
                                                <button
                                                    onClick={() => toggleSubMenu(item.id)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-all duration-200 group ${isActive(item.href || '') || openSubMenu[item.id]
                                                        ? 'text-white'
                                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={openSubMenu[item.id] ? 'text-white' : 'text-gray-500 group-hover:text-white'}>{item.icon}</span>
                                                        <span className="font-medium">{item.label}</span>
                                                    </div>
                                                    <svg
                                                        className={`w-3.5 h-3.5 transition-transform duration-200 text-gray-600 group-hover:text-gray-400 ${openSubMenu[item.id] ? 'rotate-90 text-gray-400' : ''}`}
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>

                                                {openSubMenu[item.id] && (
                                                    <div className="relative pl-6 mt-1 space-y-0.5">
                                                        <div className="absolute left-[21px] top-0 bottom-0 w-px bg-white/10" />
                                                        {item.subItems.map((subItem) => (
                                                            <Link
                                                                key={subItem.href}
                                                                href={subItem.href}
                                                                className={`block pl-6 pr-3 py-1.5 text-[13px] rounded-r-md border-l-2 border-transparent transition-colors ${isSubActive(subItem.href)
                                                                    ? 'text-white border-white bg-white/5 font-medium'
                                                                    : 'text-gray-500 hover:text-white hover:border-white/20'
                                                                    }`}
                                                            >
                                                                {subItem.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200 group ${isActive(item.href)
                                                    ? 'text-white bg-white/5 font-medium'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                <span className={isActive(item.href) ? 'text-white' : 'text-gray-500 group-hover:text-white'}>{item.icon}</span>
                                                {item.label}
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-white/10 bg-black sticky bottom-0">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                            <p className="text-[11px] text-gray-500 truncate font-mono">{user?.email}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <LogoutButton />
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Bar - Simplified for cleaner look */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B0E14]/95 backdrop-blur-xl border-t border-white/10 z-50 px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
                <div className="flex items-center justify-around h-16">
                    <Link
                        href="/dashboard"
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all w-16 group ${isActive('/dashboard') ? 'text-white' : 'text-gray-500'}`}
                    >
                        <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-[10px] font-medium">Home</span>
                    </Link>

                    <Link
                        href="/dashboard/inventory"
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all w-16 group ${isActive('/dashboard/inventory') ? 'text-white' : 'text-gray-500'}`}
                    >
                        <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-[10px] font-medium">Assets</span>
                    </Link>

                    <Link
                        href="/dashboard/create"
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-black shadow-lg shadow-white/10 transform -translate-y-4 border-4 border-black active:scale-95 transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </Link>

                    <Link
                        href="/dashboard/knowledge-base"
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all w-16 group ${isActive('/dashboard/knowledge-base') ? 'text-white' : 'text-gray-500'}`}
                    >
                        <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-[10px] font-medium">Wiki</span>
                    </Link>

                    <Link
                        href="/dashboard/profile"
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all w-16 group ${isActive('/dashboard/profile') ? 'text-white' : 'text-gray-500'}`}
                    >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white mb-1">
                            {user?.name?.[0] || 'U'}
                        </div>
                        <span className="text-[10px] font-medium">You</span>
                    </Link>
                </div>
            </nav>
        </>
    );
}
