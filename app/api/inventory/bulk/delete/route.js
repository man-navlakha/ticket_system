import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function DELETE(request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        const result = await prisma.inventoryItem.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });

        return NextResponse.json({
            message: `Successfully deleted ${result.count} items`,
            count: result.count
        });

    } catch (error) {
        console.error('Bulk delete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
