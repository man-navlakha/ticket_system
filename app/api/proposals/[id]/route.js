
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function PATCH(request, context) {
    try {
        const { params } = context;
        const { id } = await params;
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { status, adminComment } = body;

        const proposal = await prisma.proposal.findUnique({
            where: { id }
        });

        if (!proposal) {
            return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
        }

        // Authorization: Only assigned approver or ADMIN can change status
        if (proposal.approverId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updatedProposal = await prisma.proposal.update({
            where: { id },
            data: {
                status,
                adminComment
            }
        });

        return NextResponse.json(updatedProposal);

    } catch (error) {
        console.error('Proposal update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
