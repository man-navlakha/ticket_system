import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import TrackClient from './TrackClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { token } = await params;
    const ticket = await prisma.ticket.findUnique({
        where: { shareToken: token },
        select: { id: true, title: true, status: true },
    });
    if (!ticket) return { title: 'Ticket not found | Excellent IT' };
    return {
        title: `Ticket #${ticket.id.slice(0, 8)} — ${ticket.status} | Excellent IT`,
        robots: { index: false, follow: false },
    };
}

export default async function TrackPage({ params }) {
    const { token } = await params;

    const ticket = await prisma.ticket.findUnique({
        where: { shareToken: token },
        include: {
            user: {
                select: { id: true, username: true, firstName: true, lastName: true, email: true },
            },
            inventoryItem: {
                select: { pid: true, brand: true, model: true },
            },
            category: { select: { name: true, color: true } },
            comments: {
                orderBy: { createdAt: 'asc' },
                include: {
                    user: { select: { username: true, firstName: true, lastName: true } },
                },
            },
        },
    });

    if (!ticket) notFound();

    const sessionUser = await getCurrentUser();
    const isLoggedIn = Boolean(sessionUser);

    // Reporter's display name — used as the "Reported by" line. Falls back
    // sensibly if username/first/last aren't set.
    const reporterDisplayName =
        ticket.user?.username ||
        [ticket.user?.firstName, ticket.user?.lastName].filter(Boolean).join(' ') ||
        ticket.user?.email ||
        'Unknown';

    // Public fields (always visible). Sensitive fields are sent too but the
    // client renders them with a blur overlay until login. This is a UX
    // deterrent, not a privacy guarantee — anyone sufficiently motivated can
    // open devtools. If true secrecy matters, gate at the API layer.
    const publicData = {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        device: ticket.inventoryItem
            ? `${ticket.inventoryItem.brand || ''} ${ticket.inventoryItem.model || ''} (${ticket.inventoryItem.pid})`.trim()
            : null,
        category: ticket.category?.name || null,
        slaBreached: ticket.slaBreached,
    };

    const gatedData = {
        description: ticket.description,
        reporterName: reporterDisplayName,
        reporterEmail: ticket.user?.email || null,
        resolutionDetails: ticket.resolutionDetails || null,
        comments: ticket.comments.map((c) => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt.toISOString(),
            authorName:
                c.user?.username ||
                [c.user?.firstName, c.user?.lastName].filter(Boolean).join(' ') ||
                'Staff',
        })),
    };

    return (
        <TrackClient
            token={token}
            publicData={publicData}
            gatedData={gatedData}
            isLoggedIn={isLoggedIn}
        />
    );
}
