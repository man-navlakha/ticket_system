import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import crypto from 'crypto';

export async function POST(request) {
    const user = await getCurrentUser();

    // 1. Authorization Check
    if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { email, role, username } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // 2. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
        }

        // 3. Generate Invite Token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // 4. Create PENDING User
        const newUser = await prisma.user.create({
            data: {
                email,
                username: username || null,
                password: null, // Explicitly set to null - user will set during setup
                role: role || 'USER',
                status: 'PENDING',
                inviteToken,
                inviteExpires,
            }
        });

        // 5. Send Email via Zoho Mail
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/setup?token=${inviteToken}`;

        try {
            const { sendInviteEmail } = await import('@/lib/email');
            await sendInviteEmail(email, inviteLink, newUser.role);
            console.log(`✅ Invitation sent to: ${email}`);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail the entire request if email fails - user is already created
            // Admin can manually share the link
        }

        return NextResponse.json({
            message: 'Invitation sent successfully',
            user: { id: newUser.id, email: newUser.email, role: newUser.role },
            debugLink: inviteLink // Still useful for testing
        });

    } catch (error) {
        console.error("Invite Error:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
            return NextResponse.json({ error: 'This username is already taken.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
    }
}
