import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getMobileApiUser } from '@/lib/mobile-auth';
import { DEVICE_LIST_SELECT, toDeviceSummary } from '@/lib/mobile-devices';

export async function GET(request) {
    const user = await getMobileApiUser(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const devices = await prisma.inventoryItem.findMany({
            where: { userId: user.id },
            orderBy: [
                { assignedDate: 'desc' },
                { createdAt: 'desc' },
            ],
            select: DEVICE_LIST_SELECT,
        });

        return NextResponse.json({
            count: devices.length,
            devices: devices.map(toDeviceSummary),
        });
    } catch (error) {
        console.error('Mobile devices list error:', error);
        return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
    }
}
