'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardSearch from '@/components/DashboardSearch';
import AnalyticsClient from './analytics/AnalyticsClient';
import {
    BarChart, Bar, ResponsiveContainer, Cell, Tooltip,
    AreaChart, Area, XAxis
} from 'recharts';
import { User, HelpCircle, Package, BookOpen } from 'lucide-react';

export default function DashboardClient({ user, tickets, stats, analyticsStats }) {
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

    // Build per-day activity from the last 7 days of tickets
    const now = new Date();
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        const count = tickets.filter(t => {
            const td = new Date(t.createdAt);
            return td.toDateString() === d.toDateString();
        }).length;
        return { day: label, tickets: count };
    });

    // Ticket status bar data
    const statusBarData = [
        { name: 'Open', value: tickets.filter(t => t.status === 'OPEN').length, fill: '#22c55e' },
        { name: 'Progress', value: tickets.filter(t => t.status === 'IN_PROGRESS').length, fill: '#f59e0b' },
        { name: 'Resolved', value: tickets.filter(t => t.status === 'RESOLVED').length, fill: '#3b82f6' },
        { name: 'Closed', value: tickets.filter(t => t.status === 'CLOSED').length, fill: '#6b7280' },
    ].filter(s => s.value > 0);

    const thisMonthCount = tickets.filter(t => {
        const d = new Date(t.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const statCards = [
        {
            label: 'Total Tickets',
            value: stats.total,
            sub: `${thisMonthCount} this month`,
            color: 'text-foreground',
            accent: '#3b82f6',
            graph: weeklyData.map(d => ({ v: d.tickets })),
            graphColor: '#3b82f6',
            type: 'area'
        },
        {
            label: 'In Progress',
            value: stats.inProgress,
            sub: 'Active',
            color: 'text-amber-500',
            accent: '#f59e0b',
            graph: statusBarData,
            graphColor: '#f59e0b',
            type: 'bar'
        },
        {
            label: 'Resolved',
            value: stats.resolved,
            sub: 'Completed',
            color: 'text-green-500',
            accent: '#22c55e',
            graph: weeklyData.map(d => ({ v: d.tickets })),
            graphColor: '#22c55e',
            type: 'area'
        },
        {
            label: 'Avg Response',
            value: stats.avgResponse || '0h',
            sub: 'Response time',
            color: 'text-violet-500',
            accent: '#8b5cf6',
            graph: [{ v: 1 }, { v: 2 }, { v: 1.5 }, { v: 3 }, { v: 2.5 }, { v: 2 }, { v: 0 }],
            graphColor: '#8b5cf6',
            type: 'area'
        },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 no-scrollbar transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 py-10 md:py-16 space-y-10 animate-in fade-in duration-700">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-border flex items-center justify-center text-[10px] font-bold text-primary">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{user?.role} Workspace</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">Dashboard</h1>
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

                {/* Tabs */}
                <div className="flex items-center gap-8 border-b border-border pb-px">
                    {(['overview', ...(user?.role === 'ADMIN' || user?.role === 'AGENT' ? ['analytics'] : [])]).map((tab) => (
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

                {/* ── OVERVIEW TAB ── */}
                {/* ── OVERVIEW TAB ── */}
                {activeTab === 'overview' && (() => {

                    // ✅ role permission
                    const isStaff = user?.role === 'ADMIN' || user?.role === 'AGENT';

                    return (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* ============================= */}
                            {/* Stat Cards — ADMIN & AGENT ONLY */}
                            {/* ============================= */}
                            {isStaff && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                    {statCards.map((card) => (
                                        <div
                                            key={card.label}
                                            className="relative overflow-hidden p-6 rounded-2xl bg-card border border-border flex flex-col justify-between gap-4 hover:border-foreground/10 transition-all group"
                                        >
                                            {/* Top */}
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                                                    {card.label}
                                                </p>

                                                <div className="flex items-end justify-between gap-2">
                                                    <span className={`text-4xl font-bold tracking-tight ${card.color}`}>
                                                        {card.value}
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-muted-foreground mt-1.5">
                                                    {card.sub}
                                                </p>
                                            </div>

                                            {/* Mini Graph */}
                                            <div className="h-16 -mx-2">
                                                {card.type === 'area' ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={card.graph}>
                                                            <defs>
                                                                <linearGradient id={`grad-${card.label}`} x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor={card.graphColor} stopOpacity={0.3} />
                                                                    <stop offset="95%" stopColor={card.graphColor} stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>

                                                            <Area
                                                                type="monotone"
                                                                dataKey="v"
                                                                stroke={card.graphColor}
                                                                strokeWidth={2}
                                                                fill={`url(#grad-${card.label})`}
                                                                dot={false}
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={card.graph} barCategoryGap="10%">
                                                            <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={14}>
                                                                {card.graph.map((entry, i) => (
                                                                    <Cell
                                                                        key={i}
                                                                        fill={entry.fill || card.graphColor}
                                                                        fillOpacity={0.85}
                                                                    />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                )}
                                            </div>

                                            {/* Accent dot */}
                                            <div
                                                className="absolute top-4 right-4 w-2 h-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                                                style={{ background: card.accent }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ============================= */}
                            {/* Weekly Activity — ADMIN & AGENT ONLY */}
                            {/* ============================= */}
                            {isStaff && (
                                <div className="p-6 rounded-2xl bg-card border border-border">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-base font-bold tracking-tight text-foreground">
                                                Weekly Ticket Activity
                                            </h2>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Tickets opened in the last 7 days
                                            </p>
                                        </div>

                                        <span className="text-[10px] font-bold uppercase tracking-widest bg-muted text-muted-foreground px-2.5 py-1 rounded-full border border-border">
                                            Last 7 days
                                        </span>
                                    </div>

                                    <ResponsiveContainer width="100%" height={160}>
                                        <BarChart data={weeklyData} barCategoryGap="30%">
                                            <XAxis
                                                dataKey="day"
                                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }}
                                                tickLine={false}
                                                axisLine={false}
                                            />

                                            <Tooltip
                                                content={({ active, payload, label }) =>
                                                    active && payload?.length ? (
                                                        <div className="bg-card border border-border rounded-xl px-4 py-2.5 shadow-xl text-sm">
                                                            <p className="text-muted-foreground text-[10px] uppercase tracking-widest">
                                                                {label}
                                                            </p>
                                                            <p className="text-foreground font-bold text-base">
                                                                {payload[0].value} tickets
                                                            </p>
                                                        </div>
                                                    ) : null
                                                }
                                            />

                                            <Bar dataKey="tickets" radius={[6, 6, 0, 0]} barSize={36}>
                                                {weeklyData.map((entry, i) => (
                                                    <Cell
                                                        key={i}
                                                        fill={entry.tickets > 0 ? '#3b82f6' : 'hsl(var(--muted))'}
                                                        fillOpacity={entry.tickets > 0 ? 0.85 : 0.4}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* ============================= */}
                            {/* Content Grid (Visible to ALL) */}
                            {/* ============================= */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                {/* Recent Tickets */}
                                <div className="lg:col-span-2 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-bold tracking-tight text-foreground">
                                            Recent Activity
                                        </h2>

                                        <Link
                                            href="/dashboard/tickets"
                                            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
                                        >
                                            View All →
                                        </Link>
                                    </div>

                                    <div className="space-y-3">
                                        {tickets.length === 0 ? (
                                            <div className="p-12 border border-border bg-card/50 rounded-2xl text-center space-y-4">
                                                <p className="text-muted-foreground font-medium">
                                                    No tickets found.
                                                </p>

                                                <Link
                                                    href="/dashboard/create"
                                                    className="text-sm text-primary font-bold hover:underline"
                                                >
                                                    Create your first ticket
                                                </Link>
                                            </div>
                                        ) : (
                                            tickets.slice(0, 5).map((ticket) => (
                                                <Link
                                                    key={ticket.id}
                                                    href={`/dashboard/${ticket.id}`}
                                                    className="group block p-5 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-foreground/10 transition-all"
                                                >
                                                    <div className="flex items-start justify-between gap-4 mb-3">
                                                        <div className="space-y-1 min-w-0">
                                                            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                                {ticket.title}
                                                            </h3>

                                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                                {ticket.description}
                                                            </p>
                                                        </div>

                                                        <div className={`shrink-0 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${statusStyles[ticket.status]}`}>
                                                            {ticket.status.replace('_', ' ')}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-3 border-t border-border">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${priorityColors[ticket.priority]}`} />
                                                                <span className="uppercase tracking-wider font-bold">
                                                                    {ticket.priority}
                                                                </span>
                                                            </div>

                                                            <span className="font-mono">
                                                                #{ticket.id.slice(0, 6)}
                                                            </span>
                                                        </div>

                                                        <span suppressHydrationWarning>
                                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Sidebar stays SAME (visible to all users) */}
                                <div className="space-y-6">
                                    {/* Status breakdown mini */}
                                    {statusBarData.length > 0 && (
                                        <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status Breakdown</h3>
                                            <div className="space-y-3">
                                                {statusBarData.map(s => (
                                                    <div key={s.name}>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.name}</span>
                                                            <span className="text-xs font-bold text-foreground">{s.value}</span>
                                                        </div>
                                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-700"
                                                                style={{ width: `${(s.value / stats.total) * 100 || 0}%`, background: s.fill }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick Actions */}
                                    <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-5">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick Actions</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <ActionLink href="/dashboard/profile" label="Profile" Icon={User} />
                                            <ActionLink href="/dashboard/help" label="Help" Icon={HelpCircle} />
                                            <ActionLink href="/dashboard/inventory" label="Inventory" Icon={Package} />
                                            <ActionLink href="/dashboard/knowledge-base" label="Wiki" Icon={BookOpen} />
                                        </div>
                                    </div>

                                    {/* System Status */}
                                    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/10 dark:border-blue-500/20">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">Enterprise Status</h4>
                                        <div className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300 font-medium font-mono">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                            System Fully Operational
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    );
                })()}

                {/* ── ANALYTICS TAB ── */}
                {activeTab === 'analytics' && (
                    <div className="animate-in fade-in duration-500">
                        <AnalyticsClient stats={analyticsStats} />
                    </div>
                )}
            </div>
        </div>
    );
}

function ActionLink({ href, label, Icon }) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all space-y-2 group">
            <Icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-all" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground">{label}</span>
        </Link>
    );
}
