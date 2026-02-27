'use client';

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import { Ticket, Package, Users, ClipboardList } from 'lucide-react';

// Color palettes
const STATUS_COLORS = {
    OPEN: '#22c55e',
    IN_PROGRESS: '#f59e0b',
    RESOLVED: '#3b82f6',
    CLOSED: '#6b7280',
    CANCELLED: '#ef4444',
};
const PRIORITY_COLORS = {
    HIGH: '#ef4444',
    MEDIUM: '#f59e0b',
    LOW: '#22c55e',
};
const PALETTE = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-sm">
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1">{label || payload[0]?.name}</p>
                <p className="text-foreground font-bold text-lg">{payload[0]?.value}</p>
            </div>
        );
    }
    return null;
};

export default function AnalyticsClient({ stats }) {
    if (!stats) return (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground gap-4">
            <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="font-medium">Failed to load analytics data.</p>
        </div>
    );

    const { tickets, inventory, team, proposals } = stats;

    // Enrich ticket status data with colors
    const ticketStatusData = tickets.byStatus.map(t => ({
        ...t,
        fill: STATUS_COLORS[t.name] || '#6b7280'
    }));

    const ticketPriorityData = tickets.byPriority.map(t => ({
        ...t,
        fill: PRIORITY_COLORS[t.name] || '#6b7280'
    }));

    // KPI summary
    const kpis = [
        { label: 'Total Tickets', value: tickets.total, Icon: Ticket, color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20', iconColor: 'text-blue-500' },
        { label: 'Total Assets', value: inventory.total, Icon: Package, color: 'from-violet-500/20 to-violet-500/5', border: 'border-violet-500/20', iconColor: 'text-violet-500' },
        { label: 'Team Members', value: team.total, Icon: Users, color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20', iconColor: 'text-emerald-500' },
        { label: 'Proposals', value: proposals.total, Icon: ClipboardList, color: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/20', iconColor: 'text-amber-500' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">System Intelligence</p>
                    <h1 className="text-4xl font-bold tracking-tighter text-foreground">Analytics</h1>
                </div>
                <p className="text-sm text-muted-foreground max-w-sm text-right hidden md:block">
                    Live metrics across tickets, assets, team, and proposals.
                </p>
            </div>

            {/* KPI Summary Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br ${kpi.color} border ${kpi.border}`}>
                        <kpi.Icon className={`w-5 h-5 mb-3 ${kpi.iconColor}`} />
                        <p className="text-3xl font-bold tracking-tight text-foreground">{kpi.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Ticket Status — Colored Bar */}
                <ChartCard
                    title="Ticket Status"
                    subtitle="Distribution across all ticket lifecycle stages"
                    badge={`${tickets.total} total`}
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={ticketStatusData} barCategoryGap="30%">
                            <XAxis
                                dataKey="name"
                                stroke="transparent"
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
                                tickFormatter={v => v.replace('_', ' ')}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis hide />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                {ticketStatusData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} fillOpacity={0.9} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 pt-2">
                        {ticketStatusData.map(t => (
                            <div key={t.name} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ background: t.fill }} />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.name.replace('_', ' ')}</span>
                                <span className="text-[10px] font-bold text-foreground">{t.value}</span>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                {/* 2. Ticket Priority — Donut */}
                <ChartCard
                    title="Ticket Priority"
                    subtitle="High, medium, and low urgency breakdown"
                    badge={`${tickets.total} tickets`}
                >
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="55%" height={240}>
                            <PieChart>
                                <Pie
                                    data={ticketPriorityData}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={90}
                                    paddingAngle={4}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {ticketPriorityData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-3">
                            {ticketPriorityData.map(t => (
                                <div key={t.name}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t.name}</span>
                                        <span className="text-sm font-bold text-foreground">{t.value}</span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${(t.value / tickets.total) * 100 || 0}%`, background: t.fill }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChartCard>

                {/* 3. Asset Brands — Horizontal Bar */}
                <ChartCard
                    title="Asset Brands"
                    subtitle="Hardware brand distribution across inventory"
                    badge={`${inventory.total} items`}
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={inventory.byBrand} layout="vertical" barCategoryGap="25%">
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={80}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                                {inventory.byBrand.map((_, i) => (
                                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.85} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* 4. Ownership — Donut */}
                <ChartCard
                    title="Asset Ownership"
                    subtitle="Company owned vs. rented vs. employee owned"
                >
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="55%" height={240}>
                            <PieChart>
                                <Pie
                                    data={inventory.byOwnership}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={90}
                                    paddingAngle={4}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {inventory.byOwnership.map((_, i) => (
                                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-3">
                            {inventory.byOwnership.map((o, i) => (
                                <div key={o.name} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex-1 truncate">{o.name}</span>
                                    <span className="text-sm font-bold text-foreground">{o.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChartCard>

                {/* 5. Team Roles — Radial */}
                <ChartCard
                    title="Team Roles"
                    subtitle="Workspace member breakdown by access level"
                    badge={`${team.total} members`}
                >
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="55%" height={240}>
                            <RadialBarChart
                                cx="50%" cy="50%"
                                innerRadius={20} outerRadius={90}
                                data={team.byRole.map((r, i) => ({ ...r, fill: PALETTE[i % PALETTE.length] }))}
                            >
                                <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'hsl(var(--muted))' }} />
                                <Tooltip content={<CustomTooltip />} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-3">
                            {team.byRole.map((r, i) => (
                                <div key={r.name} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex-1">{r.name}</span>
                                    <span className="text-sm font-bold text-foreground">{r.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChartCard>

                {/* 6. Proposals — Colored Bar */}
                <ChartCard
                    title="Proposal Flow"
                    subtitle="Status of hardware and access requests"
                    badge={`${proposals.total} total`}
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={proposals.byStatus} barCategoryGap="30%">
                            <XAxis
                                dataKey="name"
                                stroke="transparent"
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis hide />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                                {proposals.byStatus.map((_, i) => (
                                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.85} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

            </div>
        </div>
    );
}

function ChartCard({ title, subtitle, badge, children }) {
    return (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-5 hover:border-foreground/10 transition-colors">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                    <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium">{subtitle}</p>
                </div>
                {badge && (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest bg-muted text-muted-foreground px-2.5 py-1 rounded-full border border-border">
                        {badge}
                    </span>
                )}
            </div>
            <div>{children}</div>
        </div>
    );
}
