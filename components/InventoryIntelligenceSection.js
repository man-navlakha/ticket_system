'use client';

import { useId, useState } from "react";
import InventoryCharts from "@/components/InventoryCharts";

export default function InventoryIntelligenceSection({ items, defaultOpen = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const panelId = useId();

    return (
        <section className="space-y-5">
            <button
                type="button"
                aria-controls={panelId}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className="group flex w-full items-start justify-between gap-6 rounded-[1.75rem] border border-border bg-card/70 p-5 text-left shadow-sm transition-all hover:border-foreground/15 hover:bg-muted/30"
            >
                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                        Operational telemetry
                    </p>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            Inventory intelligence
                        </h2>
                        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                            Asset growth, assignment rate, and hardware mix rendered with the same dashboard chart language.
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground sm:inline-flex">
                        {isOpen ? "Hide charts" : "Show charts"}
                    </span>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-transform duration-200">
                        <svg
                            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="m6 9 6 6 6-6" />
                        </svg>
                    </span>
                </div>
            </button>

            {isOpen && (
                <div id={panelId} className="animate-in fade-in duration-300">
                    <InventoryCharts items={items} />
                </div>
            )}
        </section>
    );
}
