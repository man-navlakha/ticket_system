import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import CommentForm from "@/components/CommentForm";
import InventoryInfoModal from "@/components/InventoryInfoModal";
import TicketActions from "@/components/TicketActions";
import ImageGallery from "@/components/ImageGallery";
import SLABadge from "@/components/SLABadge";
import SimilarTickets from "@/components/SimilarTickets";
import ConvertToKBButton from "@/components/ConvertToKBButton";
import AuditTrail from "@/components/AuditTrail";
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
            user: { select: { username: true, email: true, phoneNumber: true } },
            inventoryItem: true,
            category: true,
            tags: {
                include: {
                    tag: true
                }
            },
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
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Link
                href="/dashboard"
                className="group text-sm text-gray-400 hover:text-white mb-6 inline-flex items-center gap-2 transition-colors"
            >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left 2/3 */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Ticket Header */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{ticket.title}</h1>
                                <span className={`self-start md:self-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[ticket.status] || statusColors.CLOSED}`}>
                                    {ticket.status.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Category and Tags */}
                            {(ticket.category || ticket.tags.length > 0) && (
                                <div className="flex flex-wrap gap-2">
                                    {ticket.category && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                            {ticket.category.icon} {ticket.category.name}
                                        </span>
                                    )}
                                    {ticket.tags.map(({ tag }) => (
                                        <span
                                            key={tag.id}
                                            className="px-2 py-1 rounded-md text-xs font-bold bg-white/5 text-gray-400 border border-white/10"
                                        >
                                            #{tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <p className="text-gray-300 text-base md:text-lg leading-relaxed whitespace-pre-wrap">{ticket.description}</p>

                            {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
                                <ImageGallery attachments={ticket.attachmentUrls} />
                            )}

                            {(ticket.productName || ticket.componentName) && (
                                <div className="flex flex-wrap gap-3 pt-2">
                                    {ticket.productName && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Affected Product</span>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-medium">
                                                    {ticket.productName}
                                                </span>
                                                {(user.role === 'ADMIN' || user.role === 'AGENT') && ticket.inventoryItem && (
                                                    <InventoryInfoModal item={ticket.inventoryItem} />
                                                )}
                                            </div>
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

                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-gray-500 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                                        {ticket.user.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="font-medium text-white">{ticket.user.username || ticket.user.email}</span>
                                </div>

                                {(user.role === 'ADMIN' || user.role === 'AGENT') && ticket.user.phoneNumber && (
                                    <>
                                        <span className="hidden sm:inline">•</span>
                                        <a href={`tel:${ticket.user.phoneNumber}`} className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {ticket.user.phoneNumber}
                                        </a>
                                    </>
                                )}

                                <span className="hidden sm:inline">•</span>
                                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="w-full sm:w-auto font-medium text-gray-400">Priority: <span className="text-white">{ticket.priority}</span></span>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
                                <TicketActions
                                    ticketId={ticket.id}
                                    currentStatus={ticket.status}
                                    userRole={user.role}
                                />
                                <ConvertToKBButton
                                    ticketId={ticket.id}
                                    ticketStatus={ticket.status}
                                    userRole={user.role}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tabbed Section for Comments & History */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <input type="radio" name="tabs" id="tab-activity" className="peer/activity hidden" defaultChecked />
                        <input type="radio" name="tabs" id="tab-history" className="peer/history hidden" />

                        <div className="flex border-b border-white/10">
                            <label
                                htmlFor="tab-activity"
                                className="flex-1 px-6 py-3 text-sm font-bold text-center cursor-pointer transition-all peer-checked/activity:bg-white/10 peer-checked/activity:text-white text-gray-400 hover:text-white"
                            >
                                💬 Activity
                            </label>
                            <label
                                htmlFor="tab-history"
                                className="flex-1 px-6 py-3 text-sm font-bold text-center cursor-pointer transition-all peer-checked/history:bg-white/10 peer-checked/history:text-white text-gray-400 hover:text-white"
                            >
                                📜 History
                            </label>
                        </div>

                        {/* Activity Tab */}
                        <div className="hidden peer-checked/activity:block p-6 space-y-6">
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
                                                {comment.attachmentUrls && comment.attachmentUrls.length > 0 && (
                                                    <ImageGallery attachments={comment.attachmentUrls} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <CommentForm ticketId={ticket.id} />
                        </div>

                        {/* History Tab */}
                        <div className="hidden peer-checked/history:block">
                            <AuditTrail ticketId={ticket.id} />
                        </div>
                    </div>
                </div>

                {/* Sidebar - Right 1/3 */}
                <div className="lg:col-span-1 space-y-6">
                    {/* SLA Tracker */}
                    <SLABadge ticket={ticket} />

                    {/* Similar Tickets */}
                    <SimilarTickets
                        ticketDescription={ticket.description}
                        userRole={user.role}
                        ticketId={ticket.id}
                    />
                </div>
            </div>
        </div>
    );
}
