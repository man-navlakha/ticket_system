'use client';

import { useState } from 'react';
import { Plus, Trash2, Loader2, AlertCircle, ListChecks, EyeOff, Eye } from 'lucide-react';

/**
 * /dashboard/common-problems — admin-only editor for the dropdown shown on
 * the public /report/[pid] QR page under "Tell us what happened".
 *
 * Add → POST /api/admin/common-problems
 * Toggle active → PATCH /api/admin/common-problems/[id]
 * Delete → DELETE /api/admin/common-problems/[id]
 */
export default function CommonProblemsClient({ initialItems }) {
    const [items, setItems] = useState(initialItems);
    const [label, setLabel] = useState('');
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);

    async function addProblem(e) {
        e.preventDefault();
        const clean = label.trim();
        if (!clean) return;
        setAdding(true);
        setError('');
        try {
            const r = await fetch('/api/admin/common-problems', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: clean }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || 'Could not save.');
            setItems((prev) => {
                const without = prev.filter((p) => p.id !== j.item.id);
                return [...without, j.item].sort(
                    (a, b) => a.sortOrder - b.sortOrder || new Date(a.createdAt) - new Date(b.createdAt),
                );
            });
            setLabel('');
        } catch (err) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    }

    async function removeProblem(id) {
        if (!confirm('Remove this problem from the dropdown?')) return;
        setBusyId(id);
        try {
            const r = await fetch(`/api/admin/common-problems/${id}`, { method: 'DELETE' });
            if (!r.ok) {
                const j = await r.json().catch(() => ({}));
                throw new Error(j.error || 'Could not delete.');
            }
            setItems((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    }

    async function toggleActive(item) {
        setBusyId(item.id);
        try {
            const r = await fetch(`/api/admin/common-problems/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !item.active }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || 'Could not update.');
            setItems((prev) => prev.map((p) => (p.id === item.id ? j.item : p)));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="space-y-8 max-w-2xl">
            <header className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <ListChecks className="w-3.5 h-3.5" />
                    QR report page
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Common problems</h1>
                <p className="text-sm text-muted-foreground">
                    These appear in the &ldquo;Pick a problem&rdquo; dropdown when someone scans a
                    device QR. Add the ones you hear most often. Inactive items are hidden
                    from the dropdown but kept for history.
                </p>
            </header>

            <form onSubmit={addProblem} className="flex gap-2">
                <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    maxLength={120}
                    placeholder="e.g. Email not receiving"
                    className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                />
                <button
                    type="submit"
                    disabled={adding || !label.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-50"
                >
                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add
                </button>
            </form>

            {error && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <section className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
                {items.length === 0 ? (
                    <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                        No problems yet. Add one above and it will show up on the QR report page immediately.
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                            <div className="min-w-0">
                                <div className={`text-sm font-medium ${item.active ? '' : 'text-muted-foreground line-through'}`}>
                                    {item.label}
                                </div>
                                {!item.active && (
                                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                                        Hidden from dropdown
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => toggleActive(item)}
                                    disabled={busyId === item.id}
                                    title={item.active ? 'Hide from dropdown' : 'Show in dropdown'}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
                                >
                                    {item.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeProblem(item.id)}
                                    disabled={busyId === item.id}
                                    title="Delete"
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                                >
                                    {busyId === item.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
}
