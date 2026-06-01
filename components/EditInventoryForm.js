'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { INVENTORY_STATUS_OPTIONS, getInventoryStatusLabel, normalizeInventoryStatus } from '@/lib/inventory-status';

export default function EditInventoryForm({ item, users }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [systemSpecs, setSystemSpecs] = useState(() => {
        if (item.systemSpecs && typeof item.systemSpecs === 'object') {
            return Object.entries(item.systemSpecs).map(([key, value]) => ({ key, value: String(value) }));
        }

        return [
            { key: 'RAM', value: '' },
            { key: 'Storage', value: '' },
            { key: 'Processor', value: '' },
            { key: 'OS', value: '' },
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
            serialNumber: formData.get('serialNumber'),
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
            }, {}),
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
        <form onSubmit={onSubmit} className="space-y-14 pb-24">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Asset ID" value={item.pid} />
                <MetricCard label="Linked User" value={item.user?.username || item.assignedUser || 'Unassigned'} />
                <MetricCard label="Current Status" value={getInventoryStatusLabel(item.status)} />
                <MetricCard label="Created" value={formatDate(item.createdAt)} />
            </div>

            {error && (
                <div aria-live="polite" className="rounded-[1.5rem] border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive shadow-sm">
                    {error}
                </div>
            )}

            <Section title="Asset Foundation" description="Core identity, lifecycle state, and ownership settings.">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <StaticInfo label="Asset ID" value={item.pid} isMono />
                    <StaticInfo label="Legacy Tag" value={item.oldTag} />
                    <StaticInfo label="Created" value={formatDate(item.createdAt)} />
                    <StaticInfo label="Hardware" value={`${item.brand || 'Unknown'} ${item.model || ''}`.trim()} />
                </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                    <InputField label="Asset Status" name="status" type="select" defaultValue={normalizeInventoryStatus(item.status)}>
                        {INVENTORY_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </InputField>
                    <InputField label="Asset Condition" name="condition" type="select" defaultValue={item.condition}>
                        <option value="NEW">NEW</option>
                        <option value="EXCELLENT">EXCELLENT</option>
                        <option value="GOOD">GOOD</option>
                        <option value="FAIR">FAIR</option>
                        <option value="POOR">POOR</option>
                    </InputField>
                    <InputField label="Category" name="type" type="select" defaultValue={item.type}>
                        <option value="LAPTOP">LAPTOP</option>
                        <option value="DESKTOP">DESKTOP</option>
                        <option value="COMPUTER">COMPUTER</option>
                        <option value="MOBILE">MOBILE</option>
                        <option value="TABLET">TABLET</option>
                        <option value="PRINTER">PRINTER</option>
                        <option value="MONITOR">MONITOR</option>
                        <option value="MOUSE">MOUSE</option>
                        <option value="KEYBOARD">KEYBOARD</option>
                        <option value="HEADSET">HEADSET</option>
                        <option value="OTHER">OTHER</option>
                    </InputField>
                    <InputField label="Ownership" name="ownership" type="select" defaultValue={item.ownership}>
                        <option value="COMPANY">COMPANY OWNED</option>
                        <option value="EMPLOYEE">EMPLOYEE OWNED</option>
                        <option value="RENTED">RENTED</option>
                    </InputField>
                </div>
            </Section>

            <Section title="Localization & Assignment" description="Map the asset to a person, team, and physical location.">
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                    <InputField label="Department" name="department" defaultValue={item.department} placeholder="e.g. Finance" />
                    <InputField label="Physical Location" name="location" defaultValue={item.location} placeholder="e.g. HQ Floor 3" />
                    <InputField label="System User" name="userId" type="select" defaultValue={item.userId || ''}>
                        <option value="">-- UNLINKED --</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.username} ({u.email.split('@')[0]})
                            </option>
                        ))}
                    </InputField>
                    <InputField label="External Assignee" name="assignedUser" defaultValue={item.assignedUser} placeholder="Manual name entry" />
                    <InputField label="Assigned Date" name="assignedDate" type="date" defaultValue={formatDateInput(item.assignedDate)} />
                    <InputField label="Return Date" name="returnDate" type="date" defaultValue={formatDateInput(item.returnDate)} />
                </div>
            </Section>

            <Section title="Hardware Profile" description="Technical specifications, accessories, and secure references.">
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                    <InputField label="Brand" name="brand" defaultValue={item.brand} placeholder="e.g. Dell" />
                    <InputField label="Model Series" name="inventoryModel" defaultValue={item.model} placeholder="e.g. Latitude 5440" />
                    <InputField label="Operating System" name="os" defaultValue={item.os} placeholder="e.g. Windows 11 Pro" />
                    <InputField label="Processor" name="processor" defaultValue={item.processor} placeholder="e.g. Intel Core i7" />
                    <InputField label="Memory (RAM)" name="ram" defaultValue={item.ram} placeholder="e.g. 16GB" />
                    <InputField label="Storage" name="storage" defaultValue={item.storage} placeholder="e.g. 1TB SSD" />
                    <InputField label="Graphics" name="graphicsCard" defaultValue={item.graphicsCard} placeholder="e.g. Intel Iris Xe" />
                    <InputField label="Serial Number" name="serialNumber" defaultValue={item.serialNumber} placeholder="e.g. SN123456789" />
                    <InputField label="System Password" name="password" defaultValue={item.password} placeholder="Optional internal reference" />
                    <div className="rounded-[1.5rem] border border-border bg-muted/20 p-5 md:col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Included Accessories</p>
                        <div className="mt-4 flex flex-wrap gap-6">
                            <CheckboxField label="Includes Charger" name="hasCharger" defaultChecked={item.hasCharger} />
                            <CheckboxField label="Includes Mouse" name="hasMouse" defaultChecked={item.hasMouse} />
                        </div>
                    </div>
                </div>
            </Section>

            <Section title="Operational Lifecycle" description="Procurement, warranty, finance, and legacy references.">
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                    <InputField label="Original Price (INR)" name="price" type="number" step="0.01" defaultValue={item.price} />
                    <InputField label="Vendor Invoice #" name="vendorInvoice" defaultValue={item.vendorInvoice} placeholder="e.g. INV-2026-001" />
                    <InputField label="Purchase Date" name="purchasedDate" type="date" defaultValue={formatDateInput(item.purchasedDate)} />
                    <InputField label="Warranty Date" name="warrantyDate" type="date" defaultValue={formatDateInput(item.warrantyDate)} />
                    <InputField label="Warranty Type" name="warrantyType" defaultValue={item.warrantyType} placeholder="e.g. Warranty" />
                    <InputField label="Last Service" name="maintenanceDate" type="date" defaultValue={formatDateInput(item.maintenanceDate)} />
                    <InputField label="Legacy Tag ID" name="oldTag" defaultValue={item.oldTag} placeholder="Older tracking tag" />
                    <InputField label="Legacy User Name" name="oldUser" defaultValue={item.oldUser} placeholder="Legacy assignee" />
                </div>
            </Section>

            <Section title="System Telemetry" description="Long-form notes and flexible metadata for custom machine details.">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Administrative Note</label>
                        <textarea
                            name="note"
                            rows={5}
                            defaultValue={item.note}
                            placeholder="Capture service notes, escalation context, or special handling instructions."
                            className="w-full rounded-[1.5rem] border border-input bg-background px-5 py-4 text-sm text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Custom Metadata</p>
                                <p className="text-sm text-muted-foreground">Add key-value pairs for telemetry that does not map to the standard schema.</p>
                            </div>
                            <button
                                type="button"
                                onClick={addSystemSpec}
                                className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-4 text-[10px] font-bold uppercase tracking-[0.24em] text-foreground transition hover:bg-muted/50"
                            >
                                Add Metadata Row
                            </button>
                        </div>

                        <div className="space-y-3">
                            {systemSpecs.map((spec, idx) => (
                                <div key={idx} className="grid gap-3 rounded-[1.5rem] border border-border bg-muted/20 p-4 md:grid-cols-[0.9fr_1.4fr_auto] md:items-center">
                                    <input
                                        value={spec.key}
                                        onChange={(e) => updateSystemSpec(idx, 'key', e.target.value)}
                                        className="h-11 rounded-xl border border-input bg-background px-4 text-sm font-semibold text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="Key"
                                    />
                                    <input
                                        value={spec.value}
                                        onChange={(e) => updateSystemSpec(idx, 'value', e.target.value)}
                                        className="h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="Value"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeSystemSpec(idx)}
                                        aria-label={`Remove metadata row ${idx + 1}`}
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-destructive/20 hover:text-destructive"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            <div className="flex flex-col gap-5 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={loading}
                    className="inline-flex h-12 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 px-8 text-xs font-bold uppercase tracking-[0.24em] text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Decommission Asset
                </button>
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href={`/dashboard/inventory/${item.id}`}
                        className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-bold text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
                    >
                        Discard
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-bold text-primary-foreground shadow-xl transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? 'Saving Changes...' : 'Confirm Changes'}
                    </button>
                </div>
            </div>
        </form>
    );
}

