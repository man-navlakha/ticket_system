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

    // AI Suggestions
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
                    // If URL param exists, try to find that item
                    if (preSelectedId) {
                        const preItem = data.find(i => i.id === preSelectedId);
                        if (preItem) {
                            setSelectedItem(preItem);
                            setIssueType('inventory');
                            return;
                        }
                    }
                    // Default behavior
                    setSelectedItem(data[0]);
                } else {
                    setIssueType('personal');
                }
            }
        } catch (err) {
            console.error('Failed to fetch inventory:', err);
        }
    }

    // Debounced AI suggestion fetching
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
        }, 1000); // Wait 1 second after user stops typing

        return () => clearTimeout(timer);
    }, [title, description]);

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);

        let attachmentUrls = [];
        const files = formData.getAll('attachment'); // Get all selected files

        // Filter out empty file inputs (if any)
        const validFiles = files.filter(f => f.size > 0);

        if (validFiles.length > 0) {
            try {
                // Upload files in parallel
                const uploadPromises = validFiles.map(async (file) => {
                    const uploadData = new FormData();
                    uploadData.append('file', file);

                    const uploadRes = await fetch('/api/upload', {
                        method: 'POST',
                        body: uploadData,
                    });

                    if (!uploadRes.ok) throw new Error('Failed to upload file');
                    const uploadJson = await uploadRes.json();
                    return uploadJson.url;
                });

                attachmentUrls = await Promise.all(uploadPromises);

            } catch (err) {
                setError('One or more files failed to upload. Please try again.');
                setLoading(false);
                return;
            }
        }

        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
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

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Failed to create ticket');
            }

            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen rounded-xl bg-[#0B0E14] text-white p-6 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <div className="space-y-6">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <span>←</span> Back to Dashboard
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-2">Create Ticket</h1>
                        <p className="text-gray-400 text-lg">We&apos;ll get back to you as soon as possible.</p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl p-8 shadow-sm transition-all">
                    <form onSubmit={onSubmit} className="space-y-8">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        {/* Issue Type Selector */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">What are you reporting?</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIssueType('inventory')}
                                    disabled={inventory.length === 0}
                                    className={`p-6 rounded-xl border text-left transition-all group ${issueType === 'inventory' ? 'bg-white border-white text-black shadow-xl ring-2 ring-white/20' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'}`}
                                >
                                    <span className="block font-bold text-lg mb-1">Company Device</span>
                                    <span className={`text-xs ${issueType === 'inventory' ? 'opacity-80' : 'opacity-50 group-hover:opacity-70'}`}>Laptop, monitor, or hardware assigned to you.</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIssueType('email')}
                                    className={`p-6 rounded-xl border text-left transition-all group ${issueType === 'email' ? 'bg-white border-white text-black shadow-xl ring-2 ring-white/20' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white'}`}
                                >
                                    <span className="block font-bold text-lg mb-1">Email Problem</span>
                                    <span className={`text-xs ${issueType === 'email' ? 'opacity-80' : 'opacity-50 group-hover:opacity-70'}`}>Login, spam, or delivery issues.</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIssueType('personal')}
                                    className={`p-6 rounded-xl border text-left transition-all group ${issueType === 'personal' ? 'bg-white border-white text-black shadow-xl ring-2 ring-white/20' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white'}`}
                                >
                                    <span className="block font-bold text-lg mb-1">Other Issue</span>
                                    <span className={`text-xs ${issueType === 'personal' ? 'opacity-80' : 'opacity-50 group-hover:opacity-70'}`}>Internet, software, or other custom inquiries.</span>
                                </button>
                            </div>
                        </div>

                        {/* Device Selection Context */}
                        {issueType === 'inventory' && inventory.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-black/20 border border-white/5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Select Device</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white transition-all outline-none appearance-none"
                                            value={selectedItem?.id || ''}
                                            onChange={(e) => {
                                                const item = inventory.find(i => i.id === e.target.value);
                                                setSelectedItem(item);
                                                setSelectedComponent('');
                                            }}
                                        >
                                            {inventory.map(item => (
                                                <option key={item.id} value={item.id} className="bg-[#141820] text-white">
                                                    {item.brand} {item.model} ({item.pid})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Affected Component (Optional)</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white transition-all outline-none appearance-none disabled:opacity-30"
                                            value={selectedComponent}
                                            onChange={(e) => setSelectedComponent(e.target.value)}
                                            disabled={!selectedItem?.components?.length}
                                        >
                                            <option value="" className="bg-[#141820] text-white">Whole Device / General</option>
                                            {selectedItem?.components?.map(comp => (
                                                <option key={comp} value={comp} className="bg-[#141820] text-white">{comp}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {issueType === 'personal' && (
                            <div className="space-y-2 p-6 rounded-xl bg-black/20 border border-white/5">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Custom Product / Service Name</label>
                                <input
                                    type="text"
                                    required={issueType === 'personal'}
                                    value={customProduct}
                                    onChange={(e) => setCustomProduct(e.target.value)}
                                    placeholder="e.g. WiFi Router, VPN Connection, Personal Mouse"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-white transition-all outline-none"
                                />
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-2">
                                    <label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-gray-500">Subject</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Short summary of the problem"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-white transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="priority" className="text-xs font-bold uppercase tracking-widest text-gray-500">Priority</label>
                                    <div className="relative">
                                        <select
                                            id="priority"
                                            name="priority"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white transition-all outline-none appearance-none"
                                            defaultValue={aiSuggestions?.priority || "MEDIUM"}
                                            key={aiSuggestions?.priority} // Force re-render when AI suggests
                                        >
                                            <option value="LOW" className="bg-[#141820] text-white">Low</option>
                                            <option value="MEDIUM" className="bg-[#141820] text-white">Medium</option>
                                            <option value="HIGH" className="bg-[#141820] text-white">High</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Suggestions Banner */}
                            {aiSuggestions && !aiLoading && (
                                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-start gap-3">
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                            ✨
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <p className="text-sm font-bold text-purple-400">AI Suggestions</p>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {aiSuggestions.priority && (
                                                    <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                        Priority: {aiSuggestions.priority}
                                                    </span>
                                                )}
                                                {aiSuggestions.categoryName && (
                                                    <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                        Category: {aiSuggestions.categoryName}
                                                    </span>
                                                )}
                                                {aiSuggestions.tagNames && aiSuggestions.tagNames.length > 0 && (
                                                    <>
                                                        {aiSuggestions.tagNames.map(tag => (
                                                            <span key={tag} className="px-2 py-1 rounded-md bg-gray-500/20 text-gray-300 border border-gray-500/30">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {aiLoading && (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                    <span className="text-sm text-gray-400">AI is analyzing your description...</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-gray-500">Detailed Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    required
                                    rows={8}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tell us more about the issue. When did it start? What have you tried?"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-white transition-all outline-none resize-none leading-relaxed"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="attachment" className="text-xs font-bold uppercase tracking-widest text-gray-500">Attachment (Optional)</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        id="attachment"
                                        name="attachment"
                                        accept="image/*,application/pdf"
                                        multiple
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200 transition-all cursor-pointer"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500">Upload screenshots or documents (Max 5MB each)</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-white/5">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : 'Submit Ticket'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function CreateTicketPage() {
    return (
        <Suspense fallback={<div className="text-center py-20 text-gray-500">Loading form...</div>}>
            <CreateTicketForm />
        </Suspense>
    );
}
