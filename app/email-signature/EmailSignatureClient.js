'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Mail, ChevronRight } from 'lucide-react';

export default function EmailSignatureClient({ people }) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return people;
        return people.filter((p) => p.name.toLowerCase().includes(q));
    }, [people, query]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-10 px-4">
            <div className="max-w-3xl mx-auto">
                <header className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 text-[#7a1f5c] dark:text-pink-400 mb-2">
                        <Mail size={22} />
                        <span className="text-sm font-semibold uppercase tracking-wide">Excellent Publicity</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        Email Signature Finder
                    </h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
                        Search your name, then copy the signature into your Gmail or Outlook settings.
                    </p>
                </header>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type your name…"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#7a1f5c]/40"
                    />
                </div>

                {/* Results — each links to its own page /email-signature/[slug] */}
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl divide-y divide-gray-100 dark:divide-neutral-800 max-h-[460px] overflow-y-auto">
                    {filtered.length === 0 && (
                        <p className="p-4 text-sm text-gray-500">No match for “{query}”.</p>
                    )}
                    {filtered.map((p) => (
                        <Link
                            key={p.slug}
                            href={`/email-signature/${p.slug}`}
                            className="flex items-center justify-between px-4 py-3 text-gray-800 dark:text-gray-100 hover:bg-[#7a1f5c]/5 dark:hover:bg-pink-500/10 transition-colors"
                        >
                            <span>{p.name}</span>
                            <ChevronRight size={16} className="text-gray-400" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
