import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import ExpenseClient from './ExpenseClient';

export const metadata = {
    title: 'Expenses & Rented Equipment',
    description: 'Track expenses and rented inventory',
};

export default async function ExpensesPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/login');
    }

    if (user.role === 'USER') {
        redirect('/dashboard');
    }

    const expenses = await prisma.expense.findMany({
        orderBy: { purchaseDate: 'desc' },
    });

    const rentedLaptops = await prisma.inventoryItem.findMany({
        where: {
            type: 'LAPTOP',
            ownership: 'RENTED',
        },
        include: { rentalPayments: true },
        orderBy: { createdAt: 'desc' },
    });

    // Get a list of actual Vendors from the system
    const systemVendors = await prisma.vendor.findMany({
        where: { status: 'ACTIVE' },
        select: { name: true },
        orderBy: { name: 'asc' },
    });

    // Also get all unique vendor strings previously entered in Expenses
    const expenseVendors = await prisma.expense.findMany({
        where: { vendor: { not: null } },
        select: { vendor: true },
        distinct: ['vendor'],
    });

    // Combine and deduplicate
    const allVendorNames = Array.from(new Set([
        ...systemVendors.map(v => v.name),
        ...expenseVendors.map(e => e.vendor)
    ])).filter(Boolean).sort();

    return (
        <ExpenseClient
            initialExpenses={expenses}
            initialRentedLaptops={rentedLaptops}
            user={user}
            availableVendors={allVendorNames}
        />
    );
}
