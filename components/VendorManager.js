'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Icons (inline SVG to keep zero additional deps) ──────────────────────────
const IconSearch = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const IconPlus = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const IconClose = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const IconLink = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);
const IconEdit = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1l1-4l9.5-9.5z" />
    </svg>
);
const IconTrash = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
);
const IconEmpty = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);

// ─── Alphabet avatar with deterministic hue ───────────────────────────────────
function VendorAvatar({ name }) {
    const hues = [210, 160, 280, 30, 340, 190, 60, 240];
    const hue = hues[name.charCodeAt(0) % hues.length];
    return (
        <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 select-none"
            style={{
                background: `hsl(${hue} 60% 94%)`,
                color: `hsl(${hue} 60% 36%)`,
                border: `1px solid hsl(${hue} 60% 88%)`
            }}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }) {
    const active = status === 'ACTIVE';
    return (
        <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${active
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {status}
        </span>
    );
}

// ─── Category tag ─────────────────────────────────────────────────────────────
function CategoryTag({ label }) {
    if (!label) return <span className="text-muted-foreground text-xs">—</span>;
    return (
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground bg-muted/60 border border-border px-2 py-0.5 rounded">
            {label.toUpperCase()}
        </span>
    );
}

// ─── Form field ───────────────────────────────────────────────────────────────
function Field({ label, children }) {
    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
            {children}
        </div>
    );
}
const inputCls = "w-full h-10 bg-background border border-border rounded-lg px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors";

