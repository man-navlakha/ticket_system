import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(request) {
    const user = await getCurrentUser();
    if (!user || user.role === 'USER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await request.json();

        // Ensure pid is unique, if provided or auto-generate
        const pid = data.pid || `RL-${Date.now().toString().slice(-6)}`;

        const laptop = await prisma.inventoryItem.create({
            data: {
                pid,
                type: 'LAPTOP',
                ownership: 'RENTED',
                brand: data.brand || null,
                model: data.model || null,
                price: data.price ? parseFloat(data.price) : 0,
                vendorInvoice: data.vendorInvoice || null,
                assignedUser: data.assignedUser || null,
                status: 'ACTIVE',
            },
            include: { rentalPayments: true }
        });

        return NextResponse.json(laptop);
    } catch (error) {
        console.error('Error adding rented laptop:', error);
        return NextResponse.json({ error: 'Failed to add rented laptop' }, { status: 500 });
    }
}
