'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateInventoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Simple dynamic list for components
    const [components, setComponents] = useState(['']);

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

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = {
            pid: formData.get('pid'),
            type: formData.get('type'),
            ownership: formData.get('ownership'),
            brand: formData.get('brand'),
            price: formData.get('price'),
            assignedDate: formData.get('assignedDate'),
            returnDate: formData.get('returnDate'),
            maintenanceDate: formData.get('maintenanceDate'),
            purchasedDate: formData.get('purchasedDate'),
            warrantyDate: formData.get('warrantyDate'),
            warrantyType: formData.get('warrantyType'),
            userId: formData.get('userId') || undefined, // Allow empty for unassigned
            components: components.filter(c => c.trim() !== '')
        };

        try {
            const res = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Failed to create item');
            }

            router.push('/dashboard/inventory');
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <div className="mb-8">
                <Link
                    href="/dashboard/inventory"
                    className="text-sm text-gray-400 hover:text-white mb-4 inline-block transition-colors"
                >
                    ← Back to Inventory
                </Link>
                <h1 className="text-3xl font-bold">Add Inventory Item</h1>
            </div>

            <form onSubmit={onSubmit} className="space-y-8">
                {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">PID *</label>
                        <input name="pid" required className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none" placeholder="e.g. COMP-001" />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Type *</label>
                        <select name="type" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none appearance-none bg-gray-900">
                            <option value="COMPUTER">Computer</option>
                            <option value="LAPTOP">Laptop</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Ownership *</label>
                        <select name="ownership" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none appearance-none bg-gray-900">
                            <option value="COMPANY">Company Owned</option>
                            <option value="EMPLOYEE">Employee Owned</option>
                            <option value="RENTED">Rented</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Brand</label>
                        <input name="brand" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none" placeholder="e.g. Dell, Apple" />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Model</label>
                        <input name="model" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none" placeholder="e.g. XPS 15, MacBook Pro" />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Assigned User ID</label>
                        <input name="userId" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none" placeholder="UUID of Employee" />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Approx Price</label>
                        <input name="price" type="number" step="0.01" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none" placeholder="0.00" />
                    </div>
                </div>

                {/* Dates Section */}
                <div className="border-t border-white/10 pt-6">
                    <h3 className="text-lg font-semibold mb-4">Important Dates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Assigned Date</label>
                            <input name="assignedDate" type="date" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none [color-scheme:dark]" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Return Date</label>
                            <input name="returnDate" type="date" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none [color-scheme:dark]" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Maintenance Date</label>
                            <input name="maintenanceDate" type="date" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none [color-scheme:dark]" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Purchased Date</label>
                            <input name="purchasedDate" type="date" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none [color-scheme:dark]" />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Warranty Expiry</label>
                            <input name="warrantyDate" type="date" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none [color-scheme:dark]" />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Warranty Type</label>
                            <select name="warrantyType" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none appearance-none bg-gray-900">
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

                <div className="flex justify-end pt-8">
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-full bg-white px-8 py-3 text-sm font-bold text-black hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating...' : 'Add Item'}
                    </button>
                </div>
            </form>
        </div>
    );
}
