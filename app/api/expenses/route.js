import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request) {
    const user = await getCurrentUser();
    if (!user || user.role === 'USER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const expenses = await prisma.expense.findMany({
            orderBy: { createdAt: 'desc' },
        });

        // Also get rented laptops
        const rentedLaptops = await prisma.inventoryItem.findMany({
            where: {
                type: 'LAPTOP',
                ownership: 'RENTED'
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ expenses, rentedLaptops });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

export async function POST(request) {
    const user = await getCurrentUser();
    if (!user || user.role === 'USER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { product, price, vendor, purchaseDate, note } = await request.json();

        if (!product || price === undefined) {
            return NextResponse.json({ error: 'Product and price are required' }, { status: 400 });
        }

        const expense = await prisma.expense.create({
            data: {
                product,
                price: parseFloat(price),
                vendor: vendor || null,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                note: note || null,
            }
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
}
