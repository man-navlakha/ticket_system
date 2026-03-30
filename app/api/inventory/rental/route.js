
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch items available for rental
        // Criteria: 
        // 1. Not a laptop/computer (usually assigned personally)
        // 2. Status is IN_STORAGE or ACTIVE (if we want to show everything)
        // 3. Ownership is COMPANY
        const availableItems = await prisma.inventoryItem.findMany({
            where: {
                ownership: 'COMPANY',
                status: 'IN_STORAGE' // Only show what can be picked up immediately
            },
            orderBy: {
                type: 'asc'
            }
        });

        return NextResponse.json({ items: availableItems });
    } catch (error) {
        console.error('Rental Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
