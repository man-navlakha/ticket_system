'use client';

import { Compass } from 'lucide-react';
import { startTour } from './FirstTimeTour';

export default function StartTourButton({ variant = 'sidebar' }) {
    if (variant === 'inline') {
        return (
            <button
                type="button"
                onClick={() => startTour()}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
                <Compass className="w-3 h-3" />
                Start guided tour
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={() => startTour()}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200 group text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
            <span className="text-muted-foreground group-hover:text-foreground">
                <Compass className="w-4 h-4" />
            </span>
            <span className="font-medium">Start guided tour</span>
        </button>
    );
}
