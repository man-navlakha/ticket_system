'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check, Users, MailOpen, UserRoundX, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export default function TeamClient({ user, initialUsers = [], initialRequests = [] }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('members');
    const [users, setUsers] = useState(initialUsers);
    const [requests, setRequests] = useState(initialRequests);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('USER');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    useEffect(() => {
        setRequests(initialRequests);
    }, [initialRequests]);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/access-requests');
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);

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
                if (data.results && data.results.failed && data.results.failed.length > 0) {
                    const failedEmails = data.results.failed.map(f => f.email).join(', ');
                    toast.error(`Failed for: ${failedEmails}`);
                } else {
                    toast.success(`Invitation${emails.length > 1 ? 's' : ''} sent successfully.`);
                    setInviteEmail('');
                    router.refresh();
                }
            } else {
                toast.error(data.error || 'Failed to send invite.');
            }
        } catch (error) {
            toast.error(error.message || 'An unexpected error occurred.');
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
                if (type === 'user-delete') {
                    setUsers(users.filter(u => u.id !== id));
                    toast.success('User revoked successfully.');
                }
                if (type === 'request') {
                    await fetchRequests();
                    toast.success(`Request ${action === 'APPROVE' ? 'approved' : 'denied'} successfully.`);
                    if (action === 'APPROVE') router.refresh(); // Fetch new users list
                }
            } else {
                const data = await res.json();
                toast.error(data.error || 'Operation failed.');
            }
        } catch (error) {
            toast.error('An unexpected error occurred.');
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

    const isFiltersActive = search || roleFilter !== 'ALL' || statusFilter !== 'ALL';

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

                            {isFiltersActive && (
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
                                        <tr>
                                            <td colSpan="4">
                                                <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
                                                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                                        <UserRoundX className="w-8 h-8 text-muted-foreground/50" />
                                                    </div>
                                                    <div className="space-y-1 max-w-[250px]">
                                                        <p className="text-sm font-bold text-foreground">No personnel found</p>
                                                        <p className="text-xs text-muted-foreground leading-relaxed">We couldn't find any team members matching your current criteria.</p>
                                                    </div>
                                                    {isFiltersActive ? (
                                                        <button
                                                            onClick={() => { setSearch(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}
                                                            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                                                        >
                                                            Clear Filters
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setActiveTab('invite')}
                                                            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                                                        >
                                                            Provision Access
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-muted/20 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground transition-transform group-hover:scale-110 shadow-sm">
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
                                            { id: 'USER', label: 'USER', desc: 'Standard read/write clearance.' },
                                            { id: 'AGENT', label: 'IT DEPARTMENT', desc: 'Enhanced triage & execution.' },
                                            { id: 'ADMIN', label: 'ADMIN', desc: 'Full infrastructure control.' }
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
                                    <tr>
                                        <td colSpan="4">
                                            <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
                                                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                                    <Inbox className="w-8 h-8 text-muted-foreground/50" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-foreground">Zero pending requests</p>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">All infrastructure access vectors are currently clear.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
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
    const selectedLabel = value === 'ALL' ? label : value;

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2 group/filter transition-colors text-muted-foreground hover:text-foreground data-[state=open]:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest">{selectedLabel}</span>
                    <ChevronDown className="w-3 h-3 transition-transform duration-300 group-data-[state=open]/filter:rotate-180 text-muted-foreground group-hover/filter:text-foreground" />
                    {value !== 'ALL' && (
                        <div className="absolute -top-1.5 -right-3 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                    )}
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-[192px] bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
                    sideOffset={12}
                    align="start"
                >
                    <DropdownMenu.Item
                        onClick={() => onChange('ALL')}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-all cursor-pointer outline-none focus:bg-muted/50 ${value === 'ALL' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                    >
                        <span>{label} (ALL)</span>
                        {value === 'ALL' && <Check className="w-3.5 h-3.5" />}
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="h-px bg-border/50 my-1 mx-2" />

                    {options.map(opt => (
                        <DropdownMenu.Item
                            key={opt}
                            onClick={() => onChange(opt)}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-all cursor-pointer outline-none focus:bg-muted/50 group ${value === opt ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                        >
                            <span className={`transition-transform duration-200 ${value !== opt ? 'group-hover:translate-x-1' : ''}`}>
                                {opt}
                            </span>
                            {value === opt && <Check className="w-3.5 h-3.5" />}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

function FilterTag({ label, onClear }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 border border-border rounded-lg text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>{label}</span>
            <button onClick={onClear} className="hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-ring rounded-full">✕</button>
        </div>
    );
}
