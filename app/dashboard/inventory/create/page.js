'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateInventoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [prefix, setPrefix] = useState('INV');
    const [pid, setPid] = useState('');

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

    // System Information State
    const [systemSpecs, setSystemSpecs] = useState([
        { key: 'RAM', value: '' },
        { key: 'Storage', value: '' },
        { key: 'Processor', value: '' },
        { key: 'OS', value: '' }
    ]);

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

    const generatePid = (customPrefix) => {
        const p = customPrefix || prefix;
        // Simple client-side unique ID generation for now: PREFIX-TIMESTAMP-RANDOM
        // This is unique enough for this use case and allows editing
        const random = Math.floor(1000 + Math.random() * 9000);
        const newPid = `${p}-${random}`;
        setPid(newPid);
    };

    // Auto-generate on mount or first interaction if empty? 
    // Let's just generate on btn click or when prefix changes significantly if user opts in.
    // Better: Just have a generate button.

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget); // Standard form data
        // ... (rest is same)
        const data = {
            pid: formData.get('pid'),
            // ...
            type: formData.get('type'),
            status: formData.get('status'),
            ownership: formData.get('ownership'),
            brand: formData.get('brand'),
            model: formData.get('inventoryModel'),
            price: formData.get('price'),
            assignedDate: formData.get('assignedDate'),
            returnDate: formData.get('returnDate'),
            maintenanceDate: formData.get('maintenanceDate'),
            purchasedDate: formData.get('purchasedDate'),
            warrantyDate: formData.get('warrantyDate'),
            warrantyType: formData.get('warrantyType'),
            userId: formData.get('userId') || undefined, // Allow empty for unassigned
            components: components.filter(c => c.trim() !== ''),
            systemSpecs: systemSpecs.reduce((acc, spec) => {
                if (spec.key.trim() && spec.value.trim()) {
                    acc[spec.key.trim()] = spec.value.trim();
                }
                return acc;
            }, {})
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
            {/* ... header ... */}
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
                    {/* PID Generation Section */}
                    <div className="md:col-span-2 bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                        <h3 className="text-sm font-bold text-gray-400">Asset Tag Generation</h3>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="space-y-2 flex-1">
                                <label className="block text-xs font-medium text-gray-400">Prefix</label>
                                <div className="flex gap-2">
                                    <input
                                        value={prefix}
                                        onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                                        className="w-24 rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-white text-sm focus:ring-1 focus:ring-blue-500 transition outline-none font-mono"
                                        placeholder="INV"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => generatePid()}
                                        className="px-4 py-2 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-colors"
                                    >
                                        Generate New PID
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2 flex-[2]">
                                <label className="block text-xs font-medium text-gray-400">Final PID (Editable)</label>
                                <input
                                    name="pid"
                                    value={pid}
                                    onChange={(e) => setPid(e.target.value)}
                                    required
                                    className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white font-mono text-lg font-bold tracking-wider focus:ring-1 focus:ring-blue-500 transition outline-none"
                                    placeholder="Click Generate..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Status *</label>
                        <select name="status" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none appearance-none bg-gray-900">
                            <option value="ACTIVE">Active</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="RETIRED">Retired</option>
                            <option value="LOST">Lost</option>
                            <option value="IN_STORAGE">In Storage</option>
                        </select>
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
                        <input name="inventoryModel" className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 transition outline-none" placeholder="e.g. XPS 15, MacBook Pro" />
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
