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
            include: { user: { select: { id: true, username: true, email: true } } }
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
        const data = {};
        if (json.pid !== undefined) data.pid = json.pid;
        if (json.type !== undefined) data.type = json.type;
        if (json.userId !== undefined) data.userId = json.userId || null;
        if (json.assignedDate !== undefined) data.assignedDate = json.assignedDate ? new Date(json.assignedDate) : null;
        if (json.returnDate !== undefined) data.returnDate = json.returnDate ? new Date(json.returnDate) : null;
        if (json.maintenanceDate !== undefined) data.maintenanceDate = json.maintenanceDate ? new Date(json.maintenanceDate) : null;
        if (json.purchasedDate !== undefined) data.purchasedDate = json.purchasedDate ? new Date(json.purchasedDate) : null;
        if (json.warrantyDate !== undefined) data.warrantyDate = json.warrantyDate ? new Date(json.warrantyDate) : null;
        if (json.ownership !== undefined) data.ownership = json.ownership;
        if (json.brand !== undefined) data.brand = json.brand;
        if (json.model !== undefined) data.model = json.model;
        if (json.price !== undefined) data.price = json.price ? parseFloat(json.price) : null;
        if (json.components !== undefined) data.components = json.components;
        if (json.warrantyType !== undefined) data.warrantyType = json.warrantyType;
        if (json.status !== undefined) data.status = json.status;

        const updated = await prisma.inventoryItem.update({
            where: { id },
            data
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
