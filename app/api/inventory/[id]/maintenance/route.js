import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(request, { params }) {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const json = await request.json();

    try {
        const record = await prisma.maintenanceRecord.create({
            data: {
                inventoryItemId: id,
                description: json.description,
                technician: user.username,
                cost: json.cost ? parseFloat(json.cost) : null,
                startDate: new Date(),
            }
        });

        // Also update item status to MAINTENANCE
        await prisma.inventoryItem.update({
            where: { id },
            data: { status: 'MAINTENANCE' }
        });

        return NextResponse.json(record);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create maintenance record' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params; // This is inventory ID, not record ID. 
    // Wait, usually PUT is for ending maintenance. 
    // Let's assume we pass the record ID in body or query, effectively finding the latest open record.

    try {
        // Find the active maintenance record for this item (one without endDate)
        const activeRecord = await prisma.maintenanceRecord.findFirst({
            where: {
                inventoryItemId: id,
                endDate: null
            }
        });

        if (activeRecord) {
            await prisma.maintenanceRecord.update({
                where: { id: activeRecord.id },
                data: {
                    endDate: new Date()
                }
            });
        }

        // Update item status back to ACTIVE
        await prisma.inventoryItem.update({
            where: { id },
            data: { status: 'ACTIVE' }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to close maintenance record' }, { status: 500 });
    }
}
