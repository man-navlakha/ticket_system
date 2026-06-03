'use client';

import Link from 'next/link';
import { Printer, ArrowLeft } from 'lucide-react';

export default function PrintControls({ count, mode }) {
    const modeLabel = {
        single: 'Single device',
        selected: 'Selected devices',
        all: 'All devices',
        none: 'No selection',
    }[mode] || 'Print sheet';

    return (
        <div
            data-print-hide
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4"
        >
            <div className="flex items-center gap-3">
                <Link
                    href="/dashboard/inventory"
                    className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to inventory
                </Link>
                <div className="hidden md:block h-5 w-px bg-border" />
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {modeLabel}
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                        {count} {count === 1 ? 'sticker' : 'stickers'} ready
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden md:inline">
                    Tip: paper size A4 · 6 stickers per page
                </span>
                <button
                    type="button"
                    onClick={() => window.print()}
                    disabled={count === 0}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Printer className="w-4 h-4" />
                    Print
                </button>
            </div>
        </div>
    );
}
