'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function deleteUserAction(id) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    // Check if user is deleting themselves
    if (user.id === id) {
        throw new Error('Cannot delete your own account');
    }

    try {
        await prisma.user.delete({ where: { id } });
        revalidatePath('/dashboard/team');
        return { success: true };
    } catch (error) {
        throw new Error('Failed to delete user');
    }
}

export async function processAccessRequestAction(id, action) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    try {
        const updateData = { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' };

        await prisma.accessRequest.update({
            where: { id },
            data: updateData
        });

        if (action === 'APPROVE') {
            const req = await prisma.accessRequest.findUnique({ where: { id } });

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({ where: { email: req.email } });
            if (!existingUser) {
                // In a real app we'd create the user here or handle invite
                // Here we might just create a dummy or wait for them to register
                await prisma.user.create({
                    data: {
                        email: req.email,
                        username: req.name.toLowerCase().replace(/\s+/g, '_'),
                        password: 'pending_setup', // Dummy password
                        role: 'USER',
                        status: 'ACTIVE'
                    }
                });
            }
        }
        revalidatePath('/dashboard/team');
        return { success: true };
    } catch (error) {
        throw new Error('Failed to process request');
    }
}
