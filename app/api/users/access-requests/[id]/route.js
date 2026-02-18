import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(request, { params }) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') { // Only admins can approve requests
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    try {
        const { action } = await request.json(); // "APPROVE" or "REJECT"

        if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const accessRequest = await prisma.accessRequest.findUnique({
            where: { id }
        });

        if (!accessRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (action === 'REJECT') {
            const updatedRequest = await prisma.accessRequest.update({
                where: { id },
                data: { status: 'REJECTED' }
            });
            return NextResponse.json(updatedRequest);
        }

        // Handle Approval: Create User & Send Invite (Logic similar to existing invite flow)
        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: accessRequest.email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // 2. Generate Invite Token
        const crypto = require('crypto');
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // 3. Create User (as PENDING)
        const newUser = await prisma.user.create({
            data: {
                username: accessRequest.name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000), // temp username
                email: accessRequest.email,
                role: 'USER', // Default role
                status: 'PENDING',
                inviteToken,
                inviteExpires
            }
        });

        // 4. Update Access Request status
        await prisma.accessRequest.update({
            where: { id },
            data: { status: 'APPROVED' }
        });

        // 5. Send Invite Email (Trigger existing logic or return token to frontend to display/send)
        // ideally call your email service here. For now returning success.
        // In a real app, call: await sendInviteEmail(newUser.email, inviteToken);

        return NextResponse.json({ message: 'Request approved and invite created', user: newUser });

    } catch (error) {
        console.error("Access request action error:", error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
