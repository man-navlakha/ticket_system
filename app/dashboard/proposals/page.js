'use client';

import { useState, useEffect } from 'react';

export default function ProposalsPage() {
    const [proposals, setProposals] = useState([]);
    const [approvers, setApprovers] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedApprover, setSelectedApprover] = useState('');
    const [selectedInventory, setSelectedInventory] = useState('');
    const [ticketId, setTicketId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Filter
    const [filter, setFilter] = useState('all'); // all, created, assigned

    useEffect(() => {
        fetchCurrentUser();
        fetchApprovers();
        fetchInventory();
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchProposals();
        }
    }, [currentUser, filter]);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('/api/auth/me'); // Assuming this endpoint returns { user: ... }
            const data = await res.json();
            if (res.ok) setCurrentUser(data.user);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchProposals = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/proposals?filter=${filter}`);
            const data = await res.json();
            if (res.ok) setProposals(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchApprovers = async () => {
        try {
            const res = await fetch('/api/users/approvers');
            const data = await res.json();
            if (res.ok) setApprovers(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchInventory = async () => {
        try {
            const res = await fetch('/api/inventory'); // Assuming this endpoint exists and returns items
            const data = await res.json();
            if (res.ok) setInventoryItems(data.items || data); // Handle array or paginated response
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/proposals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    approverId: selectedApprover,
                    inventoryItemId: selectedInventory,
                    ticketId: ticketId || null
                })
            });
            if (res.ok) {
                setIsCreateModalOpen(false);
                setTitle('');
                setDescription('');
                setSelectedApprover('');
                setSelectedInventory('');
                setTicketId('');
                fetchProposals();
            } else {
                alert('Failed to create proposal');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating proposal');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen rounded-xl bg-[#0B0E14] text-white p-6 md:p-12 font-sans">
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-2">Proposals</h1>
                        <p className="text-gray-400 text-lg">Manage approvals, requests, and decision tracking.</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap"
                    >
                        + New Proposal
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {['all', 'created', 'assigned'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-white text-black shadow-lg' : 'bg-[#141820] text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            {f === 'created' ? 'My Proposals' : f === 'assigned' ? 'For Review' : 'All'}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="grid gap-6">
                    {loading ? (
                        <div className="text-center py-24">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                            <p className="text-gray-500 font-medium">Loading proposals...</p>
                        </div>
                    ) : proposals.length === 0 ? (
                        <div className="text-center py-24 bg-[#141820] rounded-3xl border border-white/5">
                            <div className="text-4xl mb-4 opacity-20">📝</div>
                            <h3 className="text-xl font-bold text-white mb-2">No proposals found</h3>
                            <p className="text-gray-400">Create a new proposal to get started.</p>
                        </div>
                    ) : (
                        proposals.map(proposal => (
                            <ProposalCard
                                key={proposal.id}
                                proposal={proposal}
                                currentUser={currentUser}
                                refresh={fetchProposals}
                            />
                        ))
                    )}
                </div>

                {/* Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-[#141820] border border-white/10 p-8 rounded-2xl w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]">
                            <h2 className="text-2xl font-light text-white mb-8">Create New Proposal</h2>
                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Title</label>
                                    <input
                                        value={title} onChange={e => setTitle(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                                        placeholder="Enter proposal title"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Description</label>
                                    <textarea
                                        value={description} onChange={e => setDescription(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white h-32 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all resize-none"
                                        placeholder="Describe your proposal..."
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Related Ticket ID (Optional)</label>
                                        <input
                                            value={ticketId} onChange={e => setTicketId(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                                            placeholder="Enter Ticket ID"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Linked Asset (Optional)</label>
                                        <div className="relative">
                                            <select
                                                value={selectedInventory} onChange={e => setSelectedInventory(e.target.value)}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all appearance-none"
                                            >
                                                <option value="" className="bg-[#141820] text-gray-500">Select an asset</option>
                                                {Array.isArray(inventoryItems) && inventoryItems.map(item => (
                                                    <option key={item.id} value={item.id} className="bg-[#141820]">
                                                        {item.pid ? `[${item.pid}] ` : ''}{item.type} - {item.brand} {item.model}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Approver</label>
                                    <div className="relative">
                                        <select
                                            value={selectedApprover} onChange={e => setSelectedApprover(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all appearance-none"
                                            required
                                        >
                                            <option value="" className="bg-[#141820] text-gray-500">Select an approver</option>
                                            {approvers.map(u => (
                                                <option key={u.id} value={u.id} className="bg-[#141820]">
                                                    {u.username ? `${u.username} (${u.email})` : u.email}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-6 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-8 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-200 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100"
                                    >
                                        {submitting ? 'Creating...' : 'Create Proposal'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ProposalCard({ proposal, currentUser, refresh }) {
    const [processing, setProcessing] = useState(false);

    const handleStatus = async (status) => {
        if (!confirm(`Are you sure you want to ${status.toLowerCase()} this proposal?`)) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/proposals/${proposal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                refresh();
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating status');
        } finally {
            setProcessing(false);
        }
    };

    const isApprover = currentUser?.id === proposal.approverId;
    const canAction = isApprover || currentUser?.role === 'ADMIN';

    return (
        <div className="bg-[#141820] p-8 rounded-2xl border border-transparent hover:border-white/5 transition-all shadow-sm group">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">{proposal.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                            ${proposal.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                proposal.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                            {proposal.status}
                        </span>
                    </div>

                    <p className="text-gray-400 text-sm leading-relaxed max-w-3xl">{proposal.description}</p>

                    <div className="flex flex-wrap gap-3">
                        {proposal.ticket && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
                                <span className="text-gray-500 font-bold uppercase tracking-wider">Ref Ticket</span>
                                <span className="text-white">{proposal.ticket.title}</span>
                            </div>
                        )}

                        {proposal.inventoryItem && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                                {proposal.inventoryItem.pid ? `[${proposal.inventoryItem.pid}] ` : ''}{proposal.inventoryItem.type} - {proposal.inventoryItem.brand} {proposal.inventoryItem.model}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-6 pt-4 text-xs font-medium text-gray-500 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-[10px]">
                                {proposal.createdBy?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span>From <span className="text-white ml-1">{proposal.createdBy?.username || proposal.createdBy?.email || 'Unknown'}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                                {proposal.approver?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span>To <span className="text-white ml-1">{proposal.approver?.username || proposal.approver?.email || 'Unknown'}</span></span>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="uppercase tracking-wider opacity-70">{new Date(proposal.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {proposal.status === 'PENDING' && canAction && (
                    <div className="flex flex-col gap-3 self-start md:self-center shrink-0 min-w-[140px]">
                        <button
                            onClick={() => handleStatus('APPROVED')}
                            disabled={processing}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl transition-all border border-green-500/20 text-xs font-bold uppercase tracking-wider w-full hover:scale-105 active:scale-95"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => handleStatus('REJECTED')}
                            disabled={processing}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20 text-xs font-bold uppercase tracking-wider w-full hover:scale-105 active:scale-95"
                        >
                            Reject
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
