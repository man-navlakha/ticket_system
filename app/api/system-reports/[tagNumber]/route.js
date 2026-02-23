import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

// GET /api/system-reports/[tagNumber]
export async function GET(request, { params }) {
    const { tagNumber } = await params;

    try {
        const report = await prisma.systemReport.findFirst({
            where: { tagNumber }
        });

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        return NextResponse.json(report);
    } catch (error) {
        console.error('Error fetching system report:', error);
        return NextResponse.json({ error: 'Error fetching system report' }, { status: 500 });
    }
}

// POST or PUT (Upsert) /api/system-reports/[tagNumber]
export async function POST(request, { params }) {
    const { tagNumber } = await params;
    const json = await request.json();

    try {
        // First check if an inventory item exists for this tagNumber
        let inventoryItem = await prisma.inventoryItem.findUnique({
            where: { pid: tagNumber }
        });

        // If inventory item doesn't exist, we optionally create one 
        // to ensure the relation constraint is satisfied
        if (!inventoryItem) {
            inventoryItem = await prisma.inventoryItem.create({
                data: {
                    pid: tagNumber,
                    type: 'COMPUTER',
                    status: 'ACTIVE',
                    ownership: 'COMPANY'
                }
            });
        }

        const data = {
            tagNumber,
            inventoryItemId: inventoryItem.id,
            userName: json.userName || null,
            reportDate: json.reportDate || null,
            systemName: json.systemName || null,
            manufacturer: json.manufacturer || null,
            model: json.model || null,
            serialNumber: json.serialNumber || null,
            windowsEdition: json.windowsEdition || null,
            windowsVersion: json.windowsVersion || null,
            buildNumber: json.buildNumber || null,
            processor: json.processor || null,
            totalRamGB: json.totalRamGB !== undefined ? parseFloat(json.totalRamGB) : null,
            ramDetails: json.ramDetails || null,
            gpuDetails: json.gpuDetails || null,
            diskDetails: json.diskDetails || null
        };

        const upsertedReport = await prisma.systemReport.upsert({
            where: { inventoryItemId: inventoryItem.id },
            update: data,
            create: data
        });

        return NextResponse.json(upsertedReport);
    } catch (error) {
        console.error('Error saving system report:', error);
        return NextResponse.json({ error: 'Failed to save system report' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    // You can also alias PUT to the same upsert POST logic
    return POST(request, { params });
}

export async function DELETE(request, { params }) {
    const { tagNumber } = await params;

    try {
        const report = await prisma.systemReport.findFirst({
            where: { tagNumber }
        });

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        await prisma.systemReport.delete({
            where: { id: report.id }
        });

        return NextResponse.json({ success: true, message: 'System report deleted' });
    } catch (error) {
        console.error('Error deleting system report:', error);
        return NextResponse.json({ error: 'Failed to delete system report' }, { status: 500 });
    }
}
