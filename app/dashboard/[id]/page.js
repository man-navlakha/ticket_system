import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import CommentForm from "@/components/CommentForm";
import TicketActions from "@/components/TicketActions";
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const ticket = await prisma.ticket.findUnique({
        where: { id },
        select: { title: true }
    });

    return {
        title: ticket ? `Ticket: ${ticket.title}` : "Ticket Not Found"
    };
}

export default async function TicketPage({ params }) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
            user: { select: { username: true, email: true } },
            comments: {
                include: { user: { select: { username: true, email: true, role: true } } },
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!ticket) notFound();

    // Authorization check
    if (user.role === 'USER' && ticket.userId !== user.id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-2xl font-bold text-red-500">Unauthorized Access</h2>
                <p className="text-gray-400 mt-2">You do not have permission to view this ticket.</p>
                <Link href="/dashboard" className="mt-4 text-blue-400 hover:underline">Return to Dashboard</Link>
            </div>
        );
    }

    const statusColors = {
        OPEN: 'bg-green-500/10 text-green-400 border-green-500/20',
        IN_PROGRESS: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        RESOLVED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
        REOPENED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        CLOSED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Link
                href="/dashboard"
                className="group text-sm text-gray-400 hover:text-white mb-6 inline-flex items-center gap-2 transition-colors"
            >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
            </Link>

            {/* Ticket Header */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 backdrop-blur-sm shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-white leading-tight">{ticket.title}</h1>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[ticket.status] || statusColors.CLOSED}`}>
                                    {ticket.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                        <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">{ticket.description}</p>

                        {(ticket.productName || ticket.componentName) && (
                            <div className="flex flex-wrap gap-3 pt-2">
                                {ticket.productName && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Affected Product</span>
                                        <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-medium">
                                            {ticket.productName}
                                        </span>
                                    </div>
                                )}
                                {ticket.componentName && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Component</span>
                                        <span className="px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-sm font-medium">
                                            {ticket.componentName}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                                    {ticket.user.username?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span>{ticket.user.username || ticket.user.email}</span>
                            </div>
                            <span>•</span>
                            <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span className="font-medium text-gray-400">Priority: {ticket.priority}</span>
                        </div>

                        <TicketActions
                            ticketId={ticket.id}
                            currentStatus={ticket.status}
                            userRole={user.role}
                        />
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-8">
                <h2 className="text-xl font-bold border-b border-white/10 pb-4">Activity</h2>

                {/* Helper to show 'Start of discussion' */}
                {ticket.comments.length === 0 && (
                    <div className="text-center py-8 text-gray-500 italic">
                        No comments yet. Start the conversation below.
                    </div>
                )}

                <div className="space-y-6">
                    {ticket.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4">
                            <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold mt-1 ${comment.user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                                comment.user.role === 'AGENT' ? 'bg-purple-500/20 text-purple-400' :
                                    'bg-blue-500/20 text-blue-400'
                                }`}>
                                {comment.user.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white">{comment.user.username || comment.user.email}</span>
                                    <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                        {comment.user.role}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-auto">
                                        {new Date(comment.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl rounded-tl-none p-4 text-gray-300">
                                    {comment.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <CommentForm ticketId={ticket.id} />
            </div>
        </div>
    );
}
