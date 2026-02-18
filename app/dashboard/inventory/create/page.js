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

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget); // Standard form data

        const data = {
            pid: formData.get('pid'),
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
        <div className="min-h-screen rounded-xl bg-[#0B0E14] text-white p-6 md:p-12 font-sans">
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <div className="space-y-6">
                    <Link
                        href="/dashboard/inventory"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <span>←</span> Back to Inventory
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-2">Add Inventory Item</h1>
                        <p className="text-gray-400 text-lg">Create a new hardware asset record.</p>
                    </div>
                </div>

                <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl p-8 shadow-sm transition-all">
                    <form onSubmit={onSubmit} className="space-y-8">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* PID Generation Section */}
                            <div className="md:col-span-2 bg-black/20 p-6 rounded-xl border border-white/5 space-y-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Asset Tag Generation</h3>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="space-y-2 flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Prefix</label>
                                        <div className="flex gap-2">
                                            <input
                                                value={prefix}
                                                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                                                className="w-24 rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-white text-sm focus:border-white transition-all outline-none font-mono"
                                                placeholder="INV"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => generatePid()}
                                                className="px-6 py-3 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-xl border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all uppercase tracking-wider"
                                            >
                                                Generate New PID
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2 flex-[2]">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Final PID (Editable)</label>
                                        <input
                                            name="pid"
                                            value={pid}
                                            onChange={(e) => setPid(e.target.value)}
                                            required
                                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white font-mono text-lg font-bold tracking-wider focus:border-white transition-all outline-none"
                                            placeholder="Click Generate..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Status *</label>
                                <div className="relative">
                                    <select name="status" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-white transition-all outline-none appearance-none">
                                        <option value="ACTIVE" className="bg-[#141820]">Active</option>
                                        <option value="MAINTENANCE" className="bg-[#141820]">Maintenance</option>
                                        <option value="RETIRED" className="bg-[#141820]">Retired</option>
                                        <option value="LOST" className="bg-[#141820]">Lost</option>
                                        <option value="IN_STORAGE" className="bg-[#141820]">In Storage</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Type *</label>
                                <div className="relative">
                                    <select name="type" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-white transition-all outline-none appearance-none">
                                        <option value="COMPUTER" className="bg-[#141820]">Computer</option>
                                        <option value="LAPTOP" className="bg-[#141820]">Laptop</option>
                                        <option value="OTHER" className="bg-[#141820]">Other</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ownership *</label>
                                <div className="relative">
                                    <select name="ownership" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-white transition-all outline-none appearance-none">
                                        <option value="COMPANY" className="bg-[#141820]">Company Owned</option>
                                        <option value="EMPLOYEE" className="bg-[#141820]">Employee Owned</option>
                                        <option value="RENTED" className="bg-[#141820]">Rented</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Brand</label>
                                <input name="brand" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-white transition-all outline-none" placeholder="e.g. Dell, Apple" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Model</label>
                                <input name="inventoryModel" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-white transition-all outline-none" placeholder="e.g. XPS 15, MacBook Pro" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Assigned User ID</label>
                                <input name="userId" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-white transition-all outline-none" placeholder="UUID of Employee" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Approx Price</label>
                                <input name="price" type="number" step="0.01" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-white transition-all outline-none" placeholder="0.00" />
                            </div>
                        </div>

                        {/* Dates Section */}
                        <div className="border-t border-white/5 pt-8">
                            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Important Dates</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Assigned Date</label>
                                    <input name="assignedDate" type="date" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-white transition-all outline-none [color-scheme:dark]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Return Date</label>
                                    <input name="returnDate" type="date" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-white transition-all outline-none [color-scheme:dark]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Maintenance Date</label>
                                    <input name="maintenanceDate" type="date" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-white transition-all outline-none [color-scheme:dark]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Purchased Date</label>
                                    <input name="purchasedDate" type="date" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-white transition-all outline-none [color-scheme:dark]" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Warranty Expiry</label>
                                    <input name="warrantyDate" type="date" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-white transition-all outline-none [color-scheme:dark]" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Warranty Type</label>
                                    <div className="relative">
                                        <select name="warrantyType" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-white transition-all outline-none appearance-none">
                                            <option value="Warranty" className="bg-[#141820]">Warranty</option>
                                            <option value="Guarantee" className="bg-[#141820]">Guarantee</option>
                                            <option value="None" className="bg-[#141820]">None</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Components Section */}
                        <div className="border-t border-white/5 pt-8">
                            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Components / Accessories</h3>
                            <div className="space-y-3">
                                {components.map((comp, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            value={comp}
                                            onChange={(e) => updateComponent(idx, e.target.value)}
                                            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:border-white transition-all outline-none"
                                            placeholder={`Component ${idx + 1}`}
                                        />
                                        {components.length > 1 && (
                                            <button type="button" onClick={() => removeComponent(idx)} className="text-red-400 hover:text-red-300 px-3 font-bold hover:bg-red-400/10 rounded-lg transition-colors">✕</button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addComponent} className="text-sm text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider py-2">+ Add Component</button>
                            </div>
                        </div>

                        {/* System Information Section */}
                        <div className="border-t border-white/5 pt-8">
                            <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">System Information</h3>
                            <p className="text-sm text-gray-400 mb-6">Add technical details (e.g., RAM, Processor, OS) to help AI triage issues.</p>

                            <div className="space-y-3">
                                {systemSpecs.map((spec, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            value={spec.key}
                                            onChange={(e) => updateSystemSpec(idx, 'key', e.target.value)}
                                            className="w-1/3 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:border-white transition-all outline-none"
                                            placeholder="Field (e.g. RAM)"
                                        />
                                        <input
                                            value={spec.value}
                                            onChange={(e) => updateSystemSpec(idx, 'value', e.target.value)}
                                            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:border-white transition-all outline-none"
                                            placeholder="Value (e.g. 16GB)"
                                        />
                                        <button type="button" onClick={() => removeSystemSpec(idx)} className="text-red-400 hover:text-red-300 px-3 font-bold hover:bg-red-400/10 rounded-lg transition-colors">✕</button>
                                    </div>
                                ))}
                                <button type="button" onClick={addSystemSpec} className="text-sm text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider py-2">+ Add Field</button>
                            </div>
                        </div>

                        <div className="flex justify-end pt-8 border-t border-white/5">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : 'Add Item'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
