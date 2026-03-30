
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(req, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { returnDate } = await req.json();

        if (!returnDate) {
            return NextResponse.json({ error: 'Return date is required' }, { status: 400 });
        }

        // 1. Check if the item exists and is available for rental
        const item = await prisma.inventoryItem.findUnique({
            where: { id },
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (item.status !== 'IN_STORAGE') {
            return NextResponse.json({ error: 'Item is not available for rental' }, { status: 400 });
        }

        // 2. Perform the update
        const updatedItem = await prisma.$transaction(async (tx) => {
            // Update the inventory item
            const updated = await tx.inventoryItem.update({
                where: { id },
                data: {
                    userId: user.id,
                    status: 'ACTIVE', // Mark as active (in use)
                    assignedDate: new Date(),
                    returnDate: new Date(returnDate),
                },
            });

            // Create an audit log entry
            await tx.auditLog.create({
                data: {
                    entityType: 'InventoryItem',
                    entityId: id,
                    action: 'RENTAL_CHECKOUT',
                    userId: user.id,
                    changes: {
                        status: { from: 'IN_STORAGE', to: 'ACTIVE' },
                        userId: { from: null, to: user.id },
                        returnDate: { from: null, to: returnDate }
                    },
                    metadata: {
                        notes: `User self-checkout via EquipHub rental portal.`
                    }
                }
            });

            return updated;
        });

        // 3. (Optional) Send notification - skipping for now to keep it simple
        
        return NextResponse.json({ 
            message: 'Rental successful', 
            item: updatedItem 
        });

    } catch (error) {
        console.error('Rental Request Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
