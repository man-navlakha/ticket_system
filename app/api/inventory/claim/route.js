import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(request) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { pid } = await request.json();

        if (!pid) {
            return NextResponse.json({ error: 'PID is required' }, { status: 400 });
        }

        // Find the inventory item by PID
        let item = await prisma.inventoryItem.findUnique({
            where: { pid }
        });

        if (!item) {
            // If the PID doesn't exist, allow the user to self-register it as a personal/employee device
            item = await prisma.inventoryItem.create({
                data: {
                    pid,
                    type: 'OTHER', // Default to other, user can update details later
                    ownership: 'EMPLOYEE',
                    userId: user.id,
                    assignedDate: new Date(),
                    brand: 'Self-Registered',
                    model: 'Device'
                }
            });
            return NextResponse.json({ message: 'New device registered and linked successfully!', item });
        }

        if (item.userId) {
            if (item.userId === user.id) {
                return NextResponse.json({ message: 'Item already assigned to you', item });
            }
            return NextResponse.json({ error: 'Item is already assigned to another user' }, { status: 409 });
        }

        // Assign existing company item to the user
        const updatedItem = await prisma.inventoryItem.update({
            where: { id: item.id },
            data: {
                userId: user.id,
                assignedDate: new Date(),
            }
        });

        return NextResponse.json({ message: 'Company device linked successfully!', item: updatedItem });

    } catch (error) {
        console.error("Claim Inventory Error:", error);
        return NextResponse.json({ error: 'Failed to claim inventory item' }, { status: 500 });
    }
}
