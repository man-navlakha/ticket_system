'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Save, Activity, BookOpen, Package, MessageSquare, Ticket, FileText, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function UserDetailClient({ currentUser, targetUser }) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('tickets');

    const [form, setForm] = useState({
        username: targetUser.username || '',
        email: targetUser.email || '',
        phoneNumber: targetUser.phoneNumber || '',
        role: targetUser.role || 'USER',
        status: targetUser.status || 'ACTIVE'
    });

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: targetUser.id, ...form })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('User updated successfully.');
                setIsEditing(false);
                router.refresh();
            } else {
                toast.error(data.error || 'Failed to update user.');
            }
        } catch (error) {
            toast.error('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'tickets', label: 'Tickets', icon: <Ticket className="w-4 h-4" />, count: targetUser.tickets.length },
        { id: 'comments', label: 'Comments', icon: <MessageSquare className="w-4 h-4" />, count: targetUser.comments.length },
        { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" />, count: targetUser.inventory.length },
        { id: 'kb', label: 'KB Articles', icon: <BookOpen className="w-4 h-4" />, count: targetUser.knowledgeBaseArticles.length },
        { id: 'proposals', label: 'Proposals', icon: <FileText className="w-4 h-4" />, count: targetUser.createdProposals.length + targetUser.assignedProposals.length }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 no-scrollbar transition-colors duration-300 pb-16">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
                {/* Header */}
                <div className="pt-8 space-y-6">
                    <Link
                        href="/dashboard/team"
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Team
                    </Link>

                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-primary/10 border border-border flex items-center justify-center text-3xl font-bold text-primary">
                                {targetUser.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">{targetUser.username}</h1>
                                <p className="text-sm text-muted-foreground">{targetUser.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <RoleBadge role={targetUser.role} />
                                    <StatusIndicator status={targetUser.status} />
                                </div>
                            </div>
                        </div>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="h-10 px-5 bg-foreground text-background rounded-full text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-sm shrink-0"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold">Edit user configuration</h2>
                            <button onClick={() => setIsEditing(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                        </div>
                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Username</label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    className="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                                <input
                                    type="tel"
                                    value={form.phoneNumber}
                                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                                    className="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</label>
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                                >
                                    <option value="USER">USER</option>
                                    <option value="AGENT">AGENT</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                    <option value="PENDING">PENDING</option>
                                </select>
                            </div>
                            <div className="flex items-end lg:col-span-1">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                    <Save className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Info Display if not editing */}
                {!isEditing && targetUser.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">{targetUser.phoneNumber}</span>
                    </div>
                )}

                {/* Content Tabs */}
                <div className="flex items-center gap-6 border-b border-border pb-px overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 text-sm font-medium transition-all relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-muted text-foreground text-[10px] font-bold">
                                    {tab.count}
                                </span>
                            )}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full animate-in fade-in slide-in-from-bottom-1 duration-300" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Views */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'tickets' && (
                        <div className="rounded-2xl border border-border bg-card/50 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Ticket</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Priority</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {targetUser.tickets.length === 0 ? (
                                        <EmptyRow colSpan="4" message="No tickets found for this user." />
                                    ) : (
                                        targetUser.tickets.map(t => (
                                            <tr key={t.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/tickets/${t.id}`)}>
                                                <td className="px-6 py-4 font-medium text-sm text-foreground">{t.title}</td>
                                                <td className="px-6 py-4"><span className="text-xs bg-muted px-2 py-1 rounded-md">{t.status}</span></td>
                                                <td className="px-6 py-4"><span className="text-xs text-muted-foreground">{t.priority}</span></td>
                                                <td className="px-6 py-4 text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <div className="space-y-4">
                            {targetUser.comments.length === 0 ? (
                                <div className="p-12 text-center rounded-2xl border border-border bg-card/50"><p className="text-sm font-bold text-muted-foreground">No comments made.</p></div>
                            ) : (
                                targetUser.comments.map(c => (
                                    <div key={c.id} className="p-4 rounded-2xl border border-border bg-card shadow-sm group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-semibold text-primary/80 uppercase tracking-widest cursor-pointer hover:underline" onClick={() => router.push(`/dashboard/tickets/${c.ticketId}`)}>
                                                Ticket: {c.ticket?.title || 'Unknown'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-foreground/90">{c.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="rounded-2xl border border-border bg-card/50 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {targetUser.inventory.length === 0 ? (
                                        <EmptyRow colSpan="4" message="No inventory items assigned." />
                                    ) : (
                                        targetUser.inventory.map(inv => (
                                            <tr key={inv.id} className="hover:bg-muted/20 transition-colors cursor-pointer">
                                                <td className="px-6 py-4 font-medium text-sm text-foreground">{inv.pid}</td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">{inv.type}</td>
                                                <td className="px-6 py-4"><span className="text-xs bg-muted px-2 py-1 rounded-md">{inv.status}</span></td>
                                                <td className="px-6 py-4 text-xs text-muted-foreground">{new Date(inv.assignedDate || inv.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'kb' && (
                        <div className="space-y-4">
                            {targetUser.knowledgeBaseArticles.length === 0 ? (
                                <div className="p-12 text-center rounded-2xl border border-border bg-card/50"><p className="text-sm font-bold text-muted-foreground">No KB articles written.</p></div>
                            ) : (
                                targetUser.knowledgeBaseArticles.map(kb => (
                                    <div key={kb.id} onClick={() => router.push(`/dashboard/kb/${kb.id}`)} className="p-4 rounded-2xl border border-border bg-card shadow-sm cursor-pointer hover:border-foreground/30 transition-all">
                                        <h3 className="font-semibold text-foreground mb-1">{kb.title}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{kb.summary || kb.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'proposals' && (
                        <div className="space-y-4">
                            {targetUser.createdProposals.length === 0 && targetUser.assignedProposals.length === 0 ? (
                                <div className="p-12 text-center rounded-2xl border border-border bg-card/50"><p className="text-sm font-bold text-muted-foreground">No proposals directly tied to this user.</p></div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {targetUser.createdProposals.map(p => (
                                        <div key={p.id} onClick={() => router.push(`/dashboard/proposals`)} className="p-4 rounded-2xl border border-border bg-card shadow-sm cursor-pointer hover:border-foreground/30 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">Created By User</span>
                                                <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>
                                            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{p.description}</p>
                                            <span className="text-xs bg-muted px-2 py-1 rounded-md font-medium">{p.status}</span>
                                        </div>
                                    ))}
                                    {targetUser.assignedProposals.map(p => (
                                        <div key={p.id} onClick={() => router.push(`/dashboard/proposals`)} className="p-4 rounded-2xl border border-border bg-card shadow-sm cursor-pointer hover:border-foreground/30 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Assigned To User</span>
                                                <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>
                                            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{p.description}</p>
                                            <span className="text-xs bg-muted px-2 py-1 rounded-md font-medium">{p.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
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
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-card border border-border">
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : status === 'PENDING' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-green-500' : status === 'PENDING' ? 'text-amber-500' : 'text-red-500'}`}>{status}</span>
        </div>
    );
}

function EmptyRow({ colSpan, message }) {
    return (
        <tr>
            <td colSpan={colSpan}>
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-2">
                    <Activity className="w-6 h-6 text-muted-foreground/30 mb-2" />
                    <p className="text-sm font-bold text-foreground">{message}</p>
                </div>
            </td>
        </tr>
    );
}
