'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * ThemeLogo — renders the EP icon + "EXCELLENT PUBLICITY" text logo.
 * Swaps to white variants in dark mode.
 * Uses a mounted guard to avoid hydration mismatch with next-themes.
 */
export default function ThemeLogo({ className = '' }) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && resolvedTheme === 'dark';

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Icon mark — square, fixed size */}
            <Image
                src={isDark ? '/EP_Logo_fav.png' : '/EP_Logo_fav.png'}
                alt="EP icon"
                width={32}
                height={32}
                className="object-contain shrink-0"
                priority
            />
            {/* Text wordmark — wide aspect ratio */}
            <Image
                src={isDark ? '/EP_Logo_text_w.png' : '/EP_Logo_text.png'}
                alt="Excellent Publicity"
                width={110}
                height={22}
                className="object-contain shrink-0"
                priority
            />
            <div className="h-4 w-[1px] bg-border mx-1" /> {/* Vertical line separator */}
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80">
                Man Navlakha
            </span>

        </div >
    );
}