function Section({ title, description, children }) {
    return (
        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <div className="space-y-6">
                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">{title}</p>
                    <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
                {children}
            </div>
        </section>
    );
}

function MetricCard({ label, value }) {
    return (
        <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{value || '-'}</p>
        </div>
    );
}

function StaticInfo({ label, value, isMono = false }) {
    return (
        <div className="rounded-[1.5rem] border border-border bg-muted/20 p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
            <p className={`mt-2 break-words text-sm font-medium text-foreground ${isMono ? 'font-mono' : ''}`}>{value || 'N/A'}</p>
        </div>
    );
}

function InputField({ label, name, type = 'text', defaultValue, children, placeholder, step }) {
    const baseStyle = 'w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{label}</label>
            {type === 'select' ? (
                <div className="relative">
                    <select name={name} defaultValue={defaultValue} className={`${baseStyle} appearance-none pr-10`}>
                        {children}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            ) : (
                <input
                    name={name}
                    type={type}
                    defaultValue={defaultValue}
                    placeholder={placeholder}
                    step={step}
                    className={baseStyle}
                />
            )}
        </div>
    );
}

function CheckboxField({ label, name, defaultChecked }) {
    return (
        <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-border bg-background px-4 py-3">
            <input
                type="checkbox"
                name={name}
                defaultChecked={defaultChecked}
                className="h-4 w-4 rounded border-border bg-background text-foreground"
            />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground">{label}</span>
        </label>
    );
}

function formatDate(value) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

function formatDateInput(value) {
    if (!value) return '';
    return new Date(value).toISOString().split('T')[0];
}
