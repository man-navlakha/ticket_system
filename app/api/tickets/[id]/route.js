import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { createAuditLog } from '@/lib/audit';

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
        const changes = {};

        if (status && isPrivileged) {
            updateData.status = status;
            changes.status = { from: ticket.status, to: status };

            // Track SLA for resolved tickets
            if ((status === 'RESOLVED' || status === 'CLOSED') && !ticket.resolvedAt) {
                updateData.resolvedAt = new Date();
                changes.resolvedAt = { from: null, to: new Date().toISOString() };
            }
        }

        if (json.resolutionDetails && isPrivileged) {
            updateData.resolutionDetails = json.resolutionDetails;
            // Also add as a system comment for visibility
            await prisma.comment.create({
                data: {
                    content: `**Resolution Notes:**\n${json.resolutionDetails}`,
                    ticketId: id,
                    userId: user.id
                }
            });
        }

        if (priority && (isOwner || isPrivileged)) {
            updateData.priority = priority;
            changes.priority = { from: ticket.priority, to: priority };
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: updateData
        });

        // Create audit log
        await createAuditLog({
            entityType: 'Ticket',
            entityId: id,
            action: status ? 'STATUS_CHANGE' : 'UPDATE',
            changes,
            userId: user.id,
            ticketId: id
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
            where: { id },
            select: {
                id: true,
                title: true,
                userId: true,
                status: true
            }
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

        // Create audit log before deletion
        await createAuditLog({
            entityType: 'Ticket',
            entityId: id,
            action: 'DELETE',
            userId: user.id,
            metadata: {
                title: ticket.title,
                status: ticket.status
            }
        });

        await prisma.ticket.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
    }
}

