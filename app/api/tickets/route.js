import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { sendNewTicketNotification } from '@/lib/email';

export async function GET(request) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let where = {};
    // If user is just a standard USER, they only see their tickets
    if (user.role === 'USER') {
        where = { userId: user.id };
    }

    try {
        const tickets = await prisma.ticket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { username: true, email: true }
                }
            }
        });

        return NextResponse.json(tickets);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
}

export async function POST(request) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const json = await request.json();
        const {
            title,
            description,
            priority,
            inventoryItemId,
            productName,
            componentName,
            isPersonalIssue,
            attachmentUrls,
            categoryId,
            tagIds,
            useAITriage = true
        } = json;

        if (!title || !description) {
            return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
        }

        // If not a personal issue, check if user has inventory items
        if (!isPersonalIssue && (!attachmentUrls || attachmentUrls.length === 0)) {
            const inventoryCount = await prisma.inventoryItem.count({
                where: { userId: user.id }
            });

            if (inventoryCount === 0) {
                return NextResponse.json({
                    error: 'You do not have any linked devices. Please select "Personal Issue" if this is a custom product.'
                }, { status: 403 });
            }
        }

        // AI Triage (if enabled and no manual category/priority set)
        let aiSuggestedPriority = null;
        let aiSuggestedCategoryId = null;
        let finalPriority = priority || 'MEDIUM';
        let finalCategoryId = categoryId || null;
        let finalTagIds = tagIds || [];

        if (useAITriage && !priority) {
            try {
                const { triageTicket } = await import('@/lib/ai');
                const suggestions = await triageTicket(title, description);

                if (suggestions.priority) {
                    aiSuggestedPriority = suggestions.priority;
                    finalPriority = suggestions.priority;
                }

                if (suggestions.category && !categoryId) {
                    const category = await prisma.category.findUnique({
                        where: { name: suggestions.category }
                    });
                    if (category) {
                        aiSuggestedCategoryId = category.id;
                        finalCategoryId = category.id;
                    }
                }

                if (suggestions.tags && suggestions.tags.length > 0 && finalTagIds.length === 0) {
                    const tags = await prisma.tag.findMany({
                        where: { name: { in: suggestions.tags } }
                    });
                    finalTagIds = tags.map(t => t.id);
                }
            } catch (aiError) {
                console.error('AI triage failed, continuing without it:', aiError);
            }
        }

        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                priority: finalPriority,
                status: 'OPEN',
                userId: user.id,
                inventoryItemId: inventoryItemId || null,
                productName: productName || null,
                componentName: componentName || null,
                attachmentUrls: attachmentUrls || [],
                categoryId: finalCategoryId,
                aiSuggestedPriority,
                aiSuggestedCategoryId,
                tags: finalTagIds.length > 0 ? {
                    create: finalTagIds.map(tagId => ({ tagId }))
                } : undefined
            },
            include: {
                category: true,
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        });

        // Create audit log
        const { createAuditLog } = await import('@/lib/audit');
        await createAuditLog({
            entityType: 'Ticket',
            entityId: ticket.id,
            action: 'CREATE',
            userId: user.id,
            ticketId: ticket.id,
            metadata: {
                title: ticket.title,
                priority: ticket.priority,
                categoryId: ticket.categoryId,
                aiSuggested: !!aiSuggestedPriority
            }
        });

        // 🚨 Notify Agents & Admins (Asynchronously)
        (async () => {
            try {
                const staff = await prisma.user.findMany({
                    where: {
                        role: { in: ['AGENT', 'ADMIN'] },
                        status: 'ACTIVE'
                    },
                    select: { email: true }
                });

                if (staff.length > 0) {
                    const notificationData = {
                        id: ticket.id,
                        title: ticket.title,
                        description: ticket.description,
                        priority: ticket.priority,
                        userEmail: user.email,
                        userName: user.username || user.email
                    };

                    for (const person of staff) {
                        await sendNewTicketNotification(person.email, notificationData);
                    }
                }
            } catch (notifyError) {
                console.error('Notification background error:', notifyError);
            }
        })();

        return NextResponse.json(ticket);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }
}
