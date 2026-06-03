import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email';
import { maskEmail } from '@/lib/mask';
import { rateLimit } from '@/lib/rate-limit';

const COOKIE_NAME = 'qr-reveal-otp';
const OTP_TTL_SEC = 10 * 60; // 10 minutes

function jwtSecret() {
    return (
        process.env.QR_REVEAL_SECRET ||
        process.env.JWT_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        'dev-secret-do-not-use-in-prod'
    );
}

/**
 * POST /api/quick-report/request-reveal { pid }
 *
 * Generates a 6-digit code, emails it to the assigned user's address, and
 * stores `{pid, email, codeHash, exp}` as a signed JWT in an httpOnly cookie.
 * No DB write required.
 */
export async function POST(request) {
    try {
        const { pid } = await request.json();
        if (!pid) {
            return NextResponse.json({ error: 'Missing pid' }, { status: 400 });
        }

        // 5 requests / 10 min per pid+IP to deter abuse
        const ip = request.headers.get('x-forwarded-for') || 'anon';
        const rl = await rateLimit(`qr-reveal:${pid}:${ip}`, 5, 10 * 60_000);
        if (!rl.success) {
            return NextResponse.json(
                { error: 'Too many attempts. Please wait a few minutes.' },
                { status: 429 },
            );
        }

        const item = await prisma.inventoryItem.findUnique({
            where: { pid },
            include: { user: { select: { email: true } } },
        });
        if (!item) {
            return NextResponse.json({ error: 'Device not found' }, { status: 404 });
        }

        const email = item.user?.email;
        if (!email) {
            return NextResponse.json(
                {
                    error:
                        'This device is not linked to a user account yet. You can still file the report without revealing personal details.',
                },
                { status: 409 },
            );
        }

        // 6-digit code. Store its hash in the JWT so the raw code never sits
        // in any persistent store.
        const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
        const codeHash = crypto.createHash('sha256').update(code).digest('hex');

        const token = jwt.sign({ pid, email, codeHash }, jwtSecret(), {
            expiresIn: OTP_TTL_SEC,
        });

        // Fire-and-forget email; don't block the response on SMTP
        sendOtpEmail(email, code, item.pid).catch((err) =>
            console.error('OTP email failed:', err),
        );

        const res = NextResponse.json({
            ok: true,
            maskedEmail: maskEmail(email),
            expiresInSec: OTP_TTL_SEC,
        });
        res.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: OTP_TTL_SEC,
            path: '/',
        });
        return res;
    } catch (err) {
        console.error('request-reveal error:', err);
        return NextResponse.json({ error: 'Could not start verification.' }, { status: 500 });
    }
}
