'use client';

import { useState, useEffect } from 'react';

// Sub-components
const TabButton = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${active
                ? 'border-white text-white'
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
    >
        {children}
    </button>
);

const Badge = ({ type, children }) => {
    const styles = {
        ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        AGENT: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        USER: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
        INACTIVE: 'bg-red-500/10 text-red-400 border-red-500/20',
        PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        APPROVED: 'bg-green-500/10 text-green-400 border-green-500/20',
        REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wide ${styles[type] || styles.USER}`}>
            {children}
        </span>
    );
};

export default function TeamClient({ user }) {
    const [activeTab, setActiveTab] = useState('members');
    const [users, setUsers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('USER');
    const [feedback, setFeedback] = useState({ type: '', msg: '' });

    // Load Data
    useEffect(() => {
        if (activeTab === 'members') fetchUsers();
        if (activeTab === 'requests') fetchRequests();
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) setUsers(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/access-requests');
            if (res.ok) setRequests(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFeedback({ type: '', msg: '' });

        try {
            // Support comma-separated emails for bulk
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
        } catch (e) {
            setFeedback({ type: 'error', msg: 'An unexpected error occurred.' });
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
                setFeedback({ type: 'success', msg: 'Action completed successfully.' });
            } else {
                setFeedback({ type: 'error', msg: 'Action failed.' });
            }
        } catch (e) {
            setFeedback({ type: 'error', msg: 'Network error.' });
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (user.role === 'USER') {
        return (
            <div className="flex h-[80vh] items-center justify-center p-6 text-center">
                <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-2xl">
                    <h2 className="text-red-400 text-lg font-medium mb-2">Access Restricted</h2>
                    <p className="text-gray-500 text-sm">You do not have permission to view team settings.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Team Settings</h1>
                        <p className="text-gray-400 text-sm">Manage your team members, permissions, and invitations.</p>
                    </div>
                    {feedback.msg && (
                        <div className={`px-4 py-2 rounded text-sm ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {feedback.msg}
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-white/10">
                    <TabButton active={activeTab === 'members'} onClick={() => setActiveTab('members')}>Members</TabButton>
                    <TabButton active={activeTab === 'invite'} onClick={() => setActiveTab('invite')}>Invite</TabButton>
                    <TabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')}>Access Requests</TabButton>
                </div>

                {/* Views */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">

                    {/* MEMBERS VIEW */}
                    {activeTab === 'members' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-[#0A0A0A] border border-white/10 p-2 rounded-lg">
                                <span className="text-xs font-mono text-gray-500 ml-3">FILTER</span>
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    className="bg-transparent border-none text-sm text-white placeholder:text-gray-600 focus:ring-0 w-64"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="border border-white/10 rounded-lg overflow-hidden bg-[#0A0A0A]">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white/5 text-gray-400 font-medium">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">User</th>
                                            <th className="px-6 py-3 font-medium">Role</th>
                                            <th className="px-6 py-3 font-medium">Status</th>
                                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUsers.length === 0 ? (
                                            <tr><td colSpan="4" className="p-8 text-center text-gray-500">No members found.</td></tr>
                                        ) : (
                                            filteredUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">
                                                                {u.username?.[0]?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-white">{u.username}</p>
                                                                <p className="text-xs text-gray-500">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4"><Badge type={u.role}>{u.role}</Badge></td>
                                                    <td className="px-6 py-4"><Badge type={u.status}>{u.status}</Badge></td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleAction(u.id, null, 'user-delete')}
                                                            className="text-gray-500 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            Remove
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

                    {/* INVITE VIEW */}
                    {activeTab === 'invite' && (
                        <div className="max-w-2xl mx-auto space-y-6 pt-8">
                            <div className="p-6 border border-white/10 rounded-xl bg-[#0A0A0A]">
                                <h2 className="text-lg font-medium mb-6">Invite New Members</h2>
                                <form onSubmit={handleInvite} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase text-gray-500 font-bold tracking-wider">Email Address(es)</label>
                                        <input
                                            type="text"
                                            placeholder="colleague@example.com, another@example.com"
                                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-gray-600 focus:border-white/30 focus:ring-0"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            required
                                        />
                                        <p className="text-xs text-gray-500">Separate multiple emails with commas.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs uppercase text-gray-500 font-bold tracking-wider">Role</label>
                                        <div className="flex gap-4">
                                            {['USER', 'AGENT', 'ADMIN'].map(r => (
                                                <label key={r} className={`flex-1 cursor-pointer border rounded-lg p-4 transition-all ${inviteRole === r ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/30'}`}>
                                                    <input type="radio" value={r} checked={inviteRole === r} onChange={(e) => setInviteRole(e.target.value)} className="hidden" />
                                                    <div className="font-medium text-sm mb-1">{r}</div>
                                                    <div className="text-[10px] text-gray-500">
                                                        {r === 'ADMIN' ? 'Full access to all settings.' : r === 'AGENT' ? 'Can resolve tickets.' : 'Can create tickets.'}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-white text-black py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Sending...' : 'Send Invitations'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* REQUESTS VIEW */}
                    {activeTab === 'requests' && (
                        <div className="border border-white/10 rounded-lg overflow-hidden bg-[#0A0A0A]">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-gray-400 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Requester</th>
                                        <th className="px-6 py-3 font-medium">Department</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {requests.length === 0 ? (
                                        <tr><td colSpan="4" className="p-8 text-center text-gray-500">No pending requests.</td></tr>
                                    ) : (
                                        requests.map(req => (
                                            <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-white">{req.name}</p>
                                                    <p className="text-xs text-gray-500">{req.email}</p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400">{req.department}</td>
                                                <td className="px-6 py-4"><Badge type={req.status}>{req.status}</Badge></td>
                                                <td className="px-6 py-4 text-right">
                                                    {req.status === 'PENDING' && (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleAction(req.id, 'APPROVE', 'request')}
                                                                className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded hover:bg-green-500/20 border border-green-500/20"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(req.id, 'REJECT', 'request')}
                                                                className="px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded hover:bg-red-500/20 border border-red-500/20"
                                                            >
                                                                Reject
                                                            </button>
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
