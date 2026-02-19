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
        const random = Math.floor(1000 + Math.random() * 9000);
        const newPid = `${p}-${random}`;
        setPid(newPid);
    };

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);

        const data = {
            pid: formData.get('pid'),
            type: formData.get('type'),
            status: formData.get('status'),
            condition: formData.get('condition'),
            department: formData.get('department'),
            location: formData.get('location'),
            assignedUser: formData.get('assignedUser'),
            ownership: formData.get('ownership'),
            brand: formData.get('brand'),
            model: formData.get('inventoryModel'),
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
            assignedDate: formData.get('assignedDate'),
            returnDate: formData.get('returnDate'),
            maintenanceDate: formData.get('maintenanceDate'),
            purchasedDate: formData.get('purchasedDate'),
            warrantyDate: formData.get('warrantyDate'),
            warrantyType: formData.get('warrantyType'),
            userId: formData.get('userId') || undefined,
            note: formData.get('note'),
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
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header / Breadcrumbs */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-widest">
                    <Link href="/dashboard/inventory" className="hover:text-white transition-colors">Inventory</Link>
                    <span>/</span>
                    <span className="text-white">New Asset</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Create Asset</h1>
                        <p className="text-lg text-gray-400 max-w-2xl leading-relaxed"> Register a new hardware item into the enterprise fleet. </p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="max-w-4xl space-y-16">
                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-in zoom-in-95">
                        {error}
                    </div>
                )}

                {/* Section 1: Identifier */}
                <Section title="Asset Identification" description="Generate or manually assign a unique fleet identifier.">
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="space-y-2 flex-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Tag Prefix</label>
                                <div className="flex gap-2">
                                    <input
                                        value={prefix}
                                        onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                                        className="w-20 h-10 rounded-lg bg-black border border-white/10 px-3 text-white text-sm focus:border-white/40 transition-all outline-none font-mono [color-scheme:dark]"
                                        placeholder="INV"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => generatePid()}
                                        className="h-10 px-4 bg-white/5 text-xs font-bold text-white rounded-lg border border-white/10 hover:bg-white/10 transition-all uppercase tracking-widest"
                                    >
                                        Auto Generate
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2 flex-[2]">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Final PID</label>
                                <input
                                    name="pid"
                                    value={pid}
                                    onChange={(e) => setPid(e.target.value)}
                                    required
                                    className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-4 text-white font-mono text-sm font-bold tracking-wider focus:border-white/40 transition-all outline-none placeholder:text-gray-800 [color-scheme:dark]"
                                    placeholder="e.g. EP-001"
                                />
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Section 2: Core Details */}
                <Section title="Primary Metadata" description="Specify the essence and condition of this hardware item.">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <InputField label="Status" name="status" type="select">
                            <option value="ACTIVE" className="bg-black text-white">ACTIVE</option>
                            <option value="MAINTENANCE" className="bg-black text-white">MAINTENANCE</option>
                            <option value="RETIRED" className="bg-black text-white">RETIRED</option>
                            <option value="IN_STORAGE" className="bg-black text-white">IN_STORAGE</option>
                            <option value="SCRAP" className="bg-black text-white">SCRAP</option>
                        </InputField>
                        <InputField label="Condition" name="condition" type="select">
                            <option value="NEW" className="bg-black text-white">NEW</option>
                            <option value="EXCELLENT" className="bg-black text-white">EXCELLENT</option>
                            <option value="GOOD" className="bg-black text-white">GOOD</option>
                            <option value="FAIR" className="bg-black text-white">FAIR</option>
                            <option value="POOR" className="bg-black text-white">POOR</option>
                        </InputField>
                        <InputField label="Category" name="type" type="select">
                            <option value="LAPTOP" className="bg-black text-white">LAPTOP</option>
                            <option value="DESKTOP" className="bg-black text-white">DESKTOP</option>
                            <option value="COMPUTER" className="bg-black text-white">COMPUTER</option>
                            <option value="MOBILE" className="bg-black text-white">MOBILE</option>
                            <option value="OTHER" className="bg-black text-white">OTHER</option>
                        </InputField>
                        <InputField label="Portfolio" name="ownership" type="select">
                            <option value="COMPANY" className="bg-black text-white">COMPANY OWNED</option>
                            <option value="EMPLOYEE" className="bg-black text-white">EMPLOYEE OWNED</option>
                            <option value="RENTED" className="bg-black text-white">RENTED</option>
                        </InputField>
                        <InputField label="Manufacturer" name="brand" placeholder="e.g. Apple, Dell" />
                        <InputField label="Model Series" name="inventoryModel" placeholder="e.g. MacBook Pro M3" />
                        <InputField label="Department" name="department" placeholder="e.g. HR, Engineering" />
                        <InputField label="Physical Location" name="location" placeholder="e.g. Bldg 4, Floor 2" />
                    </div>
                </Section>

                {/* Assignment */}
                <Section title="Assignment Control" description="Link this asset to an internal user or external personnel.">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <InputField label="System User (UUID)" name="userId" placeholder="Linked user ID" />
                        <InputField label="External Assignee" name="assignedUser" placeholder="Name if not in platform" />
                    </div>
                </Section>

                {/* Section 3: Technical Blueprint */}
                <Section title="Technical Blueprint" description="Hardware specifications and security credentials.">
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <InputField label="Operating System" name="os" placeholder="e.g. Windows 11 Pro" />
                            <InputField label="Processor (CPU)" name="processor" placeholder="e.g. i7-12700H" />
                            <InputField label="Memory (RAM)" name="ram" placeholder="e.g. 16GB" />
                            <InputField label="Storage (Disk)" name="storage" placeholder="e.g. 512GB SSD" />
                            <InputField label="Graphics Card" name="graphicsCard" placeholder="e.g. RTX 4060" />
                            <InputField label="System Password" name="password" placeholder="Access credential" />
                        </div>

                        <div className="flex gap-8 pt-4">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" name="hasCharger" defaultChecked className="w-5 h-5 rounded border-white/10 bg-black checked:bg-white checked:border-transparent transition-all" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">Includes Charger</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" name="hasMouse" className="w-5 h-5 rounded border-white/10 bg-black checked:bg-white checked:border-transparent transition-all" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">Includes Mouse</span>
                            </label>
                        </div>
                    </div>
                </Section>

                {/* Section 5: Custom Attributes */}
                <Section title="Extended Attributes" description="Append custom technical specifications as needed.">
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 space-y-6">
                        <div className="grid grid-cols-1 gap-3">
                            {systemSpecs.map((spec, idx) => (
                                <div key={idx} className="flex gap-2 group">
                                    <input
                                        value={spec.key}
                                        onChange={(e) => updateSystemSpec(idx, 'key', e.target.value)}
                                        className="w-1/3 h-10 rounded-lg bg-black border border-white/5 px-4 text-xs font-bold text-gray-400 placeholder-gray-800 focus:border-white/20 transition-all outline-none"
                                        placeholder="Attribute (e.g. Rack #)"
                                    />
                                    <input
                                        value={spec.value}
                                        onChange={(e) => updateSystemSpec(idx, 'value', e.target.value)}
                                        className="flex-1 h-10 rounded-lg bg-black border border-white/5 px-4 text-xs text-white placeholder-gray-800 focus:border-white/20 transition-all outline-none"
                                        placeholder="Configuration"
                                    />
                                    <button type="button" onClick={() => removeSystemSpec(idx)} className="h-10 w-10 flex items-center justify-center text-gray-700 hover:text-red-500 transition-colors">✕</button>
                                </div>
                            ))}
                            <button type="button" onClick={addSystemSpec} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-[0.2em] w-fit mt-2 transition-colors">+ Append Dynamic Field</button>
                        </div>
                    </div>
                </Section>

                {/* Form Action */}
                <div className="pt-12 border-t border-white/5 flex items-center justify-between">
                    <p className="text-xs text-gray-600 max-w-xs font-medium italic">
                        By submitting, this asset will be immediately available for ticket assignment and audit reporting.
                    </p>
                    <div className="flex gap-4">
                        <Link href="/dashboard/inventory" className="h-12 px-8 flex items-center text-sm font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest">Cancel</Link>
                        <button
                            type="submit"
                            disabled={loading || !pid}
                            className="h-12 px-10 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 shadow-xl"
                        >
                            {loading ? 'Processing...' : 'Deploy Asset'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
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

function InputField({ label, name, type = 'text', placeholder, children }) {
    const baseStyle = "w-full h-11 rounded-xl bg-white/[0.03] border border-white/10 px-4 text-sm text-white placeholder:text-gray-800 focus:outline-none focus:border-white/30 transition-all [color-scheme:dark]";

    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
            {type === 'select' ? (
                <div className="relative">
                    <select name={name} className={`${baseStyle} appearance-none cursor-pointer bg-black`}>
                        {children}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            ) : (
                <input name={name} type={type} placeholder={placeholder} className={`${baseStyle} bg-black/40`} />
            )}
        </div>
    );
}
