'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
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

    useEffect(() => {
        if (!title || !description || description.length < 10) {
            setAiSuggestions(null);
            return;
        }

        const timer = setTimeout(async () => {
            setAiLoading(true);
            try {
                const res = await fetch('/api/ai/triage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description }),
                });

                if (res.ok) {
                    const data = await res.json();
                    setAiSuggestions(data);
                }
            } catch (error) {
                console.error('AI triage failed:', error);
            } finally {
                setAiLoading(false);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [title, description]);

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        let attachmentUrls = [];
        const files = formData.getAll('attachment').filter(f => f.size > 0);

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
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-widest">
                    <Link href="/dashboard" className="hover:text-white transition-colors">Workspace</Link>
                    <span>/</span>
                    <span className="text-white">New Request</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Create Ticket</h1>
                        <p className="text-lg text-gray-400 max-w-2xl leading-relaxed"> Submit a support claim. AI will triage your request for faster resolution. </p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="max-w-4xl space-y-16 pb-24">
                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Step 1: Issue Classification */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em]">Classification</h3>
                        <p className="text-sm text-gray-600">Identify the nature of your technical challenge.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <TypeCard
                            active={issueType === 'inventory'}
                            onClick={() => setIssueType('inventory')}
                            disabled={inventory.length === 0}
                            title="Hardware Fleet"
                            icon="💻"
                            description="Issues with laptops, monitors, or peripherals."
                        />
                        <TypeCard
                            active={issueType === 'email'}
                            onClick={() => setIssueType('email')}
                            title="Cloud & SaaS"
                            icon="☁️"
                            description="Email, VPN, or software access issues."
                        />
                        <TypeCard
                            active={issueType === 'personal'}
                            onClick={() => setIssueType('personal')}
                            title="Infrastructure"
                            icon="🔌"
                            description="Networking, physical access, or custom needs."
                        />
                    </div>
                </div>

                {/* Device Selection Overlay */}
                {issueType === 'inventory' && inventory.length > 0 && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 space-y-8 animate-in zoom-in-95 duration-300">
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
                                    <option key={item.id} value={item.id} className="bg-black text-white">
                                        {item.brand} {item.model} — {item.pid}
                                    </option>
                                ))}
                            </InputField>
                            <InputField label="Asset Sub-component" name="componentName" type="select"
                                value={selectedComponent}
                                onChange={(e) => setSelectedComponent(e.target.value)}
                            >
                                <option value="" className="bg-black text-white">ENTIRE SYSTEM</option>
                                <option value="Display / Screen" className="bg-black text-white">Display / Screen</option>
                                <option value="Keyboard / Trackpad" className="bg-black text-white">Keyboard / Trackpad</option>
                                <option value="Battery / Power" className="bg-black text-white">Battery / Power</option>
                                <option value="System Chassis" className="bg-black text-white">System Chassis</option>
                                <option value="Logic Board / Motherboard" className="bg-black text-white">Logic Board / Motherboard</option>
                                <option value="Memory / Storage" className="bg-black text-white">Memory / Storage</option>
                                <option value="Peripheral Port" className="bg-black text-white">Peripheral Port</option>
                                <option value="Software / OS" className="bg-black text-white">Software / OS</option>
                            </InputField>
                        </div>
                    </div>
                )}

                {issueType === 'personal' && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 animate-in zoom-in-95 duration-300">
                        <InputField label="Asset or Service Description" name="customProduct"
                            required value={customProduct} onChange={(e) => setCustomProduct(e.target.value)}
                            placeholder="e.g. Conference Room A Display, Remote VPN"
                        />
                    </div>
                )}

                {/* Step 2: Investigation Details */}
                <div className="space-y-8">
                    <div className="space-y-1">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em]">Incident Log</h3>
                        <p className="text-sm text-gray-600">Provide high-fidelity details to assist our engineering team.</p>
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
                                defaultValue={aiSuggestions?.priority || "MEDIUM"}
                                key={aiSuggestions?.priority}
                            >
                                <option value="LOW" className="bg-black text-white">LOW — NON-CRITICAL</option>
                                <option value="MEDIUM" className="bg-black text-white">MEDIUM — STANDARD</option>
                                <option value="HIGH" className="bg-black text-white">HIGH — URGENT</option>
                                <option value="URGENT" className="bg-black text-white">URGENT — BLOCKING</option>
                            </InputField>
                        </div>

                        {/* Smart AI Indicator */}
                        {(aiLoading || aiSuggestions) && (
                            <div className={`p-4 rounded-xl border transition-all duration-500 flex items-center gap-4 ${aiLoading ? 'bg-white/[0.02] border-white/5' : 'bg-blue-500/5 border-blue-500/20'}`}>
                                <div className="relative">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${aiLoading ? 'bg-white/5 text-gray-500 animate-pulse' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {aiLoading ? '⌛' : '✨'}
                                    </div>
                                    {!aiLoading && <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-40 animate-pulse" />}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                                        {aiLoading ? 'AI ANALYZING FLUID TELEMETRY...' : 'PREDICTIVE TRIAGE ACTIVE'}
                                    </p>
                                    {!aiLoading && aiSuggestions && (
                                        <div className="flex gap-2 text-[9px] font-bold uppercase tracking-tight text-blue-400/60">
                                            <span>CLASS: {aiSuggestions.categoryName || 'GENERAL'}</span>
                                            <span>•</span>
                                            <span>TAGS: {aiSuggestions.tagNames?.join(', ') || 'NONE'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">In-Depth Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={6}
                                placeholder="Describe the behavior. Include error codes, timestamps, and symptoms."
                                className="w-full bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 text-sm text-white placeholder:text-gray-800 focus:outline-none focus:border-white/20 transition-all resize-none leading-relaxed [color-scheme:dark]"
                            />
                        </div>

                        {/* File Upload */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Evidence Uploads</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    name="attachment"
                                    multiple
                                    className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-white file:text-black hover:file:bg-gray-200 transition-all cursor-pointer flex items-center pt-3.5 [color-scheme:dark]"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-bold text-gray-700 group-hover:text-gray-500 transition-colors uppercase tracking-widest">
                                    MAX 5MB / PDF, JPG, PNG
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submittal */}
                <div className="pt-12 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[11px] text-gray-600 max-w-sm font-medium italic">
                        Claims are prioritized by impact and AI categorization. Standard response time is 4-6 business hours.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="h-12 px-8 flex items-center text-sm font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest">Abandon</Link>
                        <button
                            type="submit"
                            disabled={loading || !title || !description}
                            className="h-12 px-10 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 shadow-2xl"
                        >
                            {loading ? 'Transmitting...' : 'Initialize Resolution'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function TypeCard({ active, onClick, disabled, title, icon, description }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`p-6 rounded-[2rem] border text-left transition-all relative overflow-hidden group ${active ? 'bg-white border-white text-black shadow-2xl' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/[0.05] hover:border-white/10 disabled:opacity-20 disabled:grayscale'}`}
        >
            <div className={`text-2xl mb-4 transition-transform duration-500 group-hover:scale-125 ${active ? 'scale-110' : ''}`}>{icon}</div>
            <h4 className="font-bold text-sm tracking-tight mb-2 uppercase">{title}</h4>
            <p className={`text-[11px] leading-relaxed font-medium ${active ? 'text-gray-700' : 'text-gray-600'}`}>{description}</p>
        </button>
    );
}

function InputField({ label, name, type = 'text', value, onChange, placeholder, required, children, defaultValue, disabled }) {
    const baseStyle = "w-full h-11 rounded-xl bg-white/[0.03] border border-white/10 px-4 text-sm text-white placeholder:text-gray-800 focus:outline-none focus:border-white/30 transition-all [color-scheme:dark]";

    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
            {type === 'select' ? (
                <div className="relative">
                    <select
                        name={name} value={value} onChange={onChange} defaultValue={defaultValue} disabled={disabled}
                        className={`${baseStyle} appearance-none cursor-pointer disabled:opacity-30 bg-black`}
                    >
                        {children}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            ) : (
                <input
                    name={name} type={type} value={value} onChange={onChange} required={required}
                    placeholder={placeholder} className={`${baseStyle} bg-black/40`}
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
