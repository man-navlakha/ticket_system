
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Return all users as potential approvers
        const approvers = await prisma.user.findMany({
            // where: { role: 'ADMIN' }, // Removed restriction
            select: { id: true, username: true, email: true, role: true }
        });

        return NextResponse.json(approvers);
    } catch (error) {
        console.error('Approvers fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
