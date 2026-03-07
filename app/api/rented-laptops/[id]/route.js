import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function PUT(request, { params }) {
    const user = await getCurrentUser();
    if (!user || user.role === 'USER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const data = await request.json();

        const updated = await prisma.inventoryItem.update({
            where: { id },
            data: {
                brand: data.brand !== undefined ? data.brand : undefined,
                model: data.model !== undefined ? data.model : undefined,
                price: data.price !== undefined ? parseFloat(data.price) : undefined,
                vendorInvoice: data.vendorInvoice !== undefined ? data.vendorInvoice : undefined,
                assignedUser: data.assignedUser !== undefined ? data.assignedUser : undefined,
                pid: data.pid !== undefined ? data.pid : undefined,
            },
            include: { rentalPayments: true }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating rented laptop:', error);
        return NextResponse.json({ error: 'Failed to update rented laptop' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const user = await getCurrentUser();
    if (!user || user.role === 'USER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        await prisma.inventoryItem.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting rented laptop:', error);
        return NextResponse.json({ error: 'Failed to delete rented laptop' }, { status: 500 });
    }
}
