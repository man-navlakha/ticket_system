'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const STATIC_CATEGORIES = [
    { name: 'Hardware', icon: '💻' },
    { name: 'Software', icon: '💿' },
    { name: 'Network', icon: '🌐' },
    { name: 'Security', icon: '🛡️' },
    { name: 'Other', icon: '📁' }
];

export default function KBSidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get('category');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories');
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const isCatActive = (name) => currentCategory === name;

    return (
        <aside className="w-64 flex-shrink-0 hidden lg:block border-r border-border h-[calc(100vh-64px)] overflow-y-auto no-scrollbar py-8 px-6">
            <div className="space-y-8">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 px-2">Introduction</h3>
                    <Link
                        href="/dashboard/knowledge-base"
                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/dashboard/knowledge-base' && !currentCategory ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                    >
                        Overview
                    </Link>
                </div>

                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 px-2">Categories</h3>
                    <div className="space-y-1">
                        {STATIC_CATEGORIES.map(cat => (
                            <Link
                                key={cat.name}
                                href={`/dashboard/knowledge-base?category=${cat.name}`}
                                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${isCatActive(cat.name) ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                            >
                                <span className="opacity-50">{cat.icon}</span>
                                <span>{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 px-2">Community</h3>
                    <div className="space-y-1">
                        <Link href="/dashboard/help" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors">
                            <span className="opacity-50">💬</span>
                            <span>Support Desk</span>
                        </Link>
                        <Link href="/dashboard/tickets" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors">
                            <span className="opacity-50">🎫</span>
                            <span>My Tickets</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors opacity-50 cursor-not-allowed">
                            <span className="opacity-50">📣</span>
                            <span>Changelog</span>
                        </Link>
                    </div>
                </div>
            </div>
        </aside>
    );
}
