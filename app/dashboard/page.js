import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Dashboard" };

import DashboardSearch from "@/components/DashboardSearch";

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

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-gray-400 mt-1">Manage, track, and resolve support requests.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <DashboardSearch />
                    <Link
                        href="/dashboard/create"
                        className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap"
                    >
                        + New Ticket
                    </Link>
                </div>
            </div>

            <div className="grid gap-4">
                {tickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                ))}
                {tickets.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                        <div className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            {search ? '🔍' : '🎫'}
                        </div>
                        <h3 className="font-bold text-lg text-white mb-1">
                            {search ? 'No matches found' : 'No tickets yet'}
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            {search ? `We couldn't find any tickets matching "${search}". Try a different term.` : "Create your first support ticket to get started."}
                        </p>
                        {search && (
                            <Link href="/dashboard" className="mt-4 inline-block text-blue-400 hover:text-blue-300 text-sm">
                                Clear Search
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function TicketCard({ ticket }) {
    const statusColors = {
        OPEN: 'bg-green-500/10 text-green-400 border-green-500/20',
        IN_PROGRESS: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        RESOLVED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
        REOPENED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        CLOSED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };

    const priorityColors = {
        LOW: 'text-gray-400',
        MEDIUM: 'text-blue-400',
        HIGH: 'text-red-400',
    };

    return (
        <Link
            href={`/dashboard/${ticket.id}`}
            className="group block p-5 sm:p-6 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-200"
        >
            <div className="flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 w-full">
                    <h3 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">
                        {ticket.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                        {ticket.description}
                    </p>
                </div>
                <div className={`self-start shrink-0 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[ticket.status] || statusColors.CLOSED}`}>
                    {ticket.status.replace('_', ' ')}
                </div>
            </div>

            {(ticket.productName || ticket.componentName) && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {ticket.productName && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] uppercase font-bold tracking-wider">
                            {ticket.productName}
                        </span>
                    )}
                    {ticket.componentName && (
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] uppercase font-bold tracking-wider">
                            {ticket.componentName}
                        </span>
                    )}
                </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-gray-500 border-t border-white/5 pt-4 sm:border-0 sm:pt-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-400">ID:</span>
                    <span className="font-mono text-gray-600">{ticket.id.slice(0, 8)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-400">Created:</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-400">Priority:</span>
                    <span className={priorityColors[ticket.priority]}>{ticket.priority}</span>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto pt-2 sm:pt-0 border-t border-white/5 sm:border-0 justify-end sm:justify-start">
                    <svg className="w-4 h-4 ml-auto sm:ml-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{ticket._count.comments} Comments</span>
                </div>
            </div>
        </Link>
    );
}
