import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { getBaseUrl } from '@/lib/get-base-url';
import { sendInviteEmail } from '@/lib/email';

/**
 * POST /api/admin/users/[id]/resend-invite
 *
 * Generates a fresh invite token (24h), emails it to the user, and returns
 * the shareable setup URL so the admin can copy + paste it to share over
 * WhatsApp / chat without waiting on email delivery.
 *
 * Only PENDING / SUSPENDED users get a fresh token. ACTIVE users with a
 * password don't need an invite — return an error explaining that.
 */
export async function POST(request, { params }) {
    const me = await getCurrentUser();
    if (!me || (me.role !== 'ADMIN' && me.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true, status: true, password: true },
    });
    if (!target) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (target.status === 'ACTIVE' && target.password) {
        return NextResponse.json(
            {
                error:
                    'This user is already active. Use "Send password reset" if they forgot their password.',
            },
            { status: 409 },
        );
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.user.update({
        where: { id },
        data: {
            inviteToken,
            inviteExpires,
            // Move back to PENDING so the existing login + setup gates work
            status: 'PENDING',
            // Clear any stale password so they go through fresh setup
            password: null,
        },
    });

    const baseUrl = getBaseUrl(request);
    const inviteLink = `${baseUrl}/setup?token=${inviteToken}`;

    // Best-effort email — failure doesn't block the share-link response
    try {
        await sendInviteEmail(target.email, inviteLink, target.role);
    } catch (err) {
        console.warn('Resend-invite email failed:', err.message);
    }

    return NextResponse.json({
        ok: true,
        email: target.email,
        inviteLink,
        expiresAt: inviteExpires.toISOString(),
    });
}
