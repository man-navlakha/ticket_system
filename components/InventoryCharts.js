'use client';

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, AreaChart, Area
} from 'recharts';

const STATUS_COLORS = {
    ACTIVE: '#22c55e',
    MAINTENANCE: '#f59e0b',
    RETIRED: '#ef4444',
    STORAGE: '#3b82f6',
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

export default function InventoryCharts({ items }) {
    const total = items.length;

    // — By Status
    const statusMap = {};
    items.forEach(i => {
        if (i.status) statusMap[i.status] = (statusMap[i.status] || 0) + 1;
    });
    const byStatus = Object.entries(statusMap).map(([name, value]) => ({
        name, value, fill: STATUS_COLORS[name] || '#6b7280'
    }));

    // — By Type
    const typeMap = {};
    items.forEach(i => {
        if (i.type) typeMap[i.type] = (typeMap[i.type] || 0) + 1;
    });
    const byType = Object.entries(typeMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // — By Brand
    const brandMap = {};
    items.forEach(i => {
        if (i.brand) brandMap[i.brand] = (brandMap[i.brand] || 0) + 1;
    });
    const byBrand = Object.entries(brandMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    // — Added per month (last 6 months)
    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        const count = items.filter(item => {
            const created = new Date(item.createdAt);
            return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
        }).length;
        return { month: label, assets: count };
    });

    // — Assigned vs Unassigned
    const assigned = items.filter(i => i.userId || i.assignedUser).length;
    const unassigned = total - assigned;
    const assignmentData = [
        { name: 'Assigned', value: assigned, fill: '#3b82f6' },
        { name: 'Unassigned', value: unassigned, fill: 'hsl(var(--muted-foreground))' },
    ].filter(d => d.value > 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 1. Assets Added Over Time — Area Chart */}
            <ChartCard
                title="Asset Growth"
                subtitle="New assets added per month (last 6 months)"
                badge={`${total} total`}
                className="lg:col-span-2"
            >
                <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={monthlyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="month"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip content={
                            ({ active, payload, label }) => active && payload?.length ? (
                                <div className="bg-card border border-border rounded-xl px-4 py-2.5 shadow-xl text-sm">
                                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest">{label}</p>
                                    <p className="text-foreground font-bold text-base">{payload[0].value} assets added</p>
                                </div>
                            ) : null
                        } />
                        <Area
                            type="monotone"
                            dataKey="assets"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            fill="url(#assetGrad)"
                            dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                            activeDot={{ r: 6, fill: '#3b82f6' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* 2. Status Distribution — Colored Bars */}
            <ChartCard
                title="Status Breakdown"
                subtitle="Asset lifecycle distribution"
            >
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={byStatus} barCategoryGap="30%">
                        <XAxis
                            dataKey="name"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis hide allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={44}>
                            {byStatus.map((entry, i) => (
                                <Cell key={i} fill={entry.fill} fillOpacity={0.9} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 pt-1">
                    {byStatus.map(s => (
                        <div key={s.name} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: s.fill }} />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.name}</span>
                            <span className="text-[10px] font-bold text-foreground">{s.value}</span>
                        </div>
                    ))}
                </div>
            </ChartCard>

            {/* 3. Assignment — Donut */}
            <ChartCard
                title="Assignment Rate"
                subtitle="Assigned vs unassigned assets"
            >
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <ResponsiveContainer width={160} height={160}>
                            <PieChart>
                                <Pie
                                    data={assignmentData}
                                    cx="50%" cy="50%"
                                    innerRadius={50} outerRadius={72}
                                    paddingAngle={3}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {assignmentData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-foreground">
                                {total > 0 ? Math.round((assigned / total) * 100) : 0}%
                            </span>
                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">in use</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        {assignmentData.map(a => (
                            <div key={a.name}>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{a.name}</span>
                                    <span className="text-sm font-bold text-foreground">{a.value}</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${(a.value / total) * 100 || 0}%`, background: a.fill }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ChartCard>

            {/* 4. By Type — Horizontal Bars */}
            <ChartCard
                title="Asset Types"
                subtitle="Distribution by hardware category"
            >
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={byType} layout="vertical" barCategoryGap="20%">
                        <XAxis type="number" hide allowDecimals={false} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={88}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={v => v.charAt(0) + v.slice(1).toLowerCase()}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                            {byType.map((_, i) => (
                                <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.85} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* 5. By Brand — Vertical Bars */}
            <ChartCard
                title="Top Brands"
                subtitle="Most common hardware vendors"
            >
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={byBrand} barCategoryGap="25%">
                        <XAxis
                            dataKey="name"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis hide allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                            {byBrand.map((_, i) => (
                                <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.85} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

        </div>
    );
}

function ChartCard({ title, subtitle, badge, children, className = '' }) {
    return (
        <div className={`p-6 rounded-2xl bg-card border border-border space-y-5 hover:border-foreground/10 transition-colors ${className}`}>
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
