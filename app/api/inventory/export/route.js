import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { buildInventoryExportCsv } from '@/lib/inventoryCsv';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const where = user.role === 'USER' ? { userId: user.id } : {};

    const items = await prisma.inventoryItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phoneNumber: true,
                    department: true,
                    location: true,
                    role: true,
                },
            },
        },
    });

    const csv = buildInventoryExportCsv(items);
    const dateStamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="inventory-export-${dateStamp}.csv"`,
            'Cache-Control': 'no-store',
        },
    });
}
