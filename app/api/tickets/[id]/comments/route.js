import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { createAuditLog } from '@/lib/audit';

export async function POST(request, { params }) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: ticketId } = await params;

    try {
        const json = await request.json();
        const { content, attachmentUrls } = json;

        if (!content && (!attachmentUrls || attachmentUrls.length === 0)) {
            return NextResponse.json({ error: 'Content or attachment is required' }, { status: 400 });
        }

        // Verify ticket exists
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Check if this is the first response from staff (Agent or Admin)
        const isStaff = user.role === 'AGENT' || user.role === 'ADMIN';
        const isTicketCreator = ticket.userId === user.id;
        const shouldTrackFirstResponse = isStaff && !isTicketCreator && !ticket.firstResponseAt;

        // Create comment and update ticket in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const comment = await tx.comment.create({
                data: {
                    content,
                    ticketId,
                    userId: user.id,
                    attachmentUrls: attachmentUrls || []
                },
                include: {
                    user: {
                        select: { username: true, email: true, role: true }
                    }
                }
            });

            // Update firstResponseAt if this is the first staff response
            if (shouldTrackFirstResponse) {
                await tx.ticket.update({
                    where: { id: ticketId },
                    data: { firstResponseAt: new Date() }
                });
            }

            return comment;
        });

        // Create audit log
        await createAuditLog({
            entityType: 'Comment',
            entityId: result.id,
            action: 'CREATE',
            userId: user.id,
            ticketId,
            metadata: {
                hasAttachments: attachmentUrls && attachmentUrls.length > 0,
                isFirstStaffResponse: shouldTrackFirstResponse
            }
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
}

