import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { convertTicketToArticle } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only ADMIN and AGENT can convert tickets
        if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { ticketId } = await request.json();

        if (!ticketId) {
            return NextResponse.json(
                { error: 'Ticket ID is required' },
                { status: 400 }
            );
        }

        // Get the ticket with all details
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                comments: {
                    orderBy: { createdAt: 'asc' },
                },
                category: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Check if ticket is resolved
        if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
            return NextResponse.json(
                { error: 'Only resolved tickets can be converted to articles' },
                { status: 400 }
            );
        }

        // Use AI to convert ticket to article
        const articleData = await convertTicketToArticle(ticket);

        // Create the knowledge base article
        const article = await prisma.knowledgeBaseArticle.create({
            data: {
                title: articleData.title,
                summary: articleData.summary,
                content: articleData.content,
                originalTicketId: ticket.id,
                categoryId: ticket.categoryId,
                createdById: user.id,
                published: false, // Draft by default
                tags: {
                    create: ticket.tags.map(tt => ({
                        tagId: tt.tagId,
                    })),
                },
            },
            include: {
                category: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });

        // Create audit log
        await createAuditLog({
            entityType: 'KnowledgeBaseArticle',
            entityId: article.id,
            action: 'CREATE',
            userId: user.id,
            metadata: {
                source: 'ticket_conversion',
                originalTicketId: ticket.id,
            },
        });

        return NextResponse.json({
            article: {
                id: article.id,
                title: article.title,
                summary: article.summary,
                content: article.content,
                published: article.published,
                category: article.category,
                tags: article.tags.map(at => at.tag),
            },
        });
    } catch (error) {
        console.error('KB conversion error:', error);

        // Check for 503 Service Unavailable (Google AI overload)
        const isOverloaded = error.message.includes('503') || error.message.includes('overloaded');
        const status = isOverloaded ? 503 : 500;
        const message = isOverloaded
            ? 'AI service is currently overloaded. Please try again in a few moments.'
            : 'Failed to convert ticket to article';

        return NextResponse.json(
            { error: message, details: error.message },
            { status }
        );
    }
}
