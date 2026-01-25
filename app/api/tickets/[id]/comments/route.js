import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(request, { params }) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: ticketId } = await params;

    try {
        const json = await request.json();
        const { content } = json;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Verify ticket exists
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                ticketId,
                userId: user.id
            },
            include: {
                user: {
                    select: { username: true, email: true, role: true }
                }
            }
        });

        return NextResponse.json(comment);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
}
