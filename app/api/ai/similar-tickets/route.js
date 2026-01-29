import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { findSimilarTickets } from '@/lib/ai';

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only ADMIN and AGENT can access this feature
        if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { description, ticketId, limit = 5 } = await request.json();

        if (!description) {
            return NextResponse.json(
                { error: 'Description is required' },
                { status: 400 }
            );
        }

        const similarTickets = await findSimilarTickets(description, limit, ticketId);

        // Format response
        const formatted = similarTickets.map(ticket => ({
            id: ticket.id,
            title: ticket.title,
            description: ticket.description.substring(0, 200) + '...',
            status: ticket.status,
            priority: ticket.priority,
            category: ticket.category?.name || null,
            tags: ticket.tags.map(tt => tt.tag.name),
            createdAt: ticket.createdAt,
            resolvedAt: ticket.resolvedAt,
            lastComment: ticket.comments[0]?.content || null,
        }));

        return NextResponse.json({
            tickets: formatted,
            count: formatted.length,
        });
    } catch (error) {
        console.error('Similar tickets error:', error);
        return NextResponse.json(
            { error: 'Failed to find similar tickets' },
            { status: 500 }
        );
    }
}
