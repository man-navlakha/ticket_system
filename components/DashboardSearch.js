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

export default function DashboardSearch(props) {
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
        <div className={`relative ${props.className || 'w-full sm:w-64 md:w-80'}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search..."
                className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.02] transition-all"
            />
        </div>
    );
}
