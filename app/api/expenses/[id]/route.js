import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function DELETE(request, { params }) {
    const user = await getCurrentUser();
    if (!user || user.role === 'USER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        await prisma.expense.delete({
            where: { id: id },
        });
        return NextResponse.json({ message: 'Expense deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting expense:', error);
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }
}
