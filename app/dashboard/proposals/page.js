
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
        <div className="container mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Proposals</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                    New Proposal
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-6 mb-8 border-b border-gray-800">
                {['all', 'created', 'assigned'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`capitalize pb-3 text-sm font-medium transition-colors relative ${filter === f ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        {f === 'created' ? 'My Proposals' : f === 'assigned' ? 'For Review' : 'All'}
                        {filter === f && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading proposals...</div>
                ) : proposals.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-[#111] rounded-xl border border-gray-800">
                        No proposals found.
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
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-[#0a0a0a] p-6 rounded-xl w-full max-w-lg border border-gray-800 shadow-xl">
                        <h2 className="text-xl font-bold mb-6">Create New Proposal</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Title</label>
                                <input
                                    value={title} onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="Enter proposal title"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
                                <textarea
                                    value={description} onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                                    placeholder="Describe your proposal..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Related Ticket ID (Optional)</label>
                                <input
                                    value={ticketId} onChange={e => setTicketId(e.target.value)}
                                    className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="Enter Ticket ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Linked Asset (Optional)</label>
                                <select
                                    value={selectedInventory} onChange={e => setSelectedInventory(e.target.value)}
                                    className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition appearance-none"
                                >
                                    <option value="" className="text-gray-500">Select an asset</option>
                                    {Array.isArray(inventoryItems) && inventoryItems.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.pid ? `[${item.pid}] ` : ''}{item.type} - {item.brand} {item.model}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Approver</label>
                                <select
                                    value={selectedApprover} onChange={e => setSelectedApprover(e.target.value)}
                                    className="w-full bg-[#111] border border-gray-800 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition appearance-none"
                                    required
                                >
                                    <option value="" className="text-gray-500">Select an approver</option>
                                    {approvers.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.username ? `${u.username} (${u.email})` : u.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Creating...' : 'Create Proposal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition group">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition">{proposal.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border
                            ${proposal.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                proposal.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                            {proposal.status}
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">{proposal.description}</p>

                    {proposal.ticket && (
                        <div className="mb-4 text-xs">
                            <span className="text-gray-500 font-medium">Ticket: </span>
                            <span className="text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded ml-1">
                                {proposal.ticket.title} ({proposal.ticket.status})
                            </span>
                        </div>
                    )}

                    {proposal.inventoryItem && (
                        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs font-medium text-blue-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                            Asset: {proposal.inventoryItem.pid ? `[${proposal.inventoryItem.pid}] ` : ''}{proposal.inventoryItem.type} - {proposal.inventoryItem.brand} {proposal.inventoryItem.model}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-medium">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>From: <span className="text-gray-300">{proposal.createdBy?.username || proposal.createdBy?.email || 'Unknown'}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>To: <span className="text-gray-300">{proposal.approver?.username || proposal.approver?.email || 'Unknown'}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {proposal.status === 'PENDING' && canAction && (
                    <div className="flex gap-2 self-start md:self-center shrink-0">
                        <button
                            onClick={() => handleStatus('APPROVED')}
                            disabled={processing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition border border-green-500/20 text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Approve
                        </button>
                        <button
                            onClick={() => handleStatus('REJECTED')}
                            disabled={processing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition border border-red-500/20 text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            Reject
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
