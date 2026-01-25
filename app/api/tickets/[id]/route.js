import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function PATCH(request, { params }) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const json = await request.json();
        const { status, priority } = json;

        const ticket = await prisma.ticket.findUnique({
            where: { id }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Authorization: Only owner can update priority, Agents/Admins can update status
        const isOwner = ticket.userId === user.id;
        const isPrivileged = user.role === 'ADMIN' || user.role === 'AGENT';

        if (!isOwner && !isPrivileged) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updateData = {};
        if (status && isPrivileged) updateData.status = status;
        if (priority && (isOwner || isPrivileged)) updateData.priority = priority;

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedTicket);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Only owner or Admin/Agent can delete
        const isOwner = ticket.userId === user.id;
        const isPrivileged = user.role === 'ADMIN' || user.role === 'AGENT';

        if (!isOwner && !isPrivileged) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.ticket.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
    }
}
