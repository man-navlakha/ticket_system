import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email';
import { maskEmail } from '@/lib/mask';
import { rateLimit } from '@/lib/rate-limit';

const COOKIE_NAME = 'track-comment-otp';
const OTP_TTL_SEC = 10 * 60;

function jwtSecret() {
    return (
        process.env.TRACK_COMMENT_SECRET ||
        process.env.JWT_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        'dev-secret-do-not-use-in-prod'
    );
}

/**
 * POST /api/track/[token]/request-comment-otp
 *
 * Emails a 6-digit code to the reporter (Ticket.user.email) so they can
 * post a reply without logging in. Mirrors the QR-reveal OTP pattern:
 * code hash is stored in a signed JWT cookie — never in the DB.
 */
export async function POST(request, { params }) {
    try {
        const { token } = await params;
        if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

        const ip = request.headers.get('x-forwarded-for') || 'anon';
        const rl = await rateLimit(`track-otp:${token}:${ip}`, 5, 10 * 60_000);
        if (!rl.success) {
            return NextResponse.json(
                { error: 'Too many attempts. Please wait a few minutes.' },
                { status: 429 },
            );
        }

        const ticket = await prisma.ticket.findUnique({
            where: { shareToken: token },
            include: { user: { select: { id: true, email: true } } },
        });
        if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });

        const email = ticket.user?.email;
        if (!email) {
            return NextResponse.json(
                { error: 'No reporter email on file for this ticket.' },
                { status: 409 },
            );
        }

        const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
        const codeHash = crypto.createHash('sha256').update(code).digest('hex');

        const jwtToken = jwt.sign(
            { ticketId: ticket.id, userId: ticket.user.id, codeHash },
            jwtSecret(),
            { expiresIn: OTP_TTL_SEC },
        );

        sendOtpEmail(email, code, `ticket ${ticket.id.slice(0, 8)}`).catch((err) =>
            console.error('Track OTP email failed:', err),
        );

        const res = NextResponse.json({
            ok: true,
            maskedEmail: maskEmail(email),
            expiresInSec: OTP_TTL_SEC,
        });
        res.cookies.set(COOKIE_NAME, jwtToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: OTP_TTL_SEC,
            path: '/',
        });
        return res;
    } catch (err) {
        console.error('track request-comment-otp error:', err);
        return NextResponse.json({ error: 'Could not send code.' }, { status: 500 });
    }
}
