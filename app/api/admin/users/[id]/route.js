import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function DELETE(request, { params }) {
    const user = await getCurrentUser();

    // Only ADMIN and AGENT can delete users
    if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        // Prevent deleting yourself
        if (id === user.id) {
            return NextResponse.json({ error: 'You cannot delete yourself' }, { status: 400 });
        }

        // Check if user exists
        const targetUser = await prisma.user.findUnique({ where: { id } });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Agents cannot delete Admins
        if (user.role === 'AGENT' && targetUser.role === 'ADMIN') {
            return NextResponse.json({ error: 'Agents cannot delete Admins' }, { status: 403 });
        }

        // Delete all related records in dependency order, then the user
        await prisma.$transaction(async (tx) => {
            // 1. Comments (depend on tickets — delete before tickets)
            await tx.comment.deleteMany({ where: { userId: id } });

            // 2. Audit logs referencing the user
            await tx.auditLog.updateMany({
                where: { userId: id },
                data: { userId: null }
            });

            // 3. KB articles authored by the user
            await tx.knowledgeBaseArticle.deleteMany({ where: { createdById: id } });

            // 4. Proposals created by or assigned to the user
            await tx.proposal.deleteMany({
                where: { OR: [{ createdById: id }, { approverId: id }] }
            });

            // 5. Tickets owned by the user (comments on these are already gone)
            await tx.ticket.deleteMany({ where: { userId: id } });

            // 6. Finally delete the user
            await tx.user.delete({ where: { id } });
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error("Failed to delete user:", error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}

