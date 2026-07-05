import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

/**
 * GET /api/inventory/serial-number?serialNumber=PF3GAVH7
 *
 * Returns the inventory PID for a hardware serial number. The inventory
 * record is checked first; uploaded system reports are used as a fallback.
 */
export async function GET(request) {
    const serialNumber = request.nextUrl.searchParams.get('serialNumber')?.trim();

    if (!serialNumber) {
        return NextResponse.json({ error: 'Serial number is required' }, { status: 400 });
    }

    try {
        const item = await prisma.inventoryItem.findFirst({
            where: {
                serialNumber: {
                    equals: serialNumber,
                    mode: 'insensitive',
                },
            },
            select: {
                pid: true,
                type: true,
                brand: true,
                model: true,
                serialNumber: true,
            },
        });

        if (item) {
            return NextResponse.json({
                pid: item.pid,
                serialNumber: item.serialNumber,
                source: 'inventory',
                device: {
                    type: item.type,
                    brand: item.brand,
                    model: item.model,
                },
            });
        }

        const report = await prisma.systemReport.findFirst({
            where: {
                serialNumber: {
                    equals: serialNumber,
                    mode: 'insensitive',
                },
            },
            select: {
                serialNumber: true,
                inventoryItem: {
                    select: {
                        pid: true,
                        type: true,
                        brand: true,
                        model: true,
                    },
                },
            },
        });

        if (report?.inventoryItem) {
            return NextResponse.json({
                pid: report.inventoryItem.pid,
                serialNumber: report.serialNumber,
                source: 'systemReport',
                device: {
                    type: report.inventoryItem.type,
                    brand: report.inventoryItem.brand,
                    model: report.inventoryItem.model,
                },
            });
        }

        return NextResponse.json(
            { error: 'PID not found for this serial number', serialNumber },
            { status: 404 },
        );
    } catch (error) {
        console.error('Serial number lookup error:', error);
        return NextResponse.json({ error: 'Failed to fetch PID' }, { status: 500 });
    }
}
