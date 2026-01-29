import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: Only allow ADMIN or AGENT to view full inventory?
    // For now, let's allow everyone to see or restricts. 
    // User asked for "inventory", seemingly for management.
    // Let's assume ADMIN/AGENT can see all, USER can see their own?

    let where = {};
    if (user.role === 'USER') {
        where = { userId: user.id };
    }

    try {
        const items = await prisma.inventoryItem.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { username: true, email: true } }
            }
        });
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
}

export async function POST(request) {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const json = await request.json();
        // Basic validation
        if (!json.pid || !json.type || !json.ownership) {
            return NextResponse.json({ error: 'PID, Type, and Ownership are required' }, { status: 400 });
        }

        let userId = json.userId;
        if (userId && userId.trim() !== "") {
            // Verify if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (!existingUser) {
                return NextResponse.json({ error: 'Invalid User ID: User not found' }, { status: 400 });
            }
        } else {
            userId = null;
        }

        const data = {
            pid: json.pid,
            type: json.type,
            status: json.status, // Allow setting status on create
            assignedDate: json.assignedDate ? new Date(json.assignedDate) : null,
            returnDate: json.returnDate ? new Date(json.returnDate) : null,
            maintenanceDate: json.maintenanceDate ? new Date(json.maintenanceDate) : null,
            purchasedDate: json.purchasedDate ? new Date(json.purchasedDate) : null,
            warrantyDate: json.warrantyDate ? new Date(json.warrantyDate) : null,
            ownership: json.ownership,
            brand: json.brand,
            model: json.model,
            price: json.price ? parseFloat(json.price) : null,
            components: json.components || [],
            warrantyType: json.warrantyType,
            systemSpecs: json.systemSpecs || undefined
        };

        if (userId) {
            data.user = { connect: { id: userId } };
        }

        const item = await prisma.inventoryItem.create({
            data
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Inventory Create Error:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'PID must be unique' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
    }
}
