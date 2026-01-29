'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditInventoryForm({ item, users }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [components, setComponents] = useState(item.components || ['']);

    const addComponent = () => setComponents([...components, '']);
    const updateComponent = (index, value) => {
        const newComponents = [...components];
        newComponents[index] = value;
        setComponents(newComponents);
    };
    const removeComponent = (index) => {
        const newComponents = components.filter((_, i) => i !== index);
        setComponents(newComponents);
    };

    // Initialize specs from item.systemSpecs (JSON) or defaults
    const [systemSpecs, setSystemSpecs] = useState(() => {
        if (item.systemSpecs && typeof item.systemSpecs === 'object') {
            return Object.entries(item.systemSpecs).map(([key, value]) => ({ key, value }));
        }
        return [
            { key: 'RAM', value: '' },
            { key: 'Storage', value: '' },
            { key: 'Processor', value: '' },
            { key: 'OS', value: '' }
        ];
    });

    const addSystemSpec = () => setSystemSpecs([...systemSpecs, { key: '', value: '' }]);

    const updateSystemSpec = (index, field, value) => {
        const newSpecs = [...systemSpecs];
        newSpecs[index][field] = value;
        setSystemSpecs(newSpecs);
    };

    const removeSystemSpec = (index) => {
        const newSpecs = systemSpecs.filter((_, i) => i !== index);
        setSystemSpecs(newSpecs);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    async function onDelete() {
        if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/inventory/${item.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Failed to delete item');
            }

            router.push('/dashboard/inventory');
            router.refresh();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = {
            pid: item.pid,
            type: item.type,
            ownership: item.ownership,
            brand: item.brand,
            model: item.model,
            price: formData.get('price'),
            status: formData.get('status'),
            assignedDate: formData.get('assignedDate'),
            returnDate: formData.get('returnDate'),
            maintenanceDate: formData.get('maintenanceDate'),
            purchasedDate: formData.get('purchasedDate'),
            warrantyDate: formData.get('warrantyDate'),
            warrantyType: formData.get('warrantyType'),
            userId: formData.get('userId') || null,
            components: components.filter(c => c.trim() !== ''),
            systemSpecs: systemSpecs.reduce((acc, spec) => {
                if (spec.key.trim() && spec.value.trim()) {
                    acc[spec.key.trim()] = spec.value.trim();
                }
                return acc;
            }, {})
        };

        try {
            const res = await fetch(`/api/inventory/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Failed to update item');
            }

            router.push(`/dashboard/inventory/${item.id}`);
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-8">
            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">PID * (Read-Only)</label>
                    <input
                        name="pid"
                        defaultValue={item.pid}
                        readOnly
                        disabled
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-gray-400 focus:ring-0 cursor-not-allowed opacity-60"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Status *</label>
                    <select
                        name="status"
                        defaultValue={item.status}
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none appearance-none bg-gray-900"
                    >
                        <option value="ACTIVE">Active</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="RETIRED">Retired</option>
                        <option value="LOST">Lost</option>
                        <option value="IN_STORAGE">In Storage</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Type * (Read-Only)</label>
                    <select
                        name="type"
                        defaultValue={item.type}
                        disabled
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-gray-400 focus:ring-0 cursor-not-allowed opacity-60 appearance-none bg-black/20"
                    >
                        <option value="COMPUTER">Computer</option>
                        <option value="LAPTOP">Laptop</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Ownership * (Read-Only)</label>
                    <select
                        name="ownership"
                        defaultValue={item.ownership}
                        disabled
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-gray-400 focus:ring-0 cursor-not-allowed opacity-60 appearance-none bg-black/20"
                    >
                        <option value="COMPANY">Company Owned</option>
                        <option value="EMPLOYEE">Employee Owned</option>
                        <option value="RENTED">Rented</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Brand (Read-Only)</label>
                    <input
                        name="brand"
                        defaultValue={item.brand}
                        readOnly
                        disabled
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-gray-400 focus:ring-0 cursor-not-allowed opacity-60"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Model (Read-Only)</label>
                    <input
                        name="model"
                        defaultValue={item.model}
                        readOnly
                        disabled
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-gray-400 focus:ring-0 cursor-not-allowed opacity-60"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Assigned User</label>
                    <select
                        name="userId"
                        defaultValue={item.userId || ''}
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none appearance-none bg-gray-900"
                    >
                        <option value="">-- Unassigned --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Approx Price</label>
                    <input
                        name="price"
                        type="number"
                        step="0.01"
                        defaultValue={item.price}
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none"
                    />
                </div>
            </div>

            {/* Dates Section */}
            <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg font-semibold mb-4">Important Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Assigned Date</label>
                        <input name="assignedDate" type="date" defaultValue={formatDate(item.assignedDate)} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none [color-scheme:dark]" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Return Date</label>
                        <input name="returnDate" type="date" defaultValue={formatDate(item.returnDate)} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none [color-scheme:dark]" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Maintenance Date</label>
                        <input name="maintenanceDate" type="date" defaultValue={formatDate(item.maintenanceDate)} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none [color-scheme:dark]" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Purchased Date</label>
                        <input name="purchasedDate" type="date" defaultValue={formatDate(item.purchasedDate)} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none [color-scheme:dark]" />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Warranty Expiry</label>
                        <input name="warrantyDate" type="date" defaultValue={formatDate(item.warrantyDate)} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none [color-scheme:dark]" />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Warranty Type</label>
                        <select
                            name="warrantyType"
                            defaultValue={item.warrantyType || 'Warranty'}
                            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none appearance-none bg-gray-900"
                        >
                            <option value="Warranty">Warranty</option>
                            <option value="Guarantee">Guarantee</option>
                            <option value="None">None</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Components Section */}
            <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg font-semibold mb-4">Components / Accessories</h3>
                <div className="space-y-3">
                    {components.map((comp, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input
                                value={comp}
                                onChange={(e) => updateComponent(idx, e.target.value)}
                                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500 transition outline-none"
                                placeholder={`Component ${idx + 1}`}
                            />
                            {components.length > 1 && (
                                <button type="button" onClick={() => removeComponent(idx)} className="text-red-400 hover:text-red-300 px-2 font-bold">✕</button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={addComponent} className="text-sm text-blue-400 hover:text-blue-300 font-medium">+ Add Component</button>
                </div>
            </div>

            {/* System Information Section */}
            <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg font-semibold mb-4">System Information</h3>
                <p className="text-sm text-gray-400 mb-4">Add technical details (e.g., RAM, Processor, OS) to help AI triage issues.</p>

                <div className="space-y-3">
                    {systemSpecs.map((spec, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input
                                value={spec.key}
                                onChange={(e) => updateSystemSpec(idx, 'key', e.target.value)}
                                className="w-1/3 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500 transition outline-none"
                                placeholder="Field (e.g. RAM)"
                            />
                            <input
                                value={spec.value}
                                onChange={(e) => updateSystemSpec(idx, 'value', e.target.value)}
                                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500 transition outline-none"
                                placeholder="Value (e.g. 16GB)"
                            />
                            <button type="button" onClick={() => removeSystemSpec(idx)} className="text-red-400 hover:text-red-300 px-2 font-bold">✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={addSystemSpec} className="text-sm text-blue-400 hover:text-blue-300 font-medium">+ Add Field</button>
                </div>
            </div>

            <div className="flex justify-between pt-8">
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={loading}
                    className="rounded-full bg-red-500/10 border border-red-500/20 px-8 py-3 text-sm font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                >
                    Delete Item
                </button>
                <div className="flex gap-4">
                    <Link
                        href={`/dashboard/inventory/${item.id}`}
                        className="inline-flex items-center justify-center rounded-full bg-white/10 px-8 py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-full bg-white px-8 py-3 text-sm font-bold text-black hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </form>
    );
}
