'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardSearch from '@/components/DashboardSearch';

export default function DashboardClient({ user, tickets, stats }) {
    const [activeTab, setActiveTab] = useState('overview');

    const statusStyles = {
        OPEN: 'bg-green-500/10 text-green-500 border-green-500/20',
        IN_PROGRESS: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        RESOLVED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        CLOSED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
    };

    const priorityColors = {
        HIGH: 'bg-red-500',
        MEDIUM: 'bg-amber-500',
        LOW: 'bg-green-500',
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 no-scrollbar transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 py-10 md:py-16 space-y-12 animate-in fade-in duration-700">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-border flex items-center justify-center text-[10px] font-bold text-primary">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{user?.role} Workspace</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
                            Dashboard
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <DashboardSearch className="w-full md:w-80" />
                        <Link
                            href="/dashboard/create"
                            className="h-10 px-5 bg-foreground text-background rounded-full text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-black/5 active:scale-95 whitespace-nowrap"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Ticket
                        </Link>
                    </div>
                </div>

                {/* Tabs / Navigation */}
                <div className="flex items-center gap-8 border-b border-border pb-px">
                    {['overview', 'activity', 'analytics'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-sm font-medium transition-all relative capitalize ${activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full animate-in fade-in slide-in-from-bottom-1 duration-300" />
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard label="Total Tickets" value={stats.total} trend={`${stats.total - 5}+ this month`} />
                            <StatCard label="In Progress" value={stats.inProgress} color="text-amber-500" />
                            <StatCard label="Resolved" value={stats.resolved} color="text-green-500" />
                            <StatCard label="Average Response" value="1.8h" trend="Improved" />
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Main Ticket List */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">Recent Activity</h2>
                                    <Link href="/dashboard/tickets" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">View All →</Link>
                                </div>
                                <div className="space-y-3">
                                    {tickets.length === 0 ? (
                                        <div className="p-12 border border-border bg-card/50 rounded-2xl text-center space-y-4">
                                            <p className="text-muted-foreground font-medium">No tickets found.</p>
                                            <Link href="/dashboard/create" className="text-sm text-primary font-bold hover:underline">Create your first ticket</Link>
                                        </div>
                                    ) : (
                                        tickets.slice(0, 5).map((ticket) => (
                                            <Link key={ticket.id} href={`/dashboard/${ticket.id}`} className="group block p-5 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-foreground/10 transition-all">
                                                <div className="flex items-start justify-between gap-4 mb-3">
                                                    <div className="space-y-1 min-w-0">
                                                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                            {ticket.title}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground line-clamp-1">{ticket.description}</p>
                                                    </div>
                                                    <div className={`shrink-0 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${statusStyles[ticket.status]}`}>
                                                        {ticket.status.replace('_', ' ')}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-3 border-t border-border">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${priorityColors[ticket.priority]}`} />
                                                            <span className="uppercase tracking-wider font-bold text-muted-foreground">{ticket.priority}</span>
                                                        </div>
                                                        <span className="font-mono">#{ticket.id.slice(0, 6)}</span>
                                                    </div>
                                                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Sidebar Info */}
                            <div className="space-y-8">
                                <div className="p-6 rounded-2xl bg-muted/30 border border-border space-y-6">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quick Actions</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <ActionLink href="/dashboard/profile" label="Settings" icon="⚙️" />
                                        <ActionLink href="/dashboard/help" label="Help" icon="❔" />
                                        <ActionLink href="/dashboard/inventory" label="Inventory" icon="📦" />
                                        <ActionLink href="/dashboard/knowledge-base" label="Wiki" icon="📚" />
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/10 dark:border-blue-500/20">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">Enterprise Status</h4>
                                    <div className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300 font-medium font-mono">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        System Fully Operational
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab !== 'overview' && (
                    <div className="py-20 text-center animate-in fade-in duration-500">
                        <p className="text-muted-foreground font-medium">This section is currently under development.</p>
                        <button onClick={() => setActiveTab('overview')} className="mt-4 text-sm text-foreground font-bold hover:underline">Back to Overview</button>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, trend, color = "text-foreground" }) {
    return (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</h3>
            <div className="flex items-end justify-between">
                <span className={`text-4xl font-bold tracking-tight ${color}`}>{value}</span>
                {trend && <span className="text-[10px] text-muted-foreground font-bold bg-muted px-2 py-0.5 rounded uppercase tracking-tighter">{trend}</span>}
            </div>
        </div>
    );
}

function ActionLink({ href, label, icon }) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all space-y-2 group">
            <span className="text-lg group-hover:scale-110 transition-transform">{icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground">{label}</span>
        </Link>
    );
}
