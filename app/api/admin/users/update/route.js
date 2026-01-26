import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function PUT(req) {
    const user = await getCurrentUser();

    // Only ADMIN and AGENT can update users
    if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { userId, username } = await req.json();

        if (!userId || !username) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if username is taken
        const existing = await prisma.user.findUnique({
            where: { username }
        });

        if (existing && existing.id !== userId) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { username }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Failed to update user:", error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
