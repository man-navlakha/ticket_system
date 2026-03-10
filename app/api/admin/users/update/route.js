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
        const { userId, username, email, role, status, phoneNumber, department, location } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
        }

        const dataToUpdate = {};

        if (username) {
            // Check if username is taken
            const existingUsername = await prisma.user.findFirst({
                where: { username, id: { not: userId } }
            });
            if (existingUsername) {
                return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
            }
            dataToUpdate.username = username;
        }

        if (email) {
            // Check if email is taken
            const existingEmail = await prisma.user.findFirst({
                where: { email, id: { not: userId } }
            });
            if (existingEmail) {
                return NextResponse.json({ error: 'Email already taken' }, { status: 400 });
            }
            dataToUpdate.email = email;
        }

        if (role) {
            if (user.role !== 'ADMIN' && role === 'ADMIN') {
                return NextResponse.json({ error: 'Agents cannot assign Admin role' }, { status: 403 });
            }
            dataToUpdate.role = role;
        }

        if (status) {
            dataToUpdate.status = status;
        }

        if (phoneNumber !== undefined) {
            dataToUpdate.phoneNumber = phoneNumber;
        }

        if (department !== undefined) {
            dataToUpdate.department = department;
        }

        if (location !== undefined) {
            dataToUpdate.location = location;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Failed to update user:", error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
