'use client';

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    INVENTORY_STATUS_CHART_COLORS,
    INVENTORY_STATUS_OPTIONS,
    getInventoryStatusLabel,
    normalizeInventoryStatus,
} from '@/lib/inventory-status';

const PALETTE = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-xl">
                <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label || payload[0]?.name}</p>
                <p className="text-lg font-bold text-foreground">{payload[0]?.value}</p>
            </div>
        );
    }

    return null;
};

export default function InventoryCharts({ items }) {
    const total = items.length;

    const statusMap = {};
    items.forEach((item) => {
        if (item.status) {
            const status = normalizeInventoryStatus(item.status);
            statusMap[status] = (statusMap[status] || 0) + 1;
        }
    });

    const byStatus = INVENTORY_STATUS_OPTIONS
        .filter((status) => statusMap[status] > 0)
        .map((status) => ({
            name: getInventoryStatusLabel(status),
            value: statusMap[status],
            fill: INVENTORY_STATUS_CHART_COLORS[status] || '#6b7280',
        }));

    const typeMap = {};
    items.forEach((item) => {
        if (item.type) {
            typeMap[item.type] = (typeMap[item.type] || 0) + 1;
        }
    });
    const byType = Object.entries(typeMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const brandMap = {};
    items.forEach((item) => {
        if (item.brand) {
            brandMap[item.brand] = (brandMap[item.brand] || 0) + 1;
        }
    });
    const byBrand = Object.entries(brandMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
        const label = date.toLocaleDateString('en-US', { month: 'short' });
        const count = items.filter((item) => {
            const created = new Date(item.createdAt);
            return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
        }).length;

        return { month: label, assets: count };
    });

    const assigned = items.filter((item) => item.userId || item.assignedUser).length;
    const unassigned = total - assigned;
    const assignmentData = [
        { name: 'Assigned', value: assigned, fill: '#3b82f6' },
        { name: 'Unassigned', value: unassigned, fill: 'hsl(var(--muted-foreground))' },
    ].filter((entry) => entry.value > 0);

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                        <Tooltip
                            content={({ active, payload, label }) =>
                                active && payload?.length ? (
                                    <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm shadow-xl">
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                                        <p className="text-base font-bold text-foreground">{payload[0].value} assets added</p>
                                    </div>
                                ) : null
                            }
                        />
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

            <ChartCard title="Status Breakdown" subtitle="Asset lifecycle distribution">
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
                            {byStatus.map((entry, index) => (
                                <Cell key={index} fill={entry.fill} fillOpacity={0.9} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 pt-1">
                    {byStatus.map((status) => (
                        <div key={status.name} className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ background: status.fill }} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{status.name}</span>
                            <span className="text-[10px] font-bold text-foreground">{status.value}</span>
                        </div>
                    ))}
                </div>
            </ChartCard>

            <ChartCard title="Assignment Rate" subtitle="Assigned vs unassigned assets">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <ResponsiveContainer width={160} height={160}>
                            <PieChart>
                                <Pie
                                    data={assignmentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={72}
                                    paddingAngle={3}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {assignmentData.map((entry, index) => (
                                        <Cell key={index} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-foreground">
                                {total > 0 ? Math.round((assigned / total) * 100) : 0}%
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">in use</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        {assignmentData.map((entry) => (
                            <div key={entry.name}>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{entry.name}</span>
                                    <span className="text-sm font-bold text-foreground">{entry.value}</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${(entry.value / total) * 100 || 0}%`, background: entry.fill }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ChartCard>

            <ChartCard title="Asset Types" subtitle="Distribution by hardware category">
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
                            tickFormatter={(value) => value.charAt(0) + value.slice(1).toLowerCase()}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                            {byType.map((_, index) => (
                                <Cell key={index} fill={PALETTE[index % PALETTE.length]} fillOpacity={0.85} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top Brands" subtitle="Most common hardware vendors">
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
                            {byBrand.map((_, index) => (
                                <Cell key={index} fill={PALETTE[index % PALETTE.length]} fillOpacity={0.85} />
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
        <div className={`space-y-5 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/10 ${className}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-0.5">
                    <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>
                    <p className="text-[11px] font-medium text-muted-foreground">{subtitle}</p>
                </div>
                {badge && (
                    <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {badge}
                    </span>
                )}
            </div>
            <div>{children}</div>
        </div>
    );
}
