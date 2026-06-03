'use client';

import { useSyncExternalStore } from 'react';
import { Sparkles, GraduationCap } from 'lucide-react';

export const SIMPLE_VIEW_KEY = 'ts-simple-view';
export const SIMPLE_VIEW_EVENT = 'ts-simple-view-change';

function readSimpleViewClient() {
    try {
        return window.localStorage.getItem(SIMPLE_VIEW_KEY) === '1';
    } catch {
        return false;
    }
}

function subscribe(callback) {
    window.addEventListener(SIMPLE_VIEW_EVENT, callback);
    window.addEventListener('storage', callback);
    return () => {
        window.removeEventListener(SIMPLE_VIEW_EVENT, callback);
        window.removeEventListener('storage', callback);
    };
}

export function useSimpleView() {
    return useSyncExternalStore(
        subscribe,
        readSimpleViewClient,
        () => false,
    );
}

export default function SimpleViewToggle({ compact = false }) {
    const simple = useSimpleView();

    const toggle = () => {
        const next = !simple;
        try {
            window.localStorage.setItem(SIMPLE_VIEW_KEY, next ? '1' : '0');
        } catch { }
        window.dispatchEvent(new CustomEvent(SIMPLE_VIEW_EVENT, { detail: next }));
    };

    const Icon = simple ? Sparkles : GraduationCap;
    const label = simple ? 'Simple view: ON' : 'Simple view';
    const title = simple
        ? 'Plain language mode — click to switch to full view.'
        : 'Hides technical words like SLA, Asset, Auto-Triage.';

    if (compact) {
        return (
            <button
                type="button"
                onClick={toggle}
                title={title}
                aria-pressed={simple}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${simple
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
            >
                <Icon className="w-3 h-3" />
                {label}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={toggle}
            title={title}
            aria-pressed={simple}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${simple
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    );
}
