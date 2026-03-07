import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(request, { params }) {
    const user = await getCurrentUser();
    if (!user || user.role === 'USER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { month, year, amount, action } = await request.json();

        let payment;

        if (action === 'PAY') {
            // Create or ignore if exists
            payment = await prisma.rentalPayment.upsert({
                where: {
                    inventoryItemId_month_year: {
                        inventoryItemId: id,
                        month: parseInt(month),
                        year: parseInt(year)
                    }
                },
                update: {
                    amount: parseFloat(amount)
                },
                create: {
                    inventoryItemId: id,
                    month: parseInt(month),
                    year: parseInt(year),
                    amount: parseFloat(amount)
                }
            });
        } else if (action === 'UNPAY') {
            await prisma.rentalPayment.deleteMany({
                where: {
                    inventoryItemId: id,
                    month: parseInt(month),
                    year: parseInt(year)
                }
            });
        }

        const updatedLaptop = await prisma.inventoryItem.findUnique({
            where: { id },
            include: { rentalPayments: true }
        });

        return NextResponse.json(updatedLaptop);
    } catch (error) {
        console.error('Error toggling payment:', error);
        return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
    }
}
