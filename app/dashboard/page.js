import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/stats";
import DashboardSearch from "@/components/DashboardSearch";
import PageHeader from "@/components/PageHeader";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }) {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/auth/login");
    }

    const { search } = await searchParams || {};

    // Base where clause based on role
    let where = user.role === 'USER' ? { userId: user.id } : {};

    // Add search filter if present
    if (search) {
        where = {
            AND: [
                where, // Keep the role restriction
                {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                        { id: { contains: search, mode: 'insensitive' } },
                        { productName: { contains: search, mode: 'insensitive' } }
                    ]
                }
            ]
        };
    }

    const tickets = await prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { comments: true }
            }
        }
    });

    let totalTickets = 0;
    let inProgress = 0;
    let resolved = 0;

    // Only fetch stats for admin/agent, or maybe for everyone but filtered? 
    // The design implies it's a general dashboard. existing code restricted stats to ADMIN/AGENT.
    // I will keep the restriction or maybe show limited stats for USER. 
    // The image shows "Dashboard" which implies a high level view. 
    // If USER, they see their own stats.

    // Check if we can get stats. existing getDashboardStats returns global stats. 
    // If it's a USER, we might want to count from their `tickets` array if we don't have a specific user stats function.
    // But getDashboardStats is global.
    // Let's use the `tickets` length for "Total Tickets" for now if logic is complex, 
    // but better to try to get accurate numbers.

    if (user.role === 'ADMIN' || user.role === 'AGENT') {
        const statsData = await getDashboardStats();
        if (statsData?.tickets?.byStatus) {
            totalTickets = statsData.tickets.byStatus.reduce((acc, curr) => acc + curr.value, 0);
            inProgress = statsData.tickets.byStatus.find(s => s.name === 'IN_PROGRESS')?.value || 0;
            resolved = statsData.tickets.byStatus.find(s => s.name === 'RESOLVED' || s.name === 'CLOSED')?.value || 0;
        }
    } else {
        // Simple counts from the fetched tickets (which are filtered by user)
        totalTickets = tickets.length;
        inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length;
        resolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    }

    return (
        <div className="min-h-screen rounded-xl bg-[#0B0E14] text-white p-6 md:p-12 font-sans">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-5xl font-light tracking-tight mb-2">Dashboard</h1>
                        <p className="text-gray-400 text-lg">Manage and track support tickets</p>
                    </div>
                    <div>
                        <Link
                            href="/dashboard/create"
                            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
                        >
                            New Ticket
                        </Link>
                    </div>
                </div>

                {/* Search */}
                <div>
                    <DashboardSearch className="w-full text-lg" />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-white/5">
                    <StatCard
                        label="TOTAL TICKETS"
                        value={totalTickets}
                        trend="+2 this week"
                        trendUp={true}
                    />
                    <StatCard
                        label="IN PROGRESS"
                        value={inProgress}
                        trend="-1 from yesterday"
                        trendUp={false}
                    />
                    <StatCard
                        label="RESOLVED"
                        value={resolved}
                        trend="+3 this week"
                        trendUp={true}
                    />
                    <StatCard
                        label="AVG. RESPONSE"
                        value="2.4h"
                        trend="Improved"
                        trendUp={true}
                    />
                </div>

                {/* Recent Activity */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-light text-gray-300">Recent Activity</h2>

                    <div className="space-y-4">
                        {tickets.map((ticket) => (
                            <TicketCard key={ticket.id} ticket={ticket} />
                        ))}
                        {tickets.length === 0 && (
                            <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
                                <div className="text-gray-500 mb-4 text-4xl">🔍</div>
                                <h3 className="text-xl font-medium text-white mb-2">No tickets found</h3>
                                <p className="text-gray-500">
                                    {search ? `No matches for "${search}"` : "Get started by creating a new ticket."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, trend, trendUp }) {
    return (
        <div className="flex flex-col justify-between py-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{label}</h3>
            <div className="flex items-end justify-between">
                <span className="text-5xl font-light text-white leading-none">{value}</span>
                <span className={`text-xs font-medium mb-1 ${trendUp ? 'text-gray-400' : 'text-gray-500'}`}>
                    {trend}
                </span>
            </div>
        </div>
    );
}

function TicketCard({ ticket }) {
    const statusConfig = {
        OPEN: { color: 'text-green-400', label: 'Open' },
        IN_PROGRESS: { color: 'text-amber-400', label: 'In Progress' },
        RESOLVED: { color: 'text-blue-400', label: 'Resolved' },
        CLOSED: { color: 'text-gray-400', label: 'Closed' },
        CANCELLED: { color: 'text-red-400', label: 'Cancelled' }
    };

    const config = statusConfig[ticket.status] || { color: 'text-gray-400', label: ticket.status };

    // Priority Dot Color
    const priorityColor = {
        HIGH: 'bg-red-500',
        MEDIUM: 'bg-amber-500',
        LOW: 'bg-green-500'
    }[ticket.priority] || 'bg-gray-500';

    return (
        <Link href={`/dashboard/${ticket.id}`} className="block group">
            <div className="bg-[#141820] hover:bg-[#1A1F29] border border-transparent hover:border-white/5 rounded-2xl p-6 transition-all duration-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {ticket.title}
                        </h3>
                        <span className={`text-sm font-medium ${config.color}`}>
                            {config.label}
                        </span>
                    </div>

                    {/* Priority Badge on Right */}
                    <div className="flex items-center gap-2 md:pl-4">
                        <div className={`w-2 h-2 rounded-full ${priorityColor}`}></div>
                        <span className="text-sm text-gray-400">{ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1).toLowerCase()}</span>
                    </div>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-4xl line-clamp-2">
                    {ticket.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                    {(ticket.productName || ticket.componentName) && (
                        <div className="px-3 py-1 rounded-md bg-white/5 text-gray-300 font-medium">
                            {ticket.productName || ticket.componentName || 'General'}
                        </div>
                    )}

                    <span className="text-gray-500 font-mono">ID: {ticket.id.slice(0, 8)}</span>
                    <span className="text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>

                    <div className="flex items-center gap-1.5 text-gray-500 ml-auto md:ml-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{ticket._count.comments}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
