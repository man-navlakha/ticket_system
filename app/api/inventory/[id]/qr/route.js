import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get inventory item
        const item = await prisma.inventoryItem.findUnique({
            where: { id },
            select: {
                id: true,
                pid: true,
                type: true,
                brand: true,
                model: true,
            },
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Generate QR code URL - points to create ticket page with pre-filled inventory
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const qrUrl = `${appUrl}/dashboard/create?inventoryId=${item.id}`;

        // Generate QR code as Data URL
        const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        // Return JSON with QR code and item info for frontend to render
        return NextResponse.json({
            qrCode: qrCodeDataUrl,
            item: {
                pid: item.pid,
                type: item.type,
                brand: item.brand,
                model: item.model,
            },
            url: qrUrl,
        });
    } catch (error) {
        console.error('QR generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate QR code' },
            { status: 500 }
        );
    }
}
