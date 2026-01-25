import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request, { params }) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    try {
        const item = await prisma.inventoryItem.findUnique({
            where: { id },
            include: { user: { select: { id: true, name: true, email: true } } }
        });

        if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        // Access control
        if (user.role === 'USER' && item.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching item' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const json = await request.json();

    try {
        const updated = await prisma.inventoryItem.update({
            where: { id },
            data: {
                pid: json.pid,
                type: json.type,
                userId: json.userId || null,
                assignedDate: json.assignedDate ? new Date(json.assignedDate) : null,
                returnDate: json.returnDate ? new Date(json.returnDate) : null,
                maintenanceDate: json.maintenanceDate ? new Date(json.maintenanceDate) : null,
                purchasedDate: json.purchasedDate ? new Date(json.purchasedDate) : null,
                warrantyDate: json.warrantyDate ? new Date(json.warrantyDate) : null,
                ownership: json.ownership,
                brand: json.brand,
                model: json.model,
                price: json.price ? parseFloat(json.price) : null,
                components: json.components,
                warrantyType: json.warrantyType
            }
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only admins can delete items' }, { status: 403 });
    }

    const { id } = await params;

    try {
        await prisma.inventoryItem.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
