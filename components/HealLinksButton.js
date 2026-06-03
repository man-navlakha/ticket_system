'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link2 } from 'lucide-react';

/**
 * "Re-sync device links" — runs the bulk fuzzy-match heal across every
 * inventory row whose `userId` is null but whose `assignedUser` free-text
 * field matches an existing user (by firstName+lastName, username, or
 * email local-part). Admin / agent only.
 */
export default function HealLinksButton() {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [open, setOpen] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    async function run(dryRun) {
        setBusy(true);
        setError('');
        try {
            const url = `/api/admin/inventory/heal-links${dryRun ? '?dryRun=true' : ''}`;
            const res = await fetch(url, { method: 'POST' });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || 'Heal failed');
            setResult(j);
            if (!dryRun && (j.linked || 0) > 0) {
                router.refresh();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    setOpen(true);
                    setResult(null);
                    setError('');
                }}
                title="Match orphan inventory rows to existing users by name"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
                <Link2 className="h-4 w-4" />
                Re-sync device links
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Re-sync device links</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Auto-link inventory rows whose <code className="text-[11px]">Assigned User</code> name
                                    matches a real user, by first+last name, username, or email prefix.
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Close"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5">
                            {!result && (
                                <div className="text-sm text-muted-foreground space-y-3">
                                    <p>
                                        <strong className="text-foreground">Preview first</strong> to see how many devices will be linked, then apply.
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1 text-[13px]">
                                        <li>Only <strong>unambiguous</strong> name matches are linked automatically.</li>
                                        <li>Devices with multiple possible owners are listed as <em>ambiguous</em> — fix them by hand.</li>
                                        <li>Devices whose name doesn&apos;t match any user are listed as <em>unmatched</em>.</li>
                                    </ul>
                                </div>
                            )}

                            {result && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <Stat label="Scanned" value={result.scanned} />
                                        <Stat label="Linked" value={result.linked} tone="green" />
                                        <Stat label="Ambiguous" value={result.ambiguousCount} tone="amber" />
                                        <Stat label="Unmatched" value={result.unmatchedCount} tone="muted" />
                                    </div>

                                    {result.dryRun && (
                                        <p className="text-[11px] text-muted-foreground italic">
                                            Dry run — nothing was changed yet.
                                        </p>
                                    )}

                                    {result.linkedSample?.length > 0 && (
                                        <Section title="Sample of links" tone="green">
                                            {result.linkedSample.map((row) => (
                                                <li key={row.pid}>
                                                    <span className="font-mono">{row.pid}</span> →{' '}
                                                    <span className="text-foreground">{row.email || row.assignedUser}</span>
                                                </li>
                                            ))}
                                        </Section>
                                    )}

                                    {result.ambiguous?.length > 0 && (
                                        <Section title="Ambiguous (resolve manually)" tone="amber">
                                            {result.ambiguous.map((row) => (
                                                <li key={row.pid}>
                                                    <span className="font-mono">{row.pid}</span> → {row.assignedUser} (
                                                    {row.candidateCount} candidates)
                                                </li>
                                            ))}
                                        </Section>
                                    )}

                                    {result.unmatched?.length > 0 && (
                                        <Section title="Unmatched names" tone="muted">
                                            {result.unmatched.map((row) => (
                                                <li key={row.pid}>
                                                    <span className="font-mono">{row.pid}</span> → {row.assignedUser || '—'}
                                                </li>
                                            ))}
                                        </Section>
                                    )}

                                    {result.note && (
                                        <p className="text-sm text-muted-foreground italic">{result.note}</p>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive p-3 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-border bg-muted/30 flex flex-wrap items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="h-10 px-4 rounded-full border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => run(true)}
                                disabled={busy}
                                className="h-10 px-4 rounded-full bg-muted text-foreground border border-border text-sm font-semibold hover:bg-muted/80 transition-colors disabled:opacity-50"
                            >
                                {busy && !result ? 'Scanning…' : 'Preview'}
                            </button>
                            <button
                                type="button"
                                onClick={() => run(false)}
                                disabled={busy || (result && result.linked === 0 && !result.dryRun)}
                                className="h-10 px-5 rounded-full bg-foreground text-background text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {busy && result ? 'Applying…' : result && !result.dryRun ? 'Done — close' : 'Apply links'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function Stat({ label, value, tone }) {
    const tones = {
        green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
        amber: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
        muted: 'bg-muted/40 border-border text-muted-foreground',
    };
    return (
        <div className={`rounded-xl border p-3 text-center ${tones[tone] || 'bg-card border-border'}`}>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</div>
            <div className="text-2xl font-bold text-foreground mt-1">{value ?? 0}</div>
        </div>
    );
}

function Section({ title, tone, children }) {
    const tones = {
        green: 'border-emerald-500/30 bg-emerald-500/5',
        amber: 'border-amber-500/30 bg-amber-500/5',
        muted: 'border-border bg-muted/30',
    };
    return (
        <div className={`rounded-xl border ${tones[tone] || ''} overflow-hidden`}>
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground/80 border-b border-border/40">
                {title}
            </div>
            <ul className="p-3 text-xs space-y-1 max-h-40 overflow-y-auto text-muted-foreground font-mono">
                {children}
            </ul>
        </div>
    );
}
