import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import crypto from 'crypto';
import { sendInviteEmail } from '@/lib/email';

export async function POST(request) {
    const adminUser = await getCurrentUser();

    // 1. Authorization Check
    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { emails, role } = await request.json();

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json({ error: 'Valid emails array is required' }, { status: 400 });
        }

        const results = {
            successful: [],
            failed: []
        };

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Process invites sequentially to maintain stability
        for (const email of emails) {
            try {
                const trimmedEmail = email.trim().toLowerCase();

                // Skip invalid emails basic check
                if (!trimmedEmail || !trimmedEmail.includes('@')) {
                    results.failed.push({ email: trimmedEmail, error: 'Invalid email format' });
                    continue;
                }

                // Check if user already exists
                const existingUser = await prisma.user.findUnique({
                    where: { email: trimmedEmail }
                });

                if (existingUser) {
                    results.failed.push({ email: trimmedEmail, error: 'User already exists' });
                    continue;
                }

                // Generate Invite Token
                const inviteToken = crypto.randomBytes(32).toString('hex');
                const inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

                // Create PENDING User
                const newUser = await prisma.user.create({
                    data: {
                        email: trimmedEmail,
                        username: null,
                        password: null,
                        role: role || 'USER',
                        status: 'PENDING',
                        inviteToken,
                        inviteExpires,
                    }
                });

                const inviteLink = `${appUrl}/setup?token=${inviteToken}`;

                // Send Email
                try {
                    await sendInviteEmail(trimmedEmail, inviteLink, newUser.role);
                    results.successful.push({ email: trimmedEmail });
                } catch (emailError) {
                    console.error(`Email failed for ${trimmedEmail}:`, emailError);
                    results.successful.push({ email: trimmedEmail, note: 'User created but email failed' });
                }

            } catch (err) {
                console.error(`Failed to invite ${email}:`, err);
                results.failed.push({ email, error: err.message });
            }
        }

        return NextResponse.json({
            message: `Processed ${emails.length} invitations`,
            results
        });

    } catch (error) {
        console.error("Bulk Invite Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
