'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProposalsPage() {
    const [proposals, setProposals] = useState([]);
    const [approvers, setApprovers] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedApprover, setSelectedApprover] = useState('');
    const [selectedInventory, setSelectedInventory] = useState('');
    const [ticketId, setTicketId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [filter, setFilter] = useState('all');

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
            const res = await fetch('/api/auth/me');
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
            const res = await fetch('/api/inventory');
            const data = await res.json();
            if (res.ok) setInventoryItems(data.items || data);
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
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-widest">
                    <Link href="/dashboard" className="hover:text-white transition-colors">Workspace</Link>
                    <span>/</span>
                    <span className="text-white">Proposals</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Proposals</h1>
                        <p className="text-lg text-gray-400 max-w-2xl leading-relaxed"> Manage asset acquisitions and support escalations that require executive override. </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-12 px-8 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-all active:scale-95 shadow-2xl whitespace-nowrap"
                    >
                        + New Proposal
                    </button>
                </div>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2">
                {[
                    { id: 'all', label: 'All Activity' },
                    { id: 'created', label: 'My Proposals' },
                    { id: 'assigned', label: 'Needs Review' }
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f.id ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white border border-white/10'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin opacity-20" />
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Synchronizing Flux...</p>
                    </div>
                ) : proposals.length === 0 ? (
                    <div className="h-64 rounded-[2rem] border border-dashed border-white/5 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="text-3xl opacity-20">📝</div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Active Records</h3>
                            <p className="text-xs text-gray-600">Proposals will appear here once submitted or assigned.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {proposals.map(proposal => (
                            <ProposalCard
                                key={proposal.id}
                                proposal={proposal}
                                currentUser={currentUser}
                                refresh={fetchProposals}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#0B0E14] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-2xl shadow-3xl overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                            <h2 className="text-2xl font-bold text-white tracking-tight">New Proposal</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-8">
                            <InputField label="Abstract Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="High-level summary" required />
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Detailed Rationale</label>
                                <textarea
                                    value={description} onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm text-white h-32 focus:outline-none focus:border-white/20 transition-all resize-none leading-relaxed [color-scheme:dark]"
                                    placeholder="Explain why this proposal is necessary..."
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InputField label="Linked Ticket (Optional)" value={ticketId} onChange={e => setTicketId(e.target.value)} placeholder="TICKET-UUID" />
                                <InputField label="Associated Asset" type="select" value={selectedInventory} onChange={e => setSelectedInventory(e.target.value)}>
                                    <option value="">SELECT ASSET...</option>
                                    {Array.isArray(inventoryItems) && inventoryItems.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.pid ? `[${item.pid}] ` : ''}{item.brand} {item.model}
                                        </option>
                                    ))}
                                </InputField>
                            </div>
                            <InputField label="Decision Approver" type="select" required value={selectedApprover} onChange={e => setSelectedApprover(e.target.value)}>
                                <option value="">SELECT AUTHORITY...</option>
                                {approvers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.username || u.email}
                                    </option>
                                ))}
                            </InputField>
                            <div className="flex justify-end gap-4 pt-8 border-t border-white/5">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="h-12 px-8 text-xs font-bold text-gray-500 hover:text-white transition-colors">ABORT</button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="h-12 px-12 bg-white text-black rounded-full font-bold text-xs hover:bg-gray-200 transition-all active:scale-95 shadow-xl disabled:opacity-50"
                                >
                                    {submitting ? 'COMMITTING...' : 'TRANSMIT PROPOSAL'}
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
        if (!confirm(`Confirm ${status.toLowerCase()} of action?`)) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/proposals/${proposal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) refresh();
        } finally {
            setProcessing(false);
        }
    };

    const isApprover = currentUser?.id === proposal.approverId;
    const canAction = isApprover || currentUser?.role === 'ADMIN';

    return (
        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
                <StatusBadge status={proposal.status} />
            </div>

            <div className="space-y-6">
                <div className="space-y-2 pr-24">
                    <h3 className="text-2xl font-bold text-white tracking-tight group-hover:underline decoration-white/20 underline-offset-8">{proposal.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">{proposal.description}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {proposal.ticket && <MetaTag label="TICKET" value={proposal.ticket.title} />}
                    {proposal.inventoryItem && <MetaTag label="ASSET" value={`${proposal.inventoryItem.brand} ${proposal.inventoryItem.model}`} color="blue" />}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-6">
                        <Actor label="requester" user={proposal.createdBy} />
                        <Actor label="authority" user={proposal.approver} color="blue" />
                    </div>

                    {proposal.status === 'PENDING' && canAction ? (
                        <div className="flex gap-2">
                            <ActionButton label="APPROVE" color="green" onClick={() => handleStatus('APPROVED')} disabled={processing} />
                            <ActionButton label="DENY" color="red" onClick={() => handleStatus('REJECTED')} disabled={processing} />
                        </div>
                    ) : (
                        <span className="text-[10px] font-bold text-gray-800 uppercase tracking-[0.3em] font-mono">
                            {new Date(proposal.createdAt).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        APPROVED: 'bg-green-500/10 text-green-500 border-green-500/20',
        REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${styles[status]}`}>
            {status}
        </span>
    );
}

function MetaTag({ label, value, color = 'gray' }) {
    const colors = {
        gray: 'bg-white/5 border-white/10 text-gray-400',
        blue: 'bg-blue-500/5 border-blue-500/20 text-blue-400'
    };
    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-bold ${colors[color]}`}>
            <span className="opacity-50 tracking-widest">{label}</span>
            <span className="text-white tracking-tight">{value}</span>
        </div>
    );
}

function Actor({ label, user, color = 'gray' }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold uppercase border ${color === 'blue' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                {user?.username?.[0] || '?'}
            </div>
            <div>
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{label}</p>
                <p className="text-xs font-bold text-white">{user?.username || 'Unknown'}</p>
            </div>
        </div>
    );
}

function ActionButton({ label, color, onClick, disabled }) {
    const styles = {
        green: 'bg-green-500/10 text-green-500 border-green-500/10 hover:bg-green-500 hover:text-white',
        red: 'bg-red-500/10 text-red-500 border-red-500/10 hover:bg-red-500 hover:text-white'
    };
    return (
        <button
            onClick={onClick} disabled={disabled}
            className={`px-4 h-9 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 ${styles[color]}`}
        >
            {label}
        </button>
    );
}

function InputField({ label, name, type = 'text', value, onChange, placeholder, required, children }) {
    const baseStyle = "w-full h-12 rounded-2xl bg-white/[0.03] border border-white/5 px-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all [color-scheme:dark]";
    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest">{label}</label>
            {type === 'select' ? (
                <div className="relative">
                    <select name={name} value={value} onChange={onChange} className={`${baseStyle} appearance-none cursor-pointer pr-10`}>
                        {children}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            ) : (
                <input name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} className={baseStyle} />
            )}
        </div>
    );
}
