
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter') || 'all';

        let where = {};
        if (filter === 'created') {
            where = { createdById: user.id };
        } else if (filter === 'assigned') {
            where = { approverId: user.id };
        } else {
            where = {
                OR: [
                    { createdById: user.id },
                    { approverId: user.id }
                ]
            };
        }

        const proposals = await prisma.proposal.findMany({
            where,
            include: {
                createdBy: {
                    select: { id: true, username: true, email: true } // Assuming username exists
                },
                approver: {
                    select: { id: true, username: true, email: true }
                },
                inventoryItem: {
                    select: { id: true, pid: true, type: true, brand: true, model: true, serialNumber: true }
                },
                ticket: {
                    select: { id: true, title: true, status: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(proposals);
    } catch (error) {
        console.error('Proposals fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, approverId } = body;

        if (!title || !description || !approverId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const proposal = await prisma.proposal.create({
            data: {
                title,
                description,
                createdById: user.id,
                approverId,
                createdById: user.id,
                approverId,
                inventoryItemId: body.inventoryItemId || null,
                ticketId: body.ticketId || null
            }
        });

        return NextResponse.json(proposal);
    } catch (error) {
        console.error('Proposal creation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