// ─── Main component ───────────────────────────────────────────────────────────
export default function VendorManager({ initialVendors, userRole }) {
    const router = useRouter();
    const [vendors, setVendors] = useState(initialVendors);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const categories = Array.from(new Set(vendors.map(v => v.category).filter(Boolean))).sort();

    const filteredVendors = vendors.filter(v => {
        const q = searchTerm.toLowerCase();
        const matchesSearch = !q ||
            v.name?.toLowerCase().includes(q) ||
            v.contactName?.toLowerCase().includes(q) ||
            v.email?.toLowerCase().includes(q);
        const matchesCategory = !categoryFilter || v.category === categoryFilter;
        const matchesStatus = !statusFilter || v.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    function openAddModal() { setEditingVendor(null); setError(''); setIsModalOpen(true); }
    function openEditModal(vendor) { setEditingVendor(vendor); setError(''); setIsModalOpen(true); }

    async function handleSubmit(e) {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(['name', 'category', 'contactName', 'email', 'phone', 'website', 'address', 'gstin', 'note', 'status'].map(k => [k, formData.get(k)]));
        try {
            const url = editingVendor ? `/api/vendors/${editingVendor.id}` : '/api/vendors';
            const res = await fetch(url, { method: editingVendor ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to save'); }
            const saved = await res.json();
            setVendors(prev => editingVendor ? prev.map(v => v.id === saved.id ? saved : v) : [...prev, saved]);
            setIsModalOpen(false);
            router.refresh();
        } catch (err) { setError(err.message); }
        finally { setIsLoading(false); }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this vendor? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setVendors(prev => prev.filter(v => v.id !== id));
            router.refresh();
        } catch (err) { alert(err.message); }
    }

    const activeCount = vendors.filter(v => v.status === 'ACTIVE').length;
    const inactiveCount = vendors.length - activeCount;

    return (
        <div className="min-h-[600px]">

            {/* ── Top toolbar ────────────────────────────────────────────── */}
            <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row gap-4 items-start md:items-center border-b border-border">

                {/* Stats strip */}
                <div className="flex items-center gap-6 shrink-0">
                    <StatStrip label="Total" value={vendors.length} />
                    <StatStrip label="Active" value={activeCount} colorClass="text-emerald-500" />
                    <StatStrip label="Inactive" value={inactiveCount} colorClass="text-amber-500" />
                </div>

                <div className="flex-1 flex flex-col sm:flex-row gap-3 md:justify-end">

                    {/* Search */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3.5 flex items-center text-muted-foreground/50 pointer-events-none">
                            <IconSearch />
                        </span>
                        <input
                            type="text"
                            placeholder="Search vendors..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="h-9 pl-9 pr-4 w-full sm:w-56 bg-muted/40 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 focus:bg-background transition-all"
                        />
                    </div>

                    {/* Category filter */}
                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="h-9 px-3 bg-muted/40 border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:border-foreground/30 cursor-pointer transition-all appearance-none"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="h-9 px-3 bg-muted/40 border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:border-foreground/30 cursor-pointer transition-all appearance-none"
                    >
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>

                    {/* Add button */}
                    <button
                        onClick={openAddModal}
                        className="h-9 px-4 bg-foreground text-background rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shrink-0"
                    >
                        <IconPlus /> New Vendor
                    </button>
                </div>
            </div>

            {/* ── Vendor grid ────────────────────────────────────────────── */}
            <div className="p-8">
                {filteredVendors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground/40">
                            <IconEmpty />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">No vendors found</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {searchTerm || categoryFilter || statusFilter ? 'Clear your filters to see all entries.' : 'Add your first vendor to get started.'}
                            </p>
                        </div>
                        {!searchTerm && !categoryFilter && !statusFilter && (
                            <button onClick={openAddModal} className="h-9 px-5 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all">
                                Add First Vendor
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredVendors.map(vendor => (
                            <VendorCard
                                key={vendor.id}
                                vendor={vendor}
                                userRole={userRole}
                                onEdit={() => openEditModal(vendor)}
                                onDelete={() => handleDelete(vendor.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modal ──────────────────────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setIsModalOpen(false)}
                    />

                    {/* Sheet */}
                    <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">

                        {/* Modal header */}
                        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold tracking-tight">{editingVendor ? 'Edit Vendor' : 'New Vendor'}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">{editingVendor ? `Modifying ${editingVendor.name}` : 'Register a new supplier or service provider'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                            >
                                <IconClose />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">

                            {error && (
                                <div className="p-3.5 text-xs font-medium text-destructive bg-destructive/8 border border-destructive/20 rounded-lg">
                                    {error}
                                </div>
                            )}

                            {/* Section: Identity */}
                            <SectionLabel>Identity</SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Field label="Company Name *">
                                        <input name="name" className={inputCls} defaultValue={editingVendor?.name} required placeholder="e.g. Acme Corp" />
                                    </Field>
                                </div>
                                <Field label="Category">
                                    <input name="category" className={inputCls} defaultValue={editingVendor?.category} placeholder="Hardware, ISP, SaaS…" />
                                </Field>
                                <Field label="Status">
                                    <select name="status" defaultValue={editingVendor?.status || 'ACTIVE'} className={inputCls + ' cursor-pointer'}>
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </Field>
                            </div>

                            {/* Section: Contact */}
                            <SectionLabel>Contact</SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Field label="Primary Contact Name">
                                        <input name="contactName" className={inputCls} defaultValue={editingVendor?.contactName} placeholder="Full name" />
                                    </Field>
                                </div>
                                <Field label="Business Email">
                                    <input name="email" type="email" className={inputCls} defaultValue={editingVendor?.email} placeholder="name@company.com" />
                                </Field>
                                <Field label="Phone Number">
                                    <input name="phone" className={inputCls} defaultValue={editingVendor?.phone} placeholder="+91 …" />
                                </Field>
                            </div>

                            {/* Section: Legal & Location */}
                            <SectionLabel>Legal & Location</SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="GST / Tax ID">
                                    <input name="gstin" className={inputCls} defaultValue={editingVendor?.gstin} placeholder="22AAAAA0000A1Z5" />
                                </Field>
                                <Field label="Website">
                                    <input name="website" type="url" className={inputCls} defaultValue={editingVendor?.website} placeholder="https://…" />
                                </Field>
                                <div className="col-span-2">
                                    <Field label="Address / Office Location">
                                        <input name="address" className={inputCls} defaultValue={editingVendor?.address} placeholder="123 Street, City, State" />
                                    </Field>
                                </div>
                            </div>

                            {/* Notes */}
                            <Field label="Notes">
                                <textarea name="note" defaultValue={editingVendor?.note} rows={3} className={inputCls + ' h-auto resize-none py-2.5'} placeholder="Any additional notes…" />
                            </Field>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="h-9 px-4 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isLoading} className="h-9 px-5 bg-foreground text-background rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                                    {isLoading ? 'Saving…' : editingVendor ? 'Save Changes' : 'Create Vendor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Stat strip ───────────────────────────────────────────────────────────────
function StatStrip({ label, value, colorClass = 'text-foreground' }) {
    return (
        <div className="flex flex-col">
            <span className={`text-2xl font-bold tracking-tighter tabular-nums ${colorClass}`}>{value}</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
    );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{children}</span>
            <div className="flex-1 h-px bg-border" />
        </div>
    );
}

// ─── Vendor card ──────────────────────────────────────────────────────────────
function VendorCard({ vendor, userRole, onEdit, onDelete }) {
    return (
        <div className="group relative bg-card border border-border rounded-2xl p-5 hover:border-foreground/20 hover:shadow-sm transition-all duration-200 flex flex-col gap-4 overflow-hidden">

            {/* Subtle corner accent */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-foreground/[0.03] to-transparent pointer-events-none" />

            {/* Header row */}
            <div className="flex items-start gap-3">
                <VendorAvatar name={vendor.name} />
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate leading-snug">{vendor.name}</h4>
                    {vendor.website ? (
                        <a
                            href={vendor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-0.5 truncate max-w-full"
                        >
                            <IconLink />
                            <span className="truncate">{vendor.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                    ) : (
                        <span className="text-[11px] text-muted-foreground/50">No website</span>
                    )}
                </div>
                <StatusPill status={vendor.status} />
            </div>

            {/* Category */}
            <div className="flex items-center gap-2">
                <CategoryTag label={vendor.category} />
                {vendor.gstin && (
                    <span className="font-mono text-[10px] text-muted-foreground/50">GST: {vendor.gstin}</span>
                )}
            </div>

            {/* Divider */}
            <div className="h-px bg-border/60" />

            {/* Contact info */}
            <div className="space-y-1.5">
                {vendor.contactName && (
                    <p className="text-xs text-foreground font-medium truncate">{vendor.contactName}</p>
                )}
                {vendor.email && (
                    <p className="text-[11px] text-muted-foreground truncate">{vendor.email}</p>
                )}
                {vendor.phone && (
                    <p className="text-[11px] text-muted-foreground">{vendor.phone}</p>
                )}
                {!vendor.contactName && !vendor.email && !vendor.phone && (
                    <p className="text-[11px] text-muted-foreground/40 italic">No contact info</p>
                )}
            </div>

            {/* Note */}
            {vendor.note && (
                <p className="text-[11px] text-muted-foreground/70 italic line-clamp-2 border-t border-border/50 pt-3">{vendor.note}</p>
            )}

            {/* Actions — appear on hover */}
            <div className="flex items-center gap-2 pt-1 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                    onClick={onEdit}
                    className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground bg-muted/40 hover:bg-muted hover:text-foreground transition-all"
                >
                    <IconEdit /> Edit
                </button>
                {userRole === 'ADMIN' && (
                    <button
                        onClick={onDelete}
                        className="h-8 px-3 flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold text-destructive/70 bg-destructive/5 hover:bg-destructive hover:text-white transition-all"
                    >
                        <IconTrash /> Delete
                    </button>
                )}
            </div>
        </div>
    );
}
