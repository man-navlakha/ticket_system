import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

// GET /api/system-reports - Fetches all system reports
export async function GET() {
    try {
        const reports = await prisma.systemReport.findMany({
            include: {
                inventoryItem: {
                    select: {
                        pid: true,
                        status: true,
                        ownership: true,
                        department: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return NextResponse.json(reports);
    } catch (error) {
        console.error('Error fetching system reports:', error);
        return NextResponse.json({ error: 'Error fetching list of reports' }, { status: 500 });
    }
}

// POST /api/system-reports - Creates a new system report
export async function POST(request) {
    const json = await request.json();
    const { tagNumber } = json;

    if (!tagNumber) {
        return NextResponse.json({ error: 'tagNumber is required' }, { status: 400 });
    }

    try {
        // First check if an inventory item exists for this tagNumber
        let inventoryItem = await prisma.inventoryItem.findUnique({
            where: { pid: tagNumber }
        });

        // Ensure inventory item exists for the model relation
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

        const dataToSave = {
            tagNumber,
            inventoryItemId: inventoryItem.id,
            userName: json.userName || null,
            reportDate: json.reportDate || null,
            // systemInfo
            systemName: json.systemInfo?.systemName || null,
            manufacturer: json.systemInfo?.manufacturer || null,
            model: json.systemInfo?.model || null,
            serialNumber: json.systemInfo?.serialNumber || null,
            processor: json.systemInfo?.processor || null,
            totalRamGB: json.systemInfo?.totalRamGB !== undefined ? parseFloat(json.systemInfo.totalRamGB) : null,
            // windowsInfo
            windowsEdition: json.windowsInfo?.edition || null,
            windowsVersion: json.windowsInfo?.version || null,
            buildNumber: json.windowsInfo?.buildNumber || null,
            licenseStatus: json.windowsInfo?.licenseStatus || null,
            // officeInfo
            officeLicense: json.officeInfo?.licenseStatus || null,
            // batteryInfo
            batteryHealth: json.batteryInfo?.healthPercent || null,
            batteryRating: json.batteryInfo?.rating || null,
            // hardware arrays
            ramDetails: json.hardware?.ramDetails || null,
            gpuDetails: json.hardware?.gpuDetails || null,
            diskDetails: json.hardware?.diskDetails || null,
            // installed software
            installedSoftware: json.installedSoftware || null
        };

        const newReport = await prisma.systemReport.upsert({
            where: { inventoryItemId: inventoryItem.id },
            update: dataToSave,
            create: dataToSave
        });

        return NextResponse.json(newReport);
    } catch (error) {
        console.error('Error creating system report:', error);
        return NextResponse.json({ error: 'Failed to create system report' }, { status: 500 });
    }
}
