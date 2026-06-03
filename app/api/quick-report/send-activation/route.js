import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getBaseUrl } from '@/lib/get-base-url';
import { sendInviteEmail } from '@/lib/email';
import { maskEmail } from '@/lib/mask';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/quick-report/send-activation { pid }
 *
 * Public — anyone holding the QR sticker can trigger an activation-link
 * email to the device's assignee. Helpful when an admin bulk-imported the
 * user but never sent the original invite, and the user wants to log in.
 *
 * Safety: the activation link is only ever emailed to the user's own
 * address, never returned to the caller. Rate-limited per pid + IP.
 */
export async function POST(request) {
    try {
        const { pid } = await request.json();
        if (!pid) {
            return NextResponse.json({ error: 'Missing pid' }, { status: 400 });
        }

        const ip = request.headers.get('x-forwarded-for') || 'anon';
        const rl = await rateLimit(`qr-activate:${pid}:${ip}`, 3, 15 * 60_000);
        if (!rl.success) {
            return NextResponse.json(
                {
                    error:
                        'Too many activation requests for this device. Please wait 15 minutes and try again.',
                },
                { status: 429 },
            );
        }

        const item = await prisma.inventoryItem.findUnique({
            where: { pid },
            include: {
                user: { select: { id: true, email: true, status: true, role: true } },
            },
        });
        if (!item) {
            return NextResponse.json({ error: 'Device not found.' }, { status: 404 });
        }
        if (!item.user || !item.user.email) {
            return NextResponse.json(
                {
                    error:
                        'This device is not linked to a user account, so an activation link cannot be sent.',
                },
                { status: 409 },
            );
        }
        if (item.user.status === 'SUSPENDED') {
            return NextResponse.json(
                {
                    error:
                        'This account is suspended. Please contact support to reactivate it.',
                },
                { status: 403 },
            );
        }
        if (item.user.status === 'ACTIVE') {
            return NextResponse.json(
                {
                    error:
                        'This account is already active. Try signing in — use the password reset link if needed.',
                },
                { status: 409 },
            );
        }

        // Fresh 24h invite token. Clear any previous (possibly expired) token
        // and any half-set password so they go through clean setup.
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.user.update({
            where: { id: item.user.id },
            data: {
                inviteToken,
                inviteExpires,
                password: null,
                status: 'PENDING',
            },
        });

        const baseUrl = getBaseUrl(request);
        const inviteLink = `${baseUrl}/setup?token=${inviteToken}`;

        try {
            await sendInviteEmail(item.user.email, inviteLink, item.user.role || 'USER');
        } catch (err) {
            console.warn('Activation email failed:', err.message);
            return NextResponse.json(
                {
                    error:
                        "We couldn't send the email right now. Please try again in a few minutes.",
                },
                { status: 502 },
            );
        }

        return NextResponse.json({
            ok: true,
            maskedEmail: maskEmail(item.user.email),
            expiresInSec: 24 * 60 * 60,
        });
    } catch (err) {
        console.error('send-activation error:', err);
        return NextResponse.json({ error: 'Could not send the activation link.' }, { status: 500 });
    }
}
