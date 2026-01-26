'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InventoryActions({ item, users, userRole }) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        pid: item.pid,
        type: item.type,
        brand: item.brand || '',
        model: item.model || '',
        userId: item.userId || '',
        status: item.status || 'ACTIVE', // Assuming status exists or just logic
        ownership: item.ownership || 'COMPANY',
        price: item.price || '',
        purchasedDate: item.purchasedDate ? new Date(item.purchasedDate).toISOString().split('T')[0] : '',
        warrantyDate: item.warrantyDate ? new Date(item.warrantyDate).toISOString().split('T')[0] : '',
        returnDate: item.returnDate ? new Date(item.returnDate).toISOString().split('T')[0] : '',
        maintenanceDate: item.maintenanceDate ? new Date(item.maintenanceDate).toISOString().split('T')[0] : '',
        assignedDate: item.assignedDate ? new Date(item.assignedDate).toISOString().split('T')[0] : '',
        warrantyType: item.warrantyType || '',
        components: item.components ? item.components.join(', ') : ''
    });

    const isAuthorized = userRole === 'ADMIN' || userRole === 'AGENT';
    const isAdmin = userRole === 'ADMIN';

    if (!isAuthorized) return null;

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' });
            if (res.ok) {
                router.refresh();
            } else {
                alert('Failed to delete item');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                // specific logic for dates or types if needed
                userId: formData.userId === '' ? null : formData.userId,
                price: formData.price ? parseFloat(formData.price) : null,
                components: formData.components.split(',').map(c => c.trim()).filter(c => c)
            };

            const res = await fetch(`/api/inventory/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setIsEditing(false);
                router.refresh();
            } else {
                alert('Failed to update item');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex items-center justify-end gap-2">
            <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-blue-400 p-1 transition-colors"
                title="Edit"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>

            <button
                onClick={async () => {
                    if (isSaving) return;

                    const isMaintenance = item.status === 'MAINTENANCE';
                    const action = isMaintenance ? 'Close' : 'Start';

                    if (!confirm(`Are you sure you want to ${action.toLowerCase()} maintenance for this item?`)) return;

                    let description = '';
                    let cost = '';

                    if (!isMaintenance) {
                        description = prompt("Enter a description for this maintenance (optional):");
                        cost = prompt("Enter estimated cost (optional):");
                    }

                    setIsSaving(true);
                    try {
                        let res;
                        if (!isMaintenance) {
                            // Start Maintenance
                            res = await fetch(`/api/inventory/${item.id}/maintenance`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ description, cost }),
                            });
                        } else {
                            // Close Maintenance
                            res = await fetch(`/api/inventory/${item.id}/maintenance`, {
                                method: 'PUT',
                            });
                        }

                        if (res.ok) {
                            router.refresh();
                        } else {
                            const json = await res.json();
                            alert(json.error || 'Failed to update maintenance status');
                        }
                    } catch (err) {
                        console.error(err);
                    } finally {
                        setIsSaving(false);
                    }
                }}
                disabled={isSaving}
                className={`p-1 transition-colors disabled:opacity-50 ${item.status === 'MAINTENANCE' ? 'text-yellow-500 hover:text-white' : 'text-gray-400 hover:text-yellow-500'}`}
                title={item.status === 'MAINTENANCE' ? "Set Active" : "Set Maintenance"}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            {isAdmin && (
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-gray-400 hover:text-red-500 p-1 transition-colors disabled:opacity-50"
                    title="Delete"
                >
                    {isDeleting ? (
                        <span className="w-5 h-5 block border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    )}
                </button>
            )}

            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Edit Inventory Item</h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">PID</label>
                                    <input
                                        type="text"
                                        value={formData.pid}
                                        onChange={(e) => setFormData({ ...formData, pid: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="COMPUTER">Computer</option>
                                        <option value="LAPTOP">Laptop</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                    <option value="RETIRED">Retired</option>
                                    <option value="LOST">Lost</option>
                                    <option value="IN_STORAGE">In Storage</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Brand</label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Model</label>
                                    <input
                                        type="text"
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Ownership</label>
                                    <select
                                        value={formData.ownership}
                                        onChange={(e) => setFormData({ ...formData, ownership: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="COMPANY">Company</option>
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="RENTED">Rented</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Assigned User</label>
                                    <select
                                        value={formData.userId}
                                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.username || u.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Date Assigned</label>
                                    <input
                                        type="date"
                                        value={formData.assignedDate || ''}
                                        onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Purchase Date</label>
                                    <input
                                        type="date"
                                        value={formData.purchasedDate}
                                        onChange={(e) => setFormData({ ...formData, purchasedDate: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Return Date</label>
                                    <input
                                        type="date"
                                        value={formData.returnDate}
                                        onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Maintenance Date</label>
                                    <input
                                        type="date"
                                        value={formData.maintenanceDate}
                                        onChange={(e) => setFormData({ ...formData, maintenanceDate: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Warranty Exp.</label>
                                    <input
                                        type="date"
                                        value={formData.warrantyDate}
                                        onChange={(e) => setFormData({ ...formData, warrantyDate: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Warranty Type</label>
                                    <input
                                        type="text"
                                        value={formData.warrantyType}
                                        onChange={(e) => setFormData({ ...formData, warrantyType: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                        placeholder="e.g. On-site, Carry-in"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Components (Comma separated)</label>
                                <textarea
                                    value={formData.components}
                                    onChange={(e) => setFormData({ ...formData, components: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none resize-none"
                                    rows={2}
                                    placeholder="e.g. Mouse, Keyboard, Monitor"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
