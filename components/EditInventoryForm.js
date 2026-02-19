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
        if (!confirm('Are you sure you want to delete this asset? This action is permanent.')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete asset');
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
            type: formData.get('type'),
            ownership: formData.get('ownership'),
            brand: formData.get('brand'),
            model: formData.get('inventoryModel'),
            condition: formData.get('condition'),
            department: formData.get('department'),
            location: formData.get('location'),
            assignedUser: formData.get('assignedUser'),
            password: formData.get('password'),
            os: formData.get('os'),
            ram: formData.get('ram'),
            storage: formData.get('storage'),
            processor: formData.get('processor'),
            graphicsCard: formData.get('graphicsCard'),
            hasCharger: formData.get('hasCharger') === 'on',
            hasMouse: formData.get('hasMouse') === 'on',
            price: formData.get('price'),
            vendorInvoice: formData.get('vendorInvoice'),
            status: formData.get('status'),
            assignedDate: formData.get('assignedDate'),
            returnDate: formData.get('returnDate'),
            maintenanceDate: formData.get('maintenanceDate'),
            purchasedDate: formData.get('purchasedDate'),
            warrantyDate: formData.get('warrantyDate'),
            warrantyType: formData.get('warrantyType'),
            userId: formData.get('userId') || null,
            oldTag: formData.get('oldTag'),
            oldUser: formData.get('oldUser'),
            note: formData.get('note'),
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
            if (!res.ok) throw new Error('Failed to update asset');
            router.push(`/dashboard/inventory/${item.id}`);
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="max-w-4xl space-y-16 pb-24">
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Section 1: Identity & Condition */}
            <Section title="Asset Foundation" description="Core identification and quality settings.">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <StaticInfo label="Asset ID" value={item.pid} isMono />
                        <StaticInfo label="Legacy Tag" value={item.oldTag} />
                        <StaticInfo label="Created" value={new Date(item.createdAt).toLocaleDateString()} />
                        <StaticInfo label="Hardware" value={`${item.brand || ''} ${item.model || ''}`} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <InputField label="Asset Status" name="status" type="select" defaultValue={item.status}>
                        <option value="ACTIVE" className="bg-black text-white">ACTIVE</option>
                        <option value="MAINTENANCE" className="bg-black text-white">MAINTENANCE</option>
                        <option value="RETIRED" className="bg-black text-white">RETIRED</option>
                        <option value="IN_STORAGE" className="bg-black text-white">IN_STORAGE</option>
                        <option value="SCRAP" className="bg-black text-white">SCRAP</option>
                    </InputField>
                    <InputField label="Asset Condition" name="condition" type="select" defaultValue={item.condition}>
                        <option value="NEW" className="bg-black text-white">NEW</option>
                        <option value="EXCELLENT" className="bg-black text-white">EXCELLENT</option>
                        <option value="GOOD" className="bg-black text-white">GOOD</option>
                        <option value="FAIR" className="bg-black text-white">FAIR</option>
                        <option value="POOR" className="bg-black text-white">POOR</option>
                    </InputField>
                    <InputField label="Category" name="type" type="select" defaultValue={item.type}>
                        <option value="LAPTOP" className="bg-black text-white">LAPTOP</option>
                        <option value="DESKTOP" className="bg-black text-white">DESKTOP</option>
                        <option value="COMPUTER" className="bg-black text-white">COMPUTER</option>
                        <option value="MOBILE" className="bg-black text-white">MOBILE</option>
                        <option value="OTHER" className="bg-black text-white">OTHER</option>
                    </InputField>
                    <InputField label="Ownership" name="ownership" type="select" defaultValue={item.ownership}>
                        <option value="COMPANY" className="bg-black text-white">COMPANY OWNED</option>
                        <option value="EMPLOYEE" className="bg-black text-white">EMPLOYEE OWNED</option>
                        <option value="RENTED" className="bg-black text-white">RENTED</option>
                    </InputField>
                </div>
            </Section>

            {/* Section 2: Localization & Assignment */}
            <Section title="Localization & Assignment" description="Mapping assets to people and places.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <InputField label="Department" name="department" defaultValue={item.department} placeholder="e.g. Finance" />
                    <InputField label="Physical Location" name="location" defaultValue={item.location} placeholder="e.g. HQ Floor 3" />
                    <InputField label="System User" name="userId" type="select" defaultValue={item.userId || ''}>
                        <option value="" className="bg-black text-white">-- UNLINKED --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id} className="bg-black text-white">{u.username} ({u.email.split('@')[0]})</option>
                        ))}
                    </InputField>
                    <InputField label="External Assignee" name="assignedUser" defaultValue={item.assignedUser} placeholder="Manual name entry" />
                </div>
            </Section>

            {/* Section 3: Hardware specs */}
            <Section title="Hardware Profile" description="Technical specifications and credentials.">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <InputField label="Operating System" name="os" defaultValue={item.os} placeholder="e.g. macOS Sonoma" />
                        <InputField label="Processor" name="processor" defaultValue={item.processor} placeholder="e.g. M2 Pro" />
                        <InputField label="Memory (RAM)" name="ram" defaultValue={item.ram} placeholder="e.g. 16GB" />
                        <InputField label="Storage" name="storage" defaultValue={item.storage} placeholder="e.g. 1TB" />
                        <InputField label="Graphics" name="graphicsCard" defaultValue={item.graphicsCard} />
                        <InputField label="Serial Number" name="serialNumber" defaultValue={item.serialNumber} />
                        <InputField label="System Password" name="password" defaultValue={item.password} />
                        <div className="flex gap-8 pt-4">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" name="hasCharger" defaultChecked={item.hasCharger} className="w-5 h-5 rounded border-white/10 bg-black checked:bg-white checked:border-transparent transition-all" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">Includes Charger</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" name="hasMouse" defaultChecked={item.hasMouse} className="w-5 h-5 rounded border-white/10 bg-black checked:bg-white checked:border-transparent transition-all" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">Includes Mouse</span>
                            </label>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Section 4: Timeline & Finance */}
            <Section title="Operational Lifecycle" description="Procurement and financial records.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <InputField label="Original Price ($)" name="price" type="number" defaultValue={item.price} />
                    <InputField label="Vendor Invoice #" name="vendorInvoice" defaultValue={item.vendorInvoice} />
                    <InputField label="Purchase Date" name="purchasedDate" type="date" defaultValue={formatDate(item.purchasedDate)} />
                    <InputField label="Warranty Date" name="warrantyDate" type="date" defaultValue={formatDate(item.warrantyDate)} />
                    <InputField label="Warranty Type" name="warrantyType" defaultValue={item.warrantyType} />
                    <InputField label="Last Service" name="maintenanceDate" type="date" defaultValue={formatDate(item.maintenanceDate)} />
                    <InputField label="Legacy Tag ID" name="oldTag" defaultValue={item.oldTag} />
                    <InputField label="Legacy User Name" name="oldUser" defaultValue={item.oldUser} />
                </div>
            </Section>

            <Section title="System Telemetry" description="Additional logs and administrative observations.">
                <textarea
                    name="note"
                    rows={4}
                    defaultValue={item.note}
                    placeholder="Technical logs..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-sm text-white focus:outline-none focus:border-white/30 transition-all [color-scheme:dark]"
                />
                <div className="mt-8 space-y-4">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Custom Metadata</h4>
                    <div className="space-y-3">
                        {systemSpecs.map((spec, idx) => (
                            <div key={idx} className="flex gap-2 group">
                                <input
                                    value={spec.key}
                                    onChange={(e) => updateSystemSpec(idx, 'key', e.target.value)}
                                    className="w-1/3 h-10 rounded-lg bg-black border border-white/5 px-4 text-xs font-bold text-gray-400 focus:border-white/20 transition-all outline-none"
                                />
                                <input
                                    value={spec.value}
                                    onChange={(e) => updateSystemSpec(idx, 'value', e.target.value)}
                                    className="flex-1 h-10 rounded-lg bg-black border border-white/5 px-4 text-xs text-white focus:border-white/20 transition-all outline-none"
                                />
                                <button type="button" onClick={() => removeSystemSpec(idx)} className="h-10 w-10 text-gray-700 hover:text-red-500 transition-colors">✕</button>
                            </div>
                        ))}
                        <button type="button" onClick={addSystemSpec} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-[0.2em] transition-colors">+ Append Dynamic Key</button>
                    </div>
                </div>
            </Section>

            {/* Form Actions */}
            <div className="pt-12 border-t border-white/5 flex items-center justify-between">
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={loading}
                    className="h-12 px-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                >
                    Decommission Asset
                </button>
                <div className="flex gap-4">
                    <Link href={`/dashboard/inventory/${item.id}`} className="h-12 px-8 flex items-center text-sm font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest">Discard</Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-12 px-10 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-white/5"
                    >
                        {loading ? 'Committing...' : 'Confirm Changes'}
                    </button>
                </div>
            </div>
        </form>
    );
}

function Section({ title, description, children }) {
    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em]">{title}</h3>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
            {children}
        </div>
    );
}

function StaticInfo({ label, value, isMono = false }) {
    return (
        <div className="space-y-1">
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{label}</p>
            <p className={`text-sm font-medium text-white truncate ${isMono ? 'font-mono' : ''}`}>{value || 'N/A'}</p>
        </div>
    );
}

function InputField({ label, name, type = 'text', defaultValue, children }) {
    const baseStyle = "w-full h-11 rounded-xl bg-white/[0.03] border border-white/10 px-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all [color-scheme:dark]";

    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
            {type === 'select' ? (
                <div className="relative">
                    <select name={name} defaultValue={defaultValue} className={`${baseStyle} appearance-none cursor-pointer bg-black`}>
                        {children}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            ) : (
                <input name={name} type={type} defaultValue={defaultValue} className={`${baseStyle} bg-black/40`} />
            )}
        </div>
    );
}
