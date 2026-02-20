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
        select: { title: true, status: true, priority: true }
    });

    if (!ticket) return { title: "Ticket Not Found" };

    return {
        title: `Ticket: ${ticket.title}`,
        description: `Status: ${ticket.status} | Priority: ${ticket.priority} - Enterprise IT support ticket in Man's Support Desk workspace.`,
        openGraph: {
            title: ticket.title,
            description: `IT Support Ticket #${id.slice(0, 8)}`,
        }
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
        <div className="min-h-screen rounded-xl bg-background text-foreground p-6 md:p-12 font-sans transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="space-y-6">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span>←</span> Back to Dashboard
                    </Link>

                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-border pb-8">
                        <div className="space-y-4 max-w-4xl">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColors[ticket.status] || statusColors.CLOSED}`}>
                                    {ticket.status.replace('_', ' ')}
                                </span>
                                <span className="text-muted-foreground font-mono text-sm">#{ticket.id.slice(0, 8)}</span>
                                <span className="text-muted-foreground text-sm hidden sm:inline">•</span>
                                <span className="text-muted-foreground text-sm">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-light tracking-tight text-foreground leading-tight">
                                {ticket.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                                        {ticket.user.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-foreground hover:text-primary transition-colors">{ticket.user.username || ticket.user.email}</span>
                                </div>

                                {(user.role === 'ADMIN' || user.role === 'AGENT') && ticket.user.phoneNumber && (
                                    <>
                                        <span className="text-muted-foreground">•</span>
                                        <a href={`tel:${ticket.user.phoneNumber}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {ticket.user.phoneNumber}
                                        </a>
                                    </>
                                )}

                                <span className="text-muted-foreground">•</span>

                                <div className="flex items-center gap-2">
                                    <span>Priority:</span>
                                    <span className={`font-medium ${ticket.priority === 'HIGH' ? 'text-red-500' :
                                        ticket.priority === 'MEDIUM' ? 'text-amber-500' :
                                            'text-green-500'
                                        }`}>{ticket.priority}</span>
                                </div>

                                {(ticket.productName || ticket.componentName) && (
                                    <>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="px-2 py-0.5 rounded bg-muted/50 border border-border text-xs text-muted-foreground">
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
                        <div className="bg-card border border-border hover:border-primary/20 rounded-2xl p-6 md:p-8 shadow-sm transition-all">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Description</h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                                <p className="text-foreground/90 text-lg leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                            </div>

                            {/* Category & Tags */}
                            {(ticket.category || ticket.tags.length > 0) && (
                                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
                                    {ticket.category && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                            {ticket.category.icon} {ticket.category.name}
                                        </span>
                                    )}
                                    {ticket.tags.map(({ tag }) => (
                                        <span key={tag.id} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground border border-border">
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
                        <div className="bg-card border border-border hover:border-primary/20 rounded-2xl overflow-hidden shadow-sm">
                            <input type="radio" name="tabs" id="tab-activity" className="peer/activity hidden" defaultChecked />
                            <input type="radio" name="tabs" id="tab-history" className="peer/history hidden" />

                            <div className="flex border-b border-border bg-muted/20">
                                <label
                                    htmlFor="tab-activity"
                                    className="flex-1 px-6 py-4 text-sm font-medium text-center cursor-pointer transition-all peer-checked/activity:bg-card peer-checked/activity:text-foreground text-muted-foreground hover:text-foreground border-b-2 border-transparent peer-checked/activity:border-primary"
                                >
                                    Activity & Comments
                                </label>
                                <label
                                    htmlFor="tab-history"
                                    className="flex-1 px-6 py-4 text-sm font-medium text-center cursor-pointer transition-all peer-checked/history:bg-card peer-checked/history:text-foreground text-muted-foreground hover:text-foreground border-b-2 border-transparent peer-checked/history:border-primary"
                                >
                                    Audit History
                                </label>
                            </div>

                            {/* Activity Tab */}
                            <div className="hidden peer-checked/activity:block p-6 md:p-8 space-y-8">
                                {ticket.comments.length === 0 && (
                                    <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/10">
                                        <div className="text-4xl mb-3">💬</div>
                                        <p className="text-muted-foreground">No comments yet.</p>
                                        <p className="text-sm text-muted-foreground/80">Start the conversation below.</p>
                                    </div>
                                )}

                                <div className="space-y-8">
                                    {ticket.comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-4 group">
                                            <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold mt-1 shadow-inner ${comment.user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                comment.user.role === 'AGENT' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                                    'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                }`}>
                                                {comment.user.username?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-foreground">{comment.user.username || comment.user.email}</span>
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                                                        {comment.user.role}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground ml-auto">
                                                        {new Date(comment.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="bg-muted/30 border border-border rounded-2xl rounded-tl-none p-5 text-foreground/90 group-hover:bg-muted/50 transition-colors">
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

                                <div className="pt-6 border-t border-border">
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
