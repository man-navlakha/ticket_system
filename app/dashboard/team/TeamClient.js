'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check, Users, MailOpen, UserRoundX, Inbox, Download, Search } from 'lucide-react';
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

    const handleExport = () => {
        const headers = ['Username', 'Email', 'Role', 'Status', 'Joined Date', 'Tickets Count', 'Inventory Count'];
        const csvContent = [
            headers.join(','),
            ...filteredUsers.map(u =>
                [
                    u.username,
                    u.email,
                    u.role,
                    u.status,
                    u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
                    u._count?.tickets || 0,
                    u._count?.inventory || 0
                ].map(val => `"${val === undefined || val === null ? '' : val}"`).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Data exported successfully.');
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 no-scrollbar transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-16">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pt-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-border flex items-center justify-center text-[10px] font-bold text-primary">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{user?.role} Workspace</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">Team Management</h1>
                    </div>
                    {activeTab === 'members' && (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleExport}
                                className="h-10 px-5 bg-foreground text-background rounded-full text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-black/5 active:scale-95 whitespace-nowrap"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-8 border-b border-border pb-px">
                    {[
                        { id: 'members', label: 'Fleet Members' },
                        { id: 'invite', label: 'Provision Access' },
                        { id: 'requests', label: 'Entrance Requests', count: requests.length }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 text-sm font-medium transition-all relative flex items-center gap-2 ${activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold">
                                    {tab.count}
                                </span>
                            )}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full animate-in fade-in slide-in-from-bottom-1 duration-300" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Dynamic Views */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'members' && (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-4">
                                <div className="relative group max-w-md">
                                    <input
                                        type="text"
                                        placeholder="Search by username or email..."
                                        className="w-full h-11 bg-card border border-border rounded-xl px-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-all shadow-sm"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground/50">
                                        <Search className="w-4 h-4" />
                                    </div>
                                </div>

                                {isFiltersActive && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filters:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {search && <FilterTag label={`Search: ${search}`} onClear={() => setSearch('')} />}
                                            {roleFilter !== 'ALL' && <FilterTag label={`Role: ${roleFilter}`} onClear={() => setRoleFilter('ALL')} />}
                                            {statusFilter !== 'ALL' && <FilterTag label={`Status: ${statusFilter}`} onClear={() => setStatusFilter('ALL')} />}
                                        </div>
                                        <button
                                            onClick={() => { setSearch(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}
                                            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors ml-2"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-border bg-card/50 overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30">
                                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Personnel</th>
                                            <th className="px-6 py-4">
                                                <HeaderFilter
                                                    label="Role"
                                                    value={roleFilter}
                                                    onChange={setRoleFilter}
                                                    options={['ADMIN', 'AGENT', 'USER']}
                                                />
                                            </th>
                                            <th className="px-6 py-4">
                                                <HeaderFilter
                                                    label="Status"
                                                    value={statusFilter}
                                                    onChange={setStatusFilter}
                                                    options={['ACTIVE', 'INACTIVE', 'PENDING']}
                                                />
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="4">
                                                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                                                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                                                            <UserRoundX className="w-6 h-6 text-muted-foreground/50" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-bold text-foreground">No personnel found</p>
                                                            <p className="text-xs text-muted-foreground">We couldn't find any team members matching your specific criteria.</p>
                                                        </div>
                                                        {isFiltersActive ? (
                                                            <button
                                                                onClick={() => { setSearch(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}
                                                                className="h-9 px-4 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all"
                                                            >
                                                                Clear Filters
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setActiveTab('invite')}
                                                                className="h-9 px-4 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all"
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
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-border flex items-center justify-center text-[10px] font-bold text-primary transition-transform group-hover:scale-110">
                                                                {u.username?.[0]?.toUpperCase() || 'U'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-foreground">{u.username}</p>
                                                                <p className="text-xs text-muted-foreground">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                                                    <td className="px-6 py-4"><StatusIndicator status={u.status} /></td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link
                                                                href={`/dashboard/team/${u.id}`}
                                                                className="h-8 px-3 rounded-lg bg-blue-500/10 text-blue-500 text-[10px] flex items-center justify-center font-bold uppercase tracking-wider border border-blue-500/20 opacity-0 group-hover:opacity-100 hover:bg-blue-500 hover:text-white transition-all active:scale-95"
                                                            >
                                                                Profile
                                                            </Link>
                                                            <button
                                                                onClick={() => handleAction(u.id, null, 'user-delete')}
                                                                className="h-8 px-3 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider border border-red-500/20 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                                            >
                                                                Revoke
                                                            </button>
                                                        </div>
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
                        <div className="max-w-xl py-8">
                            <div className="rounded-2xl p-8 space-y-8">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold text-foreground tracking-tight">Provision Access</h2>
                                    <p className="text-sm text-muted-foreground">Issue operational access to new team members.</p>
                                </div>

                                <form onSubmit={handleInvite} className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Addresses</label>
                                        <textarea
                                            placeholder="alias.one@example.com, alias.two@example.com"
                                            className="w-full bg-card border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-all h-24"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            required
                                        />
                                        <p className="text-[11px] text-muted-foreground">Separate multiple emails using commas.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned Role</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {[
                                                { id: 'USER', label: 'USER', desc: 'Standard access' },
                                                { id: 'AGENT', label: 'AGENT', desc: 'Manage tickets' },
                                                { id: 'ADMIN', label: 'ADMIN', desc: 'Full control' }
                                            ].map(r => (
                                                <button
                                                    key={r.id} type="button"
                                                    onClick={() => setInviteRole(r.id)}
                                                    className={`p-4 text-left rounded-xl border transition-all flex flex-col justify-between h-full min-h-[100px] ${inviteRole === r.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card border-border hover:border-foreground/20'}`}
                                                >
                                                    <div>
                                                        <span className={`block font-bold text-sm ${inviteRole === r.id ? 'text-primary' : 'text-foreground'}`}>{r.label}</span>
                                                        <span className="text-xs text-muted-foreground mt-2 block">{r.desc}</span>
                                                    </div>
                                                    <div className={`mt-3 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${inviteRole === r.id ? 'border-primary' : 'border-muted-foreground/30'}`}>
                                                        {inviteRole === r.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !inviteEmail}
                                        className="w-full h-11 bg-foreground text-background rounded-full text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 mt-4"
                                    >
                                        {loading ? 'Transmitting...' : 'Dispatch Invitations'}
                                        <span className="opacity-40">→</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'requests' && (
                        <div className="rounded-2xl border border-border bg-card/50 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="border-b border-border bg-muted/30">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Requester</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {requests.length === 0 ? (
                                        <tr>
                                            <td colSpan="4">
                                                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                                                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                                                        <Inbox className="w-6 h-6 text-muted-foreground/50" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-foreground">No pending requests</p>
                                                        <p className="text-xs text-muted-foreground">All infrastructure access vectors are currently clear.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        requests.map(req => (
                                            <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-semibold text-foreground">{req.name}</p>
                                                    <p className="text-xs text-muted-foreground">{req.email}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-medium bg-card px-2.5 py-1 rounded-md border border-border">
                                                        {req.department}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4"><StatusIndicator status={req.status} /></td>
                                                <td className="px-6 py-4 text-right">
                                                    {req.status === 'PENDING' && (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <ActionBtn label="Grant" color="green" onClick={() => handleAction(req.id, 'APPROVE', 'request')} />
                                                            <ActionBtn label="Deny" color="red" onClick={() => handleAction(req.id, 'REJECT', 'request')} />
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
        </div>
    );
}

function RoleBadge({ role }) {
    const styles = {
        ADMIN: 'bg-primary/10 text-primary border-primary/20',
        AGENT: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        USER: 'bg-muted/50 text-muted-foreground border-border'
    };
    return (
        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider inline-flex items-center justify-center ${styles[role] || styles.USER}`}>
            {role.replace('_', ' ')}
        </span>
    );
}

function StatusIndicator({ status }) {
    const active = status === 'ACTIVE' || status === 'APPROVED';
    return (
        <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : status === 'PENDING' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-green-500' : status === 'PENDING' ? 'text-amber-500' : 'text-red-500'}`}>{status}</span>
        </div>
    );
}

function ActionBtn({ label, color, onClick }) {
    const colors = {
        green: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white',
        red: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'
    };
    return (
        <button onClick={onClick} className={`h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all active:scale-95 ${colors[color]}`}>
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
                    className="flex items-center gap-1.5 group/filter transition-colors text-muted-foreground hover:text-foreground data-[state=open]:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                    <span className="text-xs font-bold uppercase tracking-wider">{selectedLabel}</span>
                    <ChevronDown className="w-3 h-3 transition-transform duration-300 group-data-[state=open]/filter:rotate-180 text-muted-foreground group-hover/filter:text-foreground" />
                    {value !== 'ALL' && (
                        <div className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-primary rounded-full shadow-sm" />
                    )}
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-[160px] bg-card border border-border/50 rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
                    sideOffset={8}
                    align="start"
                >
                    <DropdownMenu.Item
                        onClick={() => onChange('ALL')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-all cursor-pointer outline-none ${value === 'ALL' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                    >
                        <span>{label} (ALL)</span>
                        {value === 'ALL' && <Check className="w-3 h-3" />}
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="h-px bg-border/50 my-1 mx-2" />

                    {options.map(opt => (
                        <DropdownMenu.Item
                            key={opt}
                            onClick={() => onChange(opt)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-all cursor-pointer outline-none group ${value === opt ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                        >
                            <span>{opt.replace('_', ' ')}</span>
                            {value === opt && <Check className="w-3 h-3" />}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

function FilterTag({ label, onClear }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 border border-border rounded-md text-[10px] font-semibold text-muted-foreground">
            <span>{label}</span>
            <button onClick={onClear} className="hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-ring rounded-full p-0.5" type="button">✕</button>
        </div>
    );
}
