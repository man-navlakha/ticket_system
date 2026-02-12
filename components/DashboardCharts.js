'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function DashboardCharts({ data, userName }) {
    if (!data) return null;

    const { tickets, inventory, kb, team } = data;

    // Calculate Satisfaction Rate (Resolved vs Total)
    const resolvedTickets = tickets.byStatus.find(s => s.name === 'RESOLVED')?.value || 0;
    const closedTickets = tickets.byStatus.find(s => s.name === 'CLOSED')?.value || 0;
    const totalTicketsCount = tickets.byStatus.reduce((acc, curr) => acc + curr.value, 0);
    const successRate = totalTicketsCount > 0
        ? Math.round(((resolvedTickets + closedTickets) / totalTicketsCount) * 100)
        : 0;

    return (
        <div className="space-y-6 mb-12">

            {/* 1. Welcome Section & Top Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Welcome Card - Spans 2 columns on large screens */}
                <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8 shadow-xl border border-white/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <p className="text-gray-300 text-sm font-medium mb-1">Overview</p>
                            <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {userName || 'Admin'}</h2>
                            <p className="text-gray-300 max-w-md text-sm leading-relaxed">
                                Here's what's happening with your support tickets and inventory today.
                            </p>
                        </div>
                        <div className="mt-8">
                            <button className="text-white text-sm font-medium flex items-center gap-2 hover:gap-3 transition-all cursor-pointer">
                                View Full Report <span className="text-lg">→</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Satisfaction Rate Card */}
                <div className="bg-[#0f172a] rounded-2xl p-6 border border-white/5 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Resolution Rate</h3>
                        <p className="text-gray-400 text-xs mt-1">From all tickets</p>
                    </div>
                    <div className="flex items-center justify-center py-6 relative">
                        {/* Circular Progress Mockup */}
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-800" />
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent"
                                    className="text-blue-500 transition-all duration-1000 ease-out"
                                    strokeDasharray={351}
                                    strokeDashoffset={351 - (351 * successRate) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-2xl font-bold text-white">😊</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <div className="text-center w-full">
                            <span className="text-3xl font-bold text-white">{successRate}%</span>
                            <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Resolved</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1 */}
                <div className="bg-[#0f172a] rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Tickets</p>
                            <h4 className="text-2xl font-bold text-white mt-1">{totalTicketsCount}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            🎫
                        </div>
                    </div>
                    <div className="text-xs text-gray-400">
                        <span className="text-green-400 font-bold">+5%</span> since last month
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-[#0f172a] rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Inventory</p>
                            <h4 className="text-2xl font-bold text-white mt-1">{inventory.total}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            💻
                        </div>
                    </div>
                    <div className="text-xs text-gray-400">
                        <span className="text-white font-bold">{inventory.dellLaptops}</span> Dell Laptops
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-[#0f172a] rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">KB Articles</p>
                            <h4 className="text-2xl font-bold text-white mt-1">{kb.total}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            📚
                        </div>
                    </div>
                    <div className="text-xs text-gray-400">
                        <span className="text-white font-bold">{kb.published}</span> Published
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-[#0f172a] rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Team Size</p>
                            <h4 className="text-2xl font-bold text-white mt-1">{team.size}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            👥
                        </div>
                    </div>
                    <div className="text-xs text-gray-400">
                        Admins & Agents
                    </div>
                </div>
            </div>

            {/* 3. Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Ticket Volume (Area Chart) */}
                <div className="lg:col-span-2 bg-[#0f172a] rounded-2xl p-6 border border-white/5">
                    <h3 className="text-white font-bold text-lg mb-6">Ticket Volume</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={tickets.byStatus}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Active Users / Priority (Vertical Bar) */}
                <div className="bg-[#0f172a] rounded-2xl p-6 border border-white/5">
                    <h3 className="text-white font-bold text-lg mb-1">Priority Breakdown</h3>
                    <p className="text-gray-400 text-xs mb-6">Tickets by priority level</p>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tickets.byPriority} layout="vertical" barSize={20}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={60} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                                    {tickets.byPriority.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#4ade80', '#facc15', '#f87171'][index % 3]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Compact Inventory Brand Chart below */}
                    <div className="border-t border-white/5 mt-4 pt-4">
                        <h4 className="text-white text-sm font-semibold mb-3">Top Brands</h4>
                        <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={inventory.byBrand.slice(0, 5)}>
                                    <Bar dataKey="value" fill="#fff" radius={[4, 4, 4, 4]} barSize={8} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Bottom Row: Projects/Team Table */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-white font-bold text-lg">Team Members</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-green-400 text-2xl">✓</span>
                            <span className="text-gray-400 text-sm"><span className="font-bold text-white">{team.members?.length || 0} active</span> members</span>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-white/5">
                                <th className="px-6 py-4 font-medium">Member</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Completion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {team.members && team.members.map((member) => (
                                <tr key={member.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                                                {member.username?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium text-sm">{member.username}</div>
                                                <div className="text-gray-500 text-xs">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-white text-sm font-medium">{member.role}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${member.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3 justify-end">
                                            <span className="text-white text-sm font-bold">100%</span>
                                            <div className="w-24 h-1 bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 w-full rounded-full"></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
