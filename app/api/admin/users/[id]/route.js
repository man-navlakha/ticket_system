import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function DELETE(request, { params }) {
    const user = await getCurrentUser();

    // Only ADMIN and AGENT can delete users
    if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        // Prevent deleting yourself
        if (id === user.id) {
            return NextResponse.json({ error: 'You cannot delete yourself' }, { status: 400 });
        }

        // Check if user exists
        const targetUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Optional: specific rules (e.g., Agents cannot delete Admins)
        if (user.role === 'AGENT' && targetUser.role === 'ADMIN') {
            return NextResponse.json({ error: 'Agents cannot delete Admins' }, { status: 403 });
        }

        await prisma.user.delete({
            where: { id: id }
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error("Failed to delete user:", error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
