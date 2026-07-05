import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getMobileApiUser } from '@/lib/mobile-auth';
import {
    DEVICE_DETAIL_SELECT,
    DEVICE_MAINTENANCE_SELECT,
    DEVICE_TICKET_SELECT,
    toDeviceDetail,
} from '@/lib/mobile-devices';

export async function GET(request, { params }) {
    const user = await getMobileApiUser(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const device = await prisma.inventoryItem.findFirst({
            where: {
                id,
                userId: user.id,
            },
            select: {
                ...DEVICE_DETAIL_SELECT,
                tickets: {
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' },
                    select: DEVICE_TICKET_SELECT,
                },
                maintenanceRecords: {
                    orderBy: { startDate: 'desc' },
                    select: DEVICE_MAINTENANCE_SELECT,
                },
            },
        });

        if (!device) {
            return NextResponse.json({ error: 'Device not found' }, { status: 404 });
        }

        return NextResponse.json({ device: toDeviceDetail(device) });
    } catch (error) {
        console.error('Mobile device detail error:', error);
        return NextResponse.json({ error: 'Failed to fetch device details' }, { status: 500 });
    }
}
