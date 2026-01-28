'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

// Debounce helper
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function DashboardSearch() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [text, setText] = useState(searchParams.get('search') || '');
    const debouncedText = useDebounce(text, 500);

    useEffect(() => {
        // Create new params
        const params = new URLSearchParams(searchParams);
        if (debouncedText) {
            params.set('search', debouncedText);
        } else {
            params.delete('search');
        }

        // Push new URL
        router.replace(`${pathname}?${params.toString()}`);
    }, [debouncedText, router, pathname, searchParams]);

    return (
        <div className="relative w-full sm:w-64 md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search tickets..."
                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white transition-all placeholder:text-gray-500"
            />
        </div>
    );
}
