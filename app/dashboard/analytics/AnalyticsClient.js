'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsClient({ stats }) {
    if (!stats) return <div className="text-center py-20 text-muted-foreground">Failed to load analytics.</div>;

    const { tickets, inventory, team, proposals } = stats;

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold tracking-tighter text-foreground mb-2">Analytics</h1>
                <p className="text-muted-foreground font-medium tracking-tight">Enterprise performance and asset distribution metrics.</p>
            </div>

            {/* Grid for Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 1. Laptop Brands */}
                <ChartCard title="Asset Brands" subtitle="Distribution of hardware brands across inventory.">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={inventory.byBrand}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                cursor={{ fill: 'hsl(var(--muted))' }}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* 2. Ownership Distribution */}
                <ChartCard title="Ownership" subtitle="Company owned vs. Rented vs. Employee owned.">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={inventory.byOwnership}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {inventory.byOwnership.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* 3. Tickets by Status */}
                <ChartCard title="Ticket Status" subtitle="Overview of ticket lifecycle distribution.">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={tickets.byStatus} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" stroke="#888888" fontSize={10} width={80} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                cursor={{ fill: 'hsl(var(--muted))' }}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* 4. Team Distribution */}
                <ChartCard title="Team Roles" subtitle="Breakdown of workspace members by role.">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={team.byRole}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {team.byRole.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* 5. Proposal Status */}
                <ChartCard title="Proposal Flow" subtitle="Status of hardware and access requests.">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={proposals.byStatus}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                cursor={{ fill: 'hsl(var(--muted))' }}
                            />
                            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

function ChartCard({ title, subtitle, children }) {
    return (
        <div className="p-8 rounded-2xl bg-card border border-border space-y-6 hover:border-sidebar-primary/20 transition-colors group shadow-sm">
            <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{subtitle}</p>
            </div>
            <div className="pt-4 h-[300px]">
                {children}
            </div>
        </div>
    );
}
