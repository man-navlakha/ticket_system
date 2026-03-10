'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Laptop, Cloud, Plug } from 'lucide-react';

function CreateTicketForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedId = searchParams.get('inventoryId');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [inventory, setInventory] = useState([]);
    const [issueType, setIssueType] = useState('inventory');

    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedComponent, setSelectedComponent] = useState('');
    const [customProduct, setCustomProduct] = useState('');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        fetchInventory();
    }, []);

    async function fetchInventory() {
        try {
            const res = await fetch('/api/inventory');
            if (res.ok) {
                const data = await res.json();
                setInventory(data);

                if (data.length > 0) {
                    if (preSelectedId) {
                        const preItem = data.find(i => i.id === preSelectedId);
                        if (preItem) {
                            setSelectedItem(preItem);
                            setIssueType('inventory');
                            return;
                        }
                    }
                    setSelectedItem(data[0]);
                } else {
                    setIssueType('personal');
                }
            }
        } catch (err) {
            console.error('Failed to fetch inventory:', err);
        }
    }


    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        let attachmentUrls = [];
        const files = formData.getAll('attachment').filter(f => f.size > 0);
        const notifyAgents = formData.get('notifyAgents') === 'on';

        if (files.length > 0) {
            try {
                const uploadPromises = files.map(async (file) => {
                    const uploadData = new FormData();
                    uploadData.append('file', file);
                    const uploadRes = await fetch('/api/upload', {
                        method: 'POST',
                        body: uploadData,
                    });
                    if (!uploadRes.ok) throw new Error('Upload failed');
                    const uploadJson = await uploadRes.json();
                    return uploadJson.url;
                });
                attachmentUrls = await Promise.all(uploadPromises);
            } catch (err) {
                setError('Attachment upload failed. Please try again.');
                setLoading(false);
                return;
            }
        }

        const data = {
            title,
            description,
            priority: formData.get('priority'),
            isPersonalIssue: issueType === 'personal' || issueType === 'email',
            inventoryItemId: issueType === 'inventory' ? selectedItem?.id : null,
            productName: issueType === 'inventory' ? `${selectedItem?.brand} ${selectedItem?.model} (${selectedItem?.pid})` : (issueType === 'email' ? 'Email Service' : customProduct),
            componentName: issueType === 'inventory' ? selectedComponent : null,
            attachmentUrls,
            notifyAgents,
        };

        try {
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Failed to create ticket');
            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">Workspace</Link>
                    <span>/</span>
                    <span className="text-foreground">New Request</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Create Ticket</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">Submit a support request. Our team will get back to you as soon as possible.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="max-w-4xl space-y-16 pb-24">
                {error && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Step 1: Issue Classification */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Classification</h3>
                        <p className="text-sm text-foreground/80">Identify the nature of your technical challenge.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <TypeCard
                            active={issueType === 'inventory'}
                            onClick={() => setIssueType('inventory')}
                            disabled={inventory.length === 0}
                            title="Laptop & Desktop"
                            Icon={Laptop}
                            description="Issues with laptops, monitors, or peripherals."
                        />
                        <TypeCard
                            active={issueType === 'email'}
                            onClick={() => setIssueType('email')}
                            title="Email & Drive"
                            Icon={Cloud}
                            description="Email, Drive, or software access issues."
                        />
                        <TypeCard
                            active={issueType === 'personal'}
                            onClick={() => setIssueType('personal')}
                            title="Other"
                            Icon={Plug}
                            description="Networking, physical access, or custom needs."
                        />
                    </div>
                </div>

                {/* Device Selection Overlay */}
                {issueType === 'inventory' && inventory.length > 0 && (
                    <div className="bg-muted/30 border border-border rounded-[2rem] p-8 space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Target Asset" name="inventoryId" type="select"
                                value={selectedItem?.id || ''}
                                onChange={(e) => {
                                    const item = inventory.find(i => i.id === e.target.value);
                                    setSelectedItem(item);
                                    setSelectedComponent('');
                                }}
                            >
                                {inventory.map(item => (
                                    <option key={item.id} value={item.id} className="bg-background text-foreground">
                                        {item.brand} {item.model} — {item.pid}
                                    </option>
                                ))}
                            </InputField>
                            <InputField label="Asset Sub-component" name="componentName" type="select"
                                value={selectedComponent}
                                onChange={(e) => setSelectedComponent(e.target.value)}
                            >
                                <option value="" className="bg-background text-foreground">ENTIRE SYSTEM</option>
                                <option value="Webcam" className="bg-background text-foreground">Webcam</option>
                                <option value="power cable and adapter" className="bg-background text-foreground">Power Cable and Adapter</option>
                                <option value="Display / Screen" className="bg-background text-foreground">Display / Screen</option>
                                <option value="Keyboard / Trackpad" className="bg-background text-foreground">Keyboard / Trackpad</option>
                                <option value="Battery / Power" className="bg-background text-foreground">Battery / Power</option>
                                <option value="System Chassis" className="bg-background text-foreground">System Chassis</option>
                                <option value="Logic Board / Motherboard" className="bg-background text-foreground">Logic Board / Motherboard</option>
                                <option value="Memory / Storage" className="bg-background text-foreground">Memory / Storage</option>
                                <option value="Peripheral Port" className="bg-background text-foreground">Peripheral Port</option>
                                <option value="Software / OS" className="bg-background text-foreground">Software / OS</option>
                            </InputField>
                        </div>
                    </div>
                )}

                {issueType === 'personal' && (
                    <div className="bg-muted/30 border border-border rounded-[2rem] p-8 animate-in zoom-in-95 duration-300">
                        <InputField label="Asset or Service Description" name="customProduct"
                            required value={customProduct} onChange={(e) => setCustomProduct(e.target.value)}
                            placeholder="e.g. Conference Room A Display, Remote VPN"
                        />
                    </div>
                )}

                {/* Step 2: Investigation Details */}
                <div className="space-y-8">
                    <div className="space-y-1">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Incident Log</h3>
                        <p className="text-sm text-foreground/80">Provide high-fidelity details to assist our engineering team.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <InputField label="Summary" name="title" value={title}
                                    onChange={(e) => setTitle(e.target.value)} required
                                    placeholder="Brief nature of the operational failure"
                                />
                            </div>
                            <InputField label="Operational Priority" name="priority" type="select"
                                defaultValue="MEDIUM"
                            >
                                <option value="LOW" className="bg-background text-foreground">LOW — NON-CRITICAL</option>
                                <option value="MEDIUM" className="bg-background text-foreground">MEDIUM — STANDARD</option>
                                <option value="HIGH" className="bg-background text-foreground">HIGH — URGENT</option>
                            </InputField>
                        </div>


                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">In-Depth Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={6}
                                placeholder="Describe the behavior. Include error codes, timestamps, and symptoms."
                                className="w-full bg-input/50 border border-border rounded-[2rem] p-6 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all resize-none leading-relaxed"
                            />
                        </div>

                        {/* File Upload */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Evidence Uploads</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    name="attachment"
                                    multiple
                                    className="w-full h-14 bg-input/50 border border-border rounded-xl px-4 text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-foreground file:text-background hover:file:bg-foreground/90 transition-all cursor-pointer flex items-center pt-3.5"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-widest">
                                    MAX 5MB / PDF, JPG, PNG
                                </div>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-2 pt-2">
                            <label className="flex items-center gap-3 cursor-pointer group w-max">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        name="notifyAgents"
                                        defaultChecked={true}
                                        className="peer sr-only"
                                    />
                                    <div className="w-5 h-5 rounded border-2 border-border peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                        <svg className="w-3 h-3 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">Notify all agents via email</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Submittal */}
                <div className="pt-12 border-t border-border flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground max-w-sm font-medium italic">
                        Standard response time is 4-6 business hours.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="h-12 px-8 flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Cancel</Link>
                        <button
                            type="submit"
                            disabled={loading || !title || !description}
                            className="h-12 px-10 bg-primary text-primary-foreground text-sm font-bold rounded-full hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-2xl"
                        >
                            {loading ? 'Transmitting...' : 'Send request'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function TypeCard({ active, onClick, disabled, title, Icon, description }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`p-6 rounded-[2rem] border text-left transition-all relative overflow-hidden group ${active ? 'bg-card border-primary text-foreground shadow-2xl ring-1 ring-primary' : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50 hover:border-foreground/20 disabled:opacity-20 disabled:grayscale'}`}
        >
            <div className={`mb-4 transition-transform duration-500 group-hover:scale-125 ${active ? 'scale-110' : ''}`}>
                <Icon className={`w-6 h-6 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`} />
            </div>
            <h4 className="font-bold text-sm tracking-tight mb-2 uppercase">{title}</h4>
            <p className={`text-[11px] leading-relaxed font-medium ${active ? 'text-foreground/80' : 'text-muted-foreground'}`}>{description}</p>
        </button>
    );
}

function InputField({ label, name, type = 'text', value, onChange, placeholder, required, children, defaultValue, disabled }) {
    const baseStyle = "w-full h-11 rounded-xl bg-input/50 border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all";

    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
            {type === 'select' ? (
                <div className="relative">
                    <select
                        name={name} value={value} onChange={onChange} defaultValue={defaultValue} disabled={disabled}
                        className={`${baseStyle} appearance-none cursor-pointer disabled:opacity-30 bg-background`}
                    >
                        {children}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            ) : (
                <input
                    name={name} type={type} value={value} onChange={onChange} required={required}
                    placeholder={placeholder} className={`${baseStyle}`}
                />
            )}
        </div>
    );
}

export default function CreateTicketPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">Initializing Interface...</div>}>
            <CreateTicketForm />
        </Suspense>
    );
}
