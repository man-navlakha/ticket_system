'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TeamClient({ user }) {
    const [activeTab, setActiveTab] = useState('members');
    const [users, setUsers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('USER');
    const [feedback, setFeedback] = useState({ type: '', msg: '' });
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        if (activeTab === 'members') fetchUsers();
        if (activeTab === 'requests') fetchRequests();
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) setUsers(await res.json());
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/access-requests');
            if (res.ok) setRequests(await res.json());
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFeedback({ type: '', msg: '' });

        try {
            const emails = inviteEmail.split(',').map(e => e.trim()).filter(Boolean);
            const endpoint = emails.length > 1 ? '/api/admin/bulk-invite' : '/api/admin/invite';
            const body = emails.length > 1 ? { emails, role: inviteRole } : { email: emails[0], role: inviteRole };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (res.ok) {
                setFeedback({ type: 'success', msg: `Invitation${emails.length > 1 ? 's' : ''} sent successfully.` });
                setInviteEmail('');
            } else {
                setFeedback({ type: 'error', msg: data.error || 'Failed to send invite.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action, type) => {
        if (!confirm('Are you sure?')) return;
        setLoading(true);
        try {
            let res;
            if (type === 'user-delete') {
                res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            } else if (type === 'request') {
                res = await fetch(`/api/users/access-requests/${id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action })
                });
            }

            if (res.ok) {
                if (type === 'user-delete') setUsers(users.filter(u => u.id !== id));
                if (type === 'request') fetchRequests();
                setFeedback({ type: 'success', msg: 'Operation executed.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const query = search.toLowerCase().trim();
        const matchesSearch = !query ||
            u.username?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query);

        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-widest">
                    <Link href="/dashboard" className="hover:text-white transition-colors">Settings</Link>
                    <span>/</span>
                    <span className="text-white">Team Management</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Team</h1>
                        <p className="text-lg text-gray-400 max-w-2xl leading-relaxed"> Orchestrate enterprise access, roles, and administrative governance. </p>
                    </div>
                    {feedback.msg && (
                        <div className={`h-12 flex items-center px-6 rounded-full text-xs font-bold uppercase tracking-widest border transition-all animate-in slide-in-from-right-4 ${feedback.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {feedback.msg}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-white/5 h-12">
                <TabLink active={activeTab === 'members'} onClick={() => setActiveTab('members')}>Fleet Members</TabLink>
                <TabLink active={activeTab === 'invite'} onClick={() => setActiveTab('invite')}>Provision Access</TabLink>
                <TabLink active={activeTab === 'requests'} onClick={() => setActiveTab('requests')}>
                    Entrance Requests
                    {requests.length > 0 && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-blue-500 text-[8px] text-white animate-pulse">{requests.length}</span>}
                </TabLink>
            </div>

            {/* Dynamic Views */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {activeTab === 'members' && (
                    <div className="space-y-8">
                        <div className="flex flex-col gap-4">
                            <div className="relative group max-w-md">
                                <input
                                    type="text"
                                    placeholder="Filter by username or email sequence..."
                                    className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-white/20 transition-all font-medium [color-scheme:dark]"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-20">🔍</div>
                            </div>

                            {(search || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Filters:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {search && <FilterTag label={`Scope: ${search}`} onClear={() => setSearch('')} />}
                                        {roleFilter !== 'ALL' && <FilterTag label={`Role: ${roleFilter}`} onClear={() => setRoleFilter('ALL')} />}
                                        {statusFilter !== 'ALL' && <FilterTag label={`Status: ${statusFilter}`} onClear={() => setStatusFilter('ALL')} />}
                                    </div>
                                    <button
                                        onClick={() => { setSearch(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}
                                        className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">Operational Identity</th>
                                        <th className="px-8 py-4">
                                            <HeaderFilter
                                                label="Authority Role"
                                                value={roleFilter}
                                                onChange={setRoleFilter}
                                                options={['ADMIN', 'AGENT', 'USER']}
                                            />
                                        </th>
                                        <th className="px-8 py-4">
                                            <HeaderFilter
                                                label="Operational Status"
                                                value={statusFilter}
                                                onChange={setStatusFilter}
                                                options={['ACTIVE', 'INACTIVE', 'PENDING']}
                                            />
                                        </th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-600 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredUsers.length === 0 ? (
                                        <tr><td colSpan="4" className="p-12 text-center text-[10px] font-bold text-gray-700 uppercase tracking-widest italic">No matching records synchronization.</td></tr>
                                    ) : (
                                        filteredUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-500 transition-transform group-hover:scale-110">
                                                            {u.username?.[0]?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white tracking-tight">{u.username}</p>
                                                            <p className="text-[10px] text-gray-600 font-mono">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6"><RoleBadge role={u.role} /></td>
                                                <td className="px-8 py-6"><StatusIndicator status={u.status} /></td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => handleAction(u.id, null, 'user-delete')}
                                                        className="h-8 px-4 rounded-lg bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest border border-red-500/10 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                                    >
                                                        Revoke
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'invite' && (
                    <div className="max-w-2xl mx-auto py-12">
                        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-10 space-y-10 shadow-3xl">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold text-white tracking-tight">Provision Access</h2>
                                <p className="text-sm text-gray-600 font-medium">Issue cryptographic invitations to new operational units.</p>
                            </div>

                            <form onSubmit={handleInvite} className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Communication Sequences (Email)</label>
                                    <textarea
                                        placeholder="unit-01@intel.com, unit-02@intel.com"
                                        className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-gray-800 focus:outline-none focus:border-white/20 transition-all h-24 leading-relaxed font-mono [color-scheme:dark]"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        required
                                    />
                                    <p className="text-[9px] font-bold text-gray-700 uppercase tracking-widest italic">Delimit multiple identifiers with a comma token.</p>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Authority Blueprint</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { id: 'USER', label: 'OPERATIVE', desc: 'Standard read/write clearance.' },
                                            { id: 'AGENT', label: 'RESOLVER', desc: 'Enhanced triage & execution.' },
                                            { id: 'ADMIN', label: 'ARCHITECT', desc: 'Full infrastructure control.' }
                                        ].map(r => (
                                            <button
                                                key={r.id} type="button"
                                                onClick={() => setInviteRole(r.id)}
                                                className={`p-5 text-left rounded-2xl border transition-all flex flex-col gap-2 ${inviteRole === r.id ? 'bg-white border-white text-black shadow-xl' : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'}`}
                                            >
                                                <span className="font-black text-[10px] uppercase tracking-widest">{r.label}</span>
                                                <span className={`text-[9px] font-medium leading-tight ${inviteRole === r.id ? 'text-gray-700' : 'text-gray-600'}`}>{r.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !inviteEmail}
                                    className="w-full h-14 bg-white text-black rounded-full text-xs font-black uppercase tracking-[0.3em] hover:bg-gray-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-2xl disabled:opacity-50"
                                >
                                    {loading ? 'TRANSMITTING...' : 'DISPATCH INVITATIONS'}
                                    <span className="opacity-40">→</span>
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="border-b border-white/5 bg-white/[0.02]">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">Requester Core</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">Department Link</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">Current Status</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-600 uppercase tracking-widest text-right">Administrative Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {requests.length === 0 ? (
                                    <tr><td colSpan="4" className="p-12 text-center text-[10px] font-bold text-gray-700 uppercase tracking-widest italic">No pending entrance requests detected.</td></tr>
                                ) : (
                                    requests.map(req => (
                                        <tr key={req.id} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-bold text-white tracking-tight">{req.name}</p>
                                                <p className="text-[10px] text-gray-600 font-mono uppercase tracking-tighter">{req.email}</p>
                                            </td>
                                            <td className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{req.department}</td>
                                            <td className="px-8 py-6"><StatusIndicator status={req.status} /></td>
                                            <td className="px-8 py-6 text-right">
                                                {req.status === 'PENDING' && (
                                                    <div className="flex justify-end gap-3">
                                                        <ActionBtn label="GRANT" color="green" onClick={() => handleAction(req.id, 'APPROVE', 'request')} />
                                                        <ActionBtn label="DENY" color="red" onClick={() => handleAction(req.id, 'REJECT', 'request')} />
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function TabLink({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`h-full px-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative group ${active ? 'text-white' : 'text-gray-700 hover:text-gray-400'}`}
        >
            {children}
            {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />}
        </button>
    );
}

function RoleBadge({ role }) {
    const styles = {
        ADMIN: 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]',
        AGENT: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        USER: 'bg-white/5 text-gray-500 border-white/10'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${styles[role] || styles.USER}`}>
            {role}
        </span>
    );
}

function StatusIndicator({ status }) {
    const active = status === 'ACTIVE' || status === 'APPROVED';
    return (
        <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : status === 'PENDING' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-green-500' : status === 'PENDING' ? 'text-amber-500' : 'text-red-500'}`}>{status}</span>
        </div>
    );
}

function ActionBtn({ label, color, onClick }) {
    const colors = {
        green: 'bg-green-500/10 text-green-500 hover:bg-green-500 border-green-500/20',
        red: 'bg-red-500/10 text-red-500 hover:bg-red-500 border-red-500/20'
    };
    return (
        <button onClick={onClick} className={`h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all hover:text-white active:scale-95 ${colors[color]}`}>
            {label}
        </button>
    );
}
function HeaderFilter({ label, value, onChange, options }) {
    return (
        <div className="relative group/filter flex items-center gap-2">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-transparent pr-4 text-[10px] font-black text-gray-600 uppercase tracking-widest focus:outline-none cursor-pointer hover:text-white transition-colors"
                title={`Filter by ${label}`}
            >
                <option value="ALL" className="bg-black text-white">{label}</option>
                {options.map(opt => (
                    <option key={opt} value={opt} className="bg-black text-white">{opt}</option>
                ))}
            </select>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-700 group-hover/filter:text-white transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            {value !== 'ALL' && (
                <div className="absolute -top-1.5 -right-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
            )}
        </div>
    );
}

function FilterTag({ label, onClear }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest text-gray-400">
            <span>{label}</span>
            <button onClick={onClear} className="hover:text-white transition-colors">✕</button>
        </div>
    );
}
