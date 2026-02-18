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
        IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        RESOLVED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
        REOPENED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        CLOSED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };

    return (
        <div className="min-h-screen rounded-xl bg-[#0B0E14] text-white p-6 md:p-12 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="space-y-6">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <span>←</span> Back to Dashboard
                    </Link>

                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-white/5 pb-8">
                        <div className="space-y-4 max-w-4xl">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColors[ticket.status] || statusColors.CLOSED}`}>
                                    {ticket.status.replace('_', ' ')}
                                </span>
                                <span className="text-gray-500 font-mono text-sm">#{ticket.id.slice(0, 8)}</span>
                                <span className="text-gray-500 text-sm hidden sm:inline">•</span>
                                <span className="text-gray-500 text-sm">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white leading-tight">
                                {ticket.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                                        {ticket.user.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-white hover:text-blue-400 transition-colors">{ticket.user.username || ticket.user.email}</span>
                                </div>

                                {(user.role === 'ADMIN' || user.role === 'AGENT') && ticket.user.phoneNumber && (
                                    <>
                                        <span className="text-gray-600">•</span>
                                        <a href={`tel:${ticket.user.phoneNumber}`} className="flex items-center gap-1 hover:text-white transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {ticket.user.phoneNumber}
                                        </a>
                                    </>
                                )}

                                <span className="text-gray-600">•</span>

                                <div className="flex items-center gap-2">
                                    <span>Priority:</span>
                                    <span className={`font-medium ${ticket.priority === 'HIGH' ? 'text-red-400' :
                                            ticket.priority === 'MEDIUM' ? 'text-amber-400' :
                                                'text-green-400'
                                        }`}>{ticket.priority}</span>
                                </div>

                                {(ticket.productName || ticket.componentName) && (
                                    <>
                                        <span className="text-gray-600">•</span>
                                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-gray-300">
                                            {ticket.productName || ticket.componentName}
                                        </span>
                                        {(user.role === 'ADMIN' || user.role === 'AGENT') && ticket.inventoryItem && (
                                            <InventoryInfoModal item={ticket.inventoryItem} />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Left 2/3 */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description Card */}
                        <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl p-6 md:p-8 shadow-sm transition-all">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Description</h3>
                            <div className="prose prose-invert max-w-none">
                                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                            </div>

                            {/* Category & Tags */}
                            {(ticket.category || ticket.tags.length > 0) && (
                                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/5">
                                    {ticket.category && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            {ticket.category.icon} {ticket.category.name}
                                        </span>
                                    )}
                                    {ticket.tags.map(({ tag }) => (
                                        <span key={tag.id} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 border border-white/10">
                                            #{tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
                                <div className="mt-8">
                                    <ImageGallery attachments={ticket.attachmentUrls} />
                                </div>
                            )}
                        </div>

                        {/* Recent Activity / Comments */}
                        <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                            <input type="radio" name="tabs" id="tab-activity" className="peer/activity hidden" defaultChecked />
                            <input type="radio" name="tabs" id="tab-history" className="peer/history hidden" />

                            <div className="flex border-b border-white/5 bg-white/[0.02]">
                                <label
                                    htmlFor="tab-activity"
                                    className="flex-1 px-6 py-4 text-sm font-medium text-center cursor-pointer transition-all peer-checked/activity:bg-transparent peer-checked/activity:text-white text-gray-500 hover:text-gray-300 border-b-2 border-transparent peer-checked/activity:border-blue-500"
                                >
                                    Activity & Comments
                                </label>
                                <label
                                    htmlFor="tab-history"
                                    className="flex-1 px-6 py-4 text-sm font-medium text-center cursor-pointer transition-all peer-checked/history:bg-transparent peer-checked/history:text-white text-gray-500 hover:text-gray-300 border-b-2 border-transparent peer-checked/history:border-blue-500"
                                >
                                    Audit History
                                </label>
                            </div>

                            {/* Activity Tab */}
                            <div className="hidden peer-checked/activity:block p-6 md:p-8 space-y-8">
                                {ticket.comments.length === 0 && (
                                    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                                        <div className="text-4xl mb-3">💬</div>
                                        <p className="text-gray-400">No comments yet.</p>
                                        <p className="text-sm text-gray-600">Start the conversation below.</p>
                                    </div>
                                )}

                                <div className="space-y-8">
                                    {ticket.comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-4 group">
                                            <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold mt-1 shadow-inner ${comment.user.role === 'ADMIN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                comment.user.role === 'AGENT' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                {comment.user.username?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-white">{comment.user.username || comment.user.email}</span>
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                        {comment.user.role}
                                                    </span>
                                                    <span className="text-xs text-gray-600 ml-auto">
                                                        {new Date(comment.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-5 text-gray-300 group-hover:bg-white/[0.07] transition-colors">
                                                    <p className="whitespace-pre-wrap">{comment.content}</p>
                                                    {comment.attachmentUrls && comment.attachmentUrls.length > 0 && (
                                                        <div className="mt-4">
                                                            <ImageGallery attachments={comment.attachmentUrls} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-white/5">
                                    <CommentForm ticketId={ticket.id} />
                                </div>
                            </div>

                            {/* History Tab */}
                            <div className="hidden peer-checked/history:block p-6 md:p-8">
                                <AuditTrail ticketId={ticket.id} />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Right 1/3 */}
                    <div className="lg:col-span-1 space-y-6">
                        <SLABadge ticket={ticket} />

                        <SimilarTickets
                            ticketDescription={ticket.description}
                            userRole={user.role}
                            ticketId={ticket.id}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
