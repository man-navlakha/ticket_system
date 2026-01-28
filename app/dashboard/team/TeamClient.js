'use client';

import { useState, useEffect } from 'react';

export default function TeamClient({ user }) {
    const [mode, setMode] = useState('list'); // 'list', 'single', 'bulk'
    const [email, setEmail] = useState('');
    const [bulkEmails, setBulkEmails] = useState('');
    const [role, setRole] = useState('USER');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]);

    // Editing states
    const [editingUser, setEditingUser] = useState(null);
    const [newUsername, setNewUsername] = useState('');

    useEffect(() => {
        if (mode === 'list') {
            fetchUsers();
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
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-gray-400 mt-2">Manage users, agents, and invitations.</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => setMode('list')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'list' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Users List
                    </button>
                    <button
                        onClick={() => setMode('single')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'single' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Invite New
                    </button>
                    <button
                        onClick={() => setMode('bulk')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'bulk' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Bulk Add
                    </button>
                </div>
            </div>

            {(error || message) && (
                <div className={`p-4 rounded-xl border ${error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'} text-sm flex justify-between items-center`}>
                    <span>{error || message}</span>
                    <button onClick={() => { setError(''); setMessage(''); }} className="hover:opacity-75">✕</button>
                </div>
            )}

            {mode === 'list' ? (
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-white/5 uppercase font-medium text-xs tracking-wider text-white">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                {editingUser === u.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={newUsername}
                                                            onChange={(e) => setNewUsername(e.target.value)}
                                                            className="bg-black border border-white/20 rounded px-2 py-1 text-white text-xs w-32"
                                                            placeholder="New Username"
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateUsername(u.id)}
                                                            disabled={loading}
                                                            className="text-green-500 hover:text-green-400 text-xs"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingUser(null); setNewUsername(''); }}
                                                            className="text-gray-500 hover:text-gray-400 text-xs"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="font-medium text-white">{u.username || 'Unset'}</div>
                                                        <div className="text-xs">{u.email}</div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                    u.role === 'AGENT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${u.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                    }`}>
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-3">
                                                <button
                                                    onClick={() => { setEditingUser(u.id); setNewUsername(u.username || ''); }}
                                                    className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                                                >
                                                    Edit Username
                                                </button>
                                                <button
                                                    onClick={() => handleSendResetLink(u.email)}
                                                    className="text-gray-400 hover:text-white text-xs transition-colors"
                                                >
                                                    Send Reset Link
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="text-red-500 hover:text-red-400 text-xs transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                    {/* Form Section */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                            <form onSubmit={handleInvite} className="space-y-6">
                                {mode === 'single' ? (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="colleague@example.com"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Email Addresses (one per line or comma separated)</label>
                                        <textarea
                                            value={bulkEmails}
                                            onChange={(e) => setBulkEmails(e.target.value)}
                                            required
                                            rows={6}
                                            placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all resize-none font-mono text-sm"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Assigned Role</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['USER', 'AGENT', 'ADMIN'].map((r) => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setRole(r)}
                                                className={`py-2 rounded-lg border text-xs font-bold transition-all ${role === r ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-white'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-white text-black font-bold rounded-xl py-4 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        mode === 'single' ? 'Send Invitation' : `Invite ${bulkEmails.split(/[\n,]+/).filter(e => e.trim() !== '').length} Members`
                                    )}
                                </button>
                            </form>

                            {results && (
                                <div className="mt-6 space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Invite Results</h3>
                                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {results.successful.map((res, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                                <span className="text-white text-sm">{res.email}</span>
                                                <span className="text-[10px] font-bold text-green-500 uppercase">Success</span>
                                            </div>
                                        ))}
                                        {results.failed.map((res, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-red-500/20">
                                                <span className="text-white text-sm">{res.email}</span>
                                                <span className="text-[10px] font-bold text-red-500 uppercase" title={res.error}>Failed</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Guide Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                            <h3 className="text-lg font-bold mb-6">Invitation Guide</h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">1</span>
                                    <div>
                                        <p className="font-semibold text-white">Select Access Level</p>
                                        <p className="text-sm text-gray-500 mt-1">Users can create tickets, Agents manage them, and Admins control everything.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">2</span>
                                    <div>
                                        <p className="font-semibold text-white">Send Secure Link</p>
                                        <p className="text-sm text-gray-500 mt-1">Recipients receive a unique cryptographic link valid for 24 hours.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">3</span>
                                    <div>
                                        <p className="font-semibold text-white">Auto-Onboarding</p>
                                        <p className="text-sm text-gray-500 mt-1">Once they join, they'll be prompted to complete their profile and link their hardware.</p>
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
            )}
        </div>
    );
}
