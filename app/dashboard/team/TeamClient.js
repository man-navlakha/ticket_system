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
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">Settings</Link>
                    <span>/</span>
                    <span className="text-foreground">Team Management</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Team</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed"> Orchestrate enterprise access, roles, and administrative governance. </p>
                    </div>
                    {feedback.msg && (
                        <div className={`h-12 flex items-center px-6 rounded-full text-xs font-bold uppercase tracking-widest border transition-all animate-in slide-in-from-right-4 ${feedback.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {feedback.msg}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-border h-12">
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
                                    className="w-full h-11 bg-input/50 border border-input rounded-xl px-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-all font-medium"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-50 text-muted-foreground">🔍</div>
                            </div>

                            {(search || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Filters:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {search && <FilterTag label={`Scope: ${search}`} onClear={() => setSearch('')} />}
                                        {roleFilter !== 'ALL' && <FilterTag label={`Role: ${roleFilter}`} onClear={() => setRoleFilter('ALL')} />}
                                        {statusFilter !== 'ALL' && <FilterTag label={`Status: ${statusFilter}`} onClear={() => setStatusFilter('ALL')} />}
                                    </div>
                                    <button
                                        onClick={() => { setSearch(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}
                                        className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest transition-colors"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="rounded-[2rem] border border-border bg-card overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Operational Identity</th>
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
                                        <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredUsers.length === 0 ? (
                                        <tr><td colSpan="4" className="p-12 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">No matching records synchronization.</td></tr>
                                    ) : (
                                        filteredUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-muted/20 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground transition-transform group-hover:scale-110">
                                                            {u.username?.[0]?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-foreground tracking-tight">{u.username}</p>
                                                            <p className="text-[10px] text-muted-foreground font-mono">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6"><RoleBadge role={u.role} /></td>
                                                <td className="px-8 py-6"><StatusIndicator status={u.status} /></td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => handleAction(u.id, null, 'user-delete')}
                                                        className="h-8 px-4 rounded-lg bg-destructive/10 text-destructive text-[9px] font-black uppercase tracking-widest border border-destructive/10 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all active:scale-95"
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
                        <div className="rounded-[2.5rem] border border-border bg-card p-10 space-y-10 shadow-sm">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold text-foreground tracking-tight">Provision Access</h2>
                                <p className="text-sm text-muted-foreground font-medium">Issue cryptographic invitations to new operational units.</p>
                            </div>

                            <form onSubmit={handleInvite} className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Communication Sequences (Email)</label>
                                    <textarea
                                        placeholder="unit-01@intel.com, unit-02@intel.com"
                                        className="w-full bg-input/50 border border-input rounded-2xl p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-all h-24 leading-relaxed font-mono"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        required
                                    />
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">Delimit multiple identifiers with a comma token.</p>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Authority Blueprint</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { id: 'USER', label: 'OPERATIVE', desc: 'Standard read/write clearance.' },
                                            { id: 'AGENT', label: 'RESOLVER', desc: 'Enhanced triage & execution.' },
                                            { id: 'ADMIN', label: 'ARCHITECT', desc: 'Full infrastructure control.' }
                                        ].map(r => (
                                            <button
                                                key={r.id} type="button"
                                                onClick={() => setInviteRole(r.id)}
                                                className={`p-5 text-left rounded-2xl border transition-all flex flex-col gap-2 ${inviteRole === r.id ? 'bg-primary text-primary-foreground shadow-xl border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}
                                            >
                                                <span className="font-black text-[10px] uppercase tracking-widest">{r.label}</span>
                                                <span className={`text-[9px] font-medium leading-tight ${inviteRole === r.id ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>{r.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !inviteEmail}
                                    className="w-full h-14 bg-primary text-primary-foreground rounded-full text-xs font-black uppercase tracking-[0.3em] hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-xl disabled:opacity-50"
                                >
                                    {loading ? 'TRANSMITTING...' : 'DISPATCH INVITATIONS'}
                                    <span className="opacity-40">→</span>
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="rounded-[2rem] border border-border bg-card overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Requester Core</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Department Link</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Status</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Administrative Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {requests.length === 0 ? (
                                    <tr><td colSpan="4" className="p-12 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">No pending entrance requests detected.</td></tr>
                                ) : (
                                    requests.map(req => (
                                        <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-bold text-foreground tracking-tight">{req.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">{req.email}</p>
                                            </td>
                                            <td className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{req.department}</td>
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
            className={`h-full px-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative group ${active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
            {children}
            {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground shadow-[0_0_12px_rgba(255,255,255,0.8)]" />}
        </button>
    );
}

function RoleBadge({ role }) {
    const styles = {
        ADMIN: 'bg-primary text-primary-foreground border-primary shadow-sm',
        AGENT: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        USER: 'bg-muted/50 text-muted-foreground border-border'
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
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : status === 'PENDING' ? 'bg-amber-500 animate-pulse' : 'bg-destructive'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-green-500' : status === 'PENDING' ? 'text-amber-500' : 'text-destructive'}`}>{status}</span>
        </div>
    );
}

function ActionBtn({ label, color, onClick }) {
    const colors = {
        green: 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border-green-500/20',
        red: 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border-destructive/20'
    };
    return (
        <button onClick={onClick} className={`h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${colors[color]}`}>
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
                className="appearance-none bg-transparent pr-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest focus:outline-none cursor-pointer hover:text-foreground transition-colors"
                title={`Filter by ${label}`}
            >
                <option value="ALL" className="bg-background text-foreground">{label}</option>
                {options.map(opt => (
                    <option key={opt} value={opt} className="bg-background text-foreground">{opt}</option>
                ))}
            </select>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover/filter:text-foreground transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            {value !== 'ALL' && (
                <div className="absolute -top-1.5 -right-2 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
        </div>
    );
}

function FilterTag({ label, onClear }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 border border-border rounded-lg text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>{label}</span>
            <button onClick={onClear} className="hover:text-foreground transition-colors">✕</button>
        </div>
    );
}
