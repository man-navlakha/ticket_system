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
        const { title, description, priority, inventoryItemId, productName, componentName, isPersonalIssue } = json;

        if (!title || !description) {
            return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
        }

        // If not a personal issue, check if user has inventory items
        if (!isPersonalIssue) {
            const inventoryCount = await prisma.inventoryItem.count({
                where: { userId: user.id }
            });

            if (inventoryCount === 0) {
                return NextResponse.json({
                    error: 'You do not have any linked devices. Please select "Personal Issue" if this is a custom product.'
                }, { status: 403 });
            }
        }

        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM',
                status: 'OPEN',
                userId: user.id,
                inventoryItemId: inventoryItemId || null,
                productName: productName || null,
                componentName: componentName || null
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
