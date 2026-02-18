'use client';

import { useState, useEffect } from 'react';

export default function TeamClient({ user }) {
    const [mode, setMode] = useState('list'); // 'list', 'single', 'bulk', 'requests'
    const [email, setEmail] = useState('');
    const [bulkEmails, setBulkEmails] = useState('');
    const [role, setRole] = useState('USER');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]);
    const [accessRequests, setAccessRequests] = useState([]);

    // Editing states
    const [editingUser, setEditingUser] = useState(null);
    const [newUsername, setNewUsername] = useState('');

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(u =>
        (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    useEffect(() => {
        if (mode === 'list') {
            fetchUsers();
        } else if (mode === 'requests') {
            fetchAccessRequests();
        }
    }, [mode]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    const fetchAccessRequests = async () => {
        try {
            const res = await fetch('/api/access-requests');
            if (res.ok) {
                const data = await res.json();
                setAccessRequests(data);
            }
        } catch (err) {
            console.error("Failed to fetch access requests", err);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        setResults(null);

        try {
            if (mode === 'single') {
                const res = await fetch('/api/admin/invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, role }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to send invite');
                setMessage('Invitation created successfully!');
                setEmail('');
            } else {
                const emails = bulkEmails.split(/[\n,]+/).map(e => e.trim()).filter(e => e !== '');
                if (emails.length === 0) throw new Error('Please enter at least one email address');

                const res = await fetch('/api/admin/bulk-invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emails, role }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to send bulk invites');
                setResults(data.results);
                setBulkEmails('');
                setMessage('Bulk invitations processed!');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUsername = async (userId) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, username: newUsername }),
            });

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, username: newUsername } : u));
                setEditingUser(null);
                setNewUsername('');
                setMessage('Username updated successfully');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to update username');
            }
        } catch (err) {
            setError('Failed to update username');
        } finally {
            setLoading(false);
        }
    };

    const handleSendResetLink = async (email) => {
        if (!confirm(`Send password reset link to ${email}?`)) return;

        setLoading(true);
        try {
            // Reusing existing public forgot-password API
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setMessage(`Reset link sent to ${email}`);
            } else {
                setError('Failed to send reset link');
            }
        } catch (err) {
            setError('Error sending reset link');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId));
                setMessage('User deleted successfully');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to delete user');
            }
        } catch (err) {
            setError('Failed to delete user');
        } finally {
            setLoading(false);
        }
    };

    const handleAccessRequestAction = async (requestId, action, requestEmail, requestName) => {
        if (!confirm(`Are you sure you want to ${action.toLowerCase()} this request?`)) return;

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch(`/api/users/access-requests/${requestId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to process request');
            }

            if (action === 'APPROVE') {
                setMessage(`Request approved! User ${data.user.email} created.`);
                // Refresh list to update status
                setAccessRequests(accessRequests.map(req =>
                    req.id === requestId ? { ...req, status: 'APPROVED' } : req
                ));
            } else {
                setMessage('Request rejected.');
                setAccessRequests(accessRequests.map(req =>
                    req.id === requestId ? { ...req, status: 'REJECTED' } : req
                ));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    if (user.role === 'USER') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-md">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Access Denied</h2>
                    <p className="text-gray-400">Only Admins and Agents can manage team members.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen rounded-xl bg-[#0B0E14] text-white p-6 md:p-12 font-sans">
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-2">Team Management</h1>
                        <p className="text-gray-400 text-lg">Manage users, agents, invite teammates, and permissions.</p>
                    </div>
                    <div className="flex bg-[#141820] p-1.5 rounded-xl border border-white/5 shadow-sm">
                        <button
                            onClick={() => setMode('list')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'list' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Users List
                        </button>
                        <button
                            onClick={() => setMode('requests')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'requests' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Requests
                        </button>
                        <button
                            onClick={() => setMode('single')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'single' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Invite New
                        </button>
                        <button
                            onClick={() => setMode('bulk')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'bulk' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Bulk Add
                        </button>
                    </div>
                </div >

                {/* Notifications */}
                {
                    (error || message) && (
                        <div className={`p-4 rounded-xl border ${error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'} text-sm font-medium flex justify-between items-center animate-in fade-in slide-in-from-top-1`}>
                            <span>{error || message}</span>
                            <button onClick={() => { setError(''); setMessage(''); }} className="hover:opacity-75 p-1">✕</button>
                        </div>
                    )
                }

                {/* Main Content Area */}
                {
                    mode === 'list' ? (
                        <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl shadow-sm transition-all overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h2 className="text-lg font-bold text-gray-400 uppercase tracking-wider">All Users</h2>
                                <div className="relative w-full sm:w-72">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search users..."
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 focus:bg-black/40 transition-all font-sans"
                                    />
                                    <svg className="w-4 h-4 text-gray-500 absolute right-4 top-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-white/5 text-gray-300 uppercase font-bold text-xs tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">User</th>
                                            <th className="px-6 py-4 font-bold">Role</th>
                                            <th className="px-6 py-4 font-bold">Status</th>
                                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                                    No users matching your search.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((u) => (
                                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-6 py-4">
                                                        {editingUser === u.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={newUsername}
                                                                    onChange={(e) => setNewUsername(e.target.value)}
                                                                    className="bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm w-40 focus:border-white outline-none"
                                                                    placeholder="New Username"
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={() => handleUpdateUsername(u.id)}
                                                                    disabled={loading}
                                                                    className="text-green-400 hover:text-green-300 p-1.5 rounded-md hover:bg-green-400/10 transition-colors"
                                                                    title="Save"
                                                                >
                                                                    ✓
                                                                </button>
                                                                <button
                                                                    onClick={() => { setEditingUser(null); setNewUsername(''); }}
                                                                    className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-red-400/10 transition-colors"
                                                                    title="Cancel"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                                                                    {u.username?.[0]?.toUpperCase() || '?'}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-white group-hover:text-blue-400 transition-colors">{u.username || 'Unset'}</div>
                                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                            u.role === 'AGENT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                            }`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${u.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                            }`}>
                                                            {u.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setEditingUser(u.id); setNewUsername(u.username || ''); }}
                                                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleSendResetLink(u.email)}
                                                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 hover:text-white transition-colors"
                                                                title="Send Password Reset"
                                                            >
                                                                Reset
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-400 transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )
                                        }
                                    </tbody >
                                </table >
                            </div >
                        </div >
                    ) : mode === 'requests' ? (
                        <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl shadow-sm transition-all overflow-hidden">
                            <div className="p-6 border-b border-white/5">
                                <h2 className="text-lg font-bold text-gray-400 uppercase tracking-wider">Access Requests</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-white/5 text-gray-300 uppercase font-bold text-xs tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Requester</th>
                                            <th className="px-6 py-4 font-bold">Department</th>
                                            <th className="px-6 py-4 font-bold">Status</th>
                                            <th className="px-6 py-4 font-bold">Date</th>
                                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {accessRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                    No access requests found.
                                                </td>
                                            </tr>
                                        ) : (
                                            accessRequests.map((req) => (
                                                <tr key={req.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium text-white">{req.name}</div>
                                                            <div className="text-xs text-gray-500">{req.email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-white/5 px-2 py-1 rounded text-xs border border-white/10">
                                                            {req.department}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${req.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            req.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                            }`}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs">
                                                        {new Date(req.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {req.status === 'PENDING' && (
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleAccessRequestAction(req.id, 'APPROVE')}
                                                                    disabled={loading}
                                                                    className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-xs font-medium text-green-400 transition-colors border border-green-500/20"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAccessRequestAction(req.id, 'REJECT')}
                                                                    disabled={loading}
                                                                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-400 transition-colors border border-red-500/20"
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
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            {/* Form Section */}
                            <div className="lg:col-span-3 space-y-6">
                                <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl p-8 shadow-sm transition-all">
                                    <h2 className="text-xl font-light text-white mb-6 flex items-center gap-2">
                                        {mode === 'single' ? 'Invite Individual' : 'Bulk Invitation'}
                                    </h2>

                                    <form onSubmit={handleInvite} className="space-y-6">
                                        {mode === 'single' ? (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    placeholder="colleague@example.com"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Email Addresses</label>
                                                <p className="text-xs text-gray-500 mb-2">Enter one email per line</p>
                                                <textarea
                                                    value={bulkEmails}
                                                    onChange={(e) => setBulkEmails(e.target.value)}
                                                    required
                                                    rows={8}
                                                    placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all resize-none font-mono text-sm leading-relaxed"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Assigned Role</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['USER', 'AGENT', 'ADMIN'].map((r) => (
                                                    <button
                                                        key={r}
                                                        type="button"
                                                        onClick={() => setRole(r)}
                                                        className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${role === r ? 'bg-white text-black border-white shadow-lg scale-[1.02]' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white'}`}
                                                    >
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full bg-white text-black font-bold rounded-full py-4 text-sm hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg"
                                            >
                                                {loading ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Processing...
                                                    </span>
                                                ) : (
                                                    mode === 'single' ? 'Send Invitation' : `Invite ${bulkEmails.split(/[\n,]+/).filter(e => e.trim() !== '').length} Members`
                                                )}
                                            </button>
                                        </div>
                                    </form>

                                    {results && (
                                        <div className="mt-8 pt-6 border-t border-white/5 space-y-4 animate-in fade-in">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Results</h3>
                                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                {results.successful.map((res, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                                        <span className="text-green-100 text-sm font-mono">{res.email}</span>
                                                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Sent</span>
                                                    </div>
                                                ))}
                                                {results.failed.map((res, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                                        <span className="text-red-100 text-sm font-mono">{res.email}</span>
                                                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider" title={res.error}>Failed</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Guide Section */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl p-8 shadow-sm transition-all h-fit">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">Invitation Guide</h3>
                                    <div className="space-y-8">
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-500/20">1</div>
                                            <div>
                                                <p className="font-bold text-white text-sm">Select Access Level</p>
                                                <p className="text-sm text-gray-400 mt-1 leading-relaxed">Users can create tickets, Agents manage them, and Admins control everything.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-500/20">2</div>
                                            <div>
                                                <p className="font-bold text-white text-sm">Send Secure Link</p>
                                                <p className="text-sm text-gray-400 mt-1 leading-relaxed">Recipients receive a unique cryptographic link valid for 24 hours.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-500/20">3</div>
                                            <div>
                                                <p className="font-bold text-white text-sm">Auto-Onboarding</p>
                                                <p className="text-sm text-gray-400 mt-1 leading-relaxed">Once they join, they'll be prompted to complete their profile and link their hardware.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border border-white/5 bg-gradient-to-br from-white/5 to-transparent rounded-2xl">
                                    <p className="text-xs text-gray-500 leading-relaxed italic">
                                        "Streamline your support infrastructure by inviting your entire department in seconds. Our bulk tool ensures every member gets set up with the right permissions immediately."
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
