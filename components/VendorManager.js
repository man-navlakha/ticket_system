'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VendorManager({ initialVendors, userRole }) {
    const router = useRouter();
    const [vendors, setVendors] = useState(initialVendors);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const categories = Array.from(new Set(vendors.map(v => v.category).filter(Boolean)));

    const filteredVendors = vendors.filter(v => {
        const matchesSearch = v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter ? v.category === categoryFilter : true;
        return matchesSearch && matchesCategory;
    });

    function openAddModal() {
        setEditingVendor(null);
        setError('');
        setIsModalOpen(true);
    }

    function openEditModal(vendor) {
        setEditingVendor(vendor);
        setError('');
        setIsModalOpen(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            category: formData.get('category'),
            contactName: formData.get('contactName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            website: formData.get('website'),
            address: formData.get('address'),
            gstin: formData.get('gstin'),
            note: formData.get('note'),
            status: formData.get('status')
        };

        try {
            const url = editingVendor ? `/api/vendors/${editingVendor.id}` : '/api/vendors';
            const method = editingVendor ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save vendor');
            }

            const savedVendor = await res.json();

            if (editingVendor) {
                setVendors(vendors.map(v => v.id === savedVendor.id ? savedVendor : v));
            } else {
                setVendors([...vendors, savedVendor]);
            }

            setIsModalOpen(false);
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Are you certain you want to delete this vendor? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setVendors(vendors.filter(v => v.id !== id));
            router.refresh();
        } catch (err) {
            alert(err.message);
        }
    }

    return (
        <div>
            {/* Toolbar */}
            <div className="p-8 border-b border-border bg-muted/10 flex flex-col md:flex-row gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-foreground/5 to-transparent -mr-24 -mt-24 rounded-full pointer-events-none" />

                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search vendors by name, email, contact..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 h-12 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-foreground/50 transition-all shadow-sm"
                    />
                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <div className="flex gap-4 relative z-10 w-full md:w-auto">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="flex-1 md:w-48 h-12 px-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-foreground/50 appearance-none font-medium cursor-pointer shadow-sm"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat, i) => (
                            <option key={i} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <button
                        onClick={openAddModal}
                        className="h-12 px-6 bg-foreground text-background rounded-xl text-sm font-bold shadow-lg hover:opacity-90 transition-all active:scale-[0.98] flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        New Vendor
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border bg-muted/5">
                            <th className="py-4 px-8 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-background/50">Details / Name</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-background/50">Category</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-background/50">Contact Info</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-background/50">Status</th>
                            <th className="py-4 px-8 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right bg-background/50">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filteredVendors.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-16 text-center text-muted-foreground text-sm font-medium">
                                    No vendors match your search criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredVendors.map(vendor => (
                                <tr key={vendor.id} className="group hover:bg-muted/20 transition-colors">
                                    <td className="py-5 px-8">
                                        <div className="font-bold text-foreground text-sm flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-foreground/5 border border-border flex items-center justify-center text-xs text-foreground uppercase">
                                                {vendor.name.charAt(0)}
                                            </div>
                                            {vendor.name}
                                        </div>
                                        {vendor.website && (
                                            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground mt-1 block pl-11 truncate max-w-[200px]">
                                                {vendor.website}
                                            </a>
                                        )}
                                    </td>
                                    <td className="py-5 px-6">
                                        {vendor.category ? (
                                            <span className="inline-flex items-center px-2.5 py-1 bg-muted/50 border border-border rounded-md text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                {vendor.category}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="py-5 px-6 space-y-1">
                                        <div className="text-sm text-foreground/80 font-medium">{vendor.contactName || '—'}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{vendor.email || ''}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{vendor.phone || ''}</div>
                                    </td>
                                    <td className="py-5 px-6">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${vendor.status === 'ACTIVE'
                                            ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                            }`}>
                                            {vendor.status}
                                        </span>
                                    </td>
                                    <td className="py-5 px-8 text-right space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditModal(vendor)} className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 uppercase tracking-widest">
                                            Edit
                                        </button>
                                        {userRole === 'ADMIN' && (
                                            <button onClick={() => handleDelete(vendor.id)} className="text-xs font-bold text-destructive/70 hover:text-destructive inline-flex items-center gap-1 uppercase tracking-widest">
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-3xl shadow-2xl p-8 space-y-8 animate-in zoom-in-95 duration-200">

                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold tracking-tight">{editingVendor ? 'Edit Vendor' : 'New Vendor Profile'}</h3>
                                <p className="text-sm text-muted-foreground">Fill in the provider details to manage them in our system.</p>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {error && (
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Company Name *</label>
                                <input name="name" defaultValue={editingVendor?.name} required className="w-full h-11 bg-input/50 border border-border rounded-xl px-4 text-sm focus:border-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Category</label>
                                <input name="category" placeholder="E.g. Hardware, ISP" defaultValue={editingVendor?.category} className="w-full h-11 bg-input/50 border border-border rounded-xl px-4 text-sm focus:border-primary/50" />
                            </div>

                            <div className="space-y-4 md:col-span-2 pt-4 border-t border-border">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Contact & Legal</h4>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Primary Contact Name</label>
                                <input name="contactName" defaultValue={editingVendor?.contactName} className="w-full h-11 bg-input/50 border border-border rounded-xl px-4 text-sm focus:border-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Business Email</label>
                                <input name="email" type="email" defaultValue={editingVendor?.email} className="w-full h-11 bg-input/50 border border-border rounded-xl px-4 text-sm focus:border-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phone Number</label>
                                <input name="phone" defaultValue={editingVendor?.phone} className="w-full h-11 bg-input/50 border border-border rounded-xl px-4 text-sm focus:border-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">GST/Tax ID</label>
                                <input name="gstin" defaultValue={editingVendor?.gstin} className="w-full h-11 bg-input/50 border border-border rounded-xl px-4 text-sm focus:border-primary/50" />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Address / Office Location</label>
                                <input name="address" defaultValue={editingVendor?.address} className="w-full h-11 bg-input/50 border border-border rounded-xl px-4 text-sm focus:border-primary/50" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Website URL</label>
                                <input name="website" type="url" defaultValue={editingVendor?.website} className="w-full h-11 bg-input/50 border border-border rounded-xl px-4 text-sm focus:border-primary/50" />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</label>
                                <select name="status" defaultValue={editingVendor?.status || 'ACTIVE'} className="w-full h-11 bg-input/50 border border-border rounded-xl px-4 text-sm focus:border-primary/50 cursor-pointer">
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                </select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Notes</label>
                                <textarea name="note" defaultValue={editingVendor?.note} rows={3} className="w-full bg-input/50 border border-border rounded-xl p-4 text-sm focus:border-primary/50 resize-none"></textarea>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border flex justify-end gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 h-11 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Cancel</button>
                            <button type="submit" disabled={isLoading} className="px-8 h-11 bg-foreground text-background rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all outline-none">
                                {isLoading ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
