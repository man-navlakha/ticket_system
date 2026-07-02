import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const COOKIE_NAME = 'track-comment-otp';

function jwtSecret() {
    return (
        process.env.TRACK_COMMENT_SECRET ||
        process.env.JWT_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        'dev-secret-do-not-use-in-prod'
    );
}

/**
 * POST /api/track/[token]/post-comment { code, content }
 *
 * Verifies the OTP from the signed cookie, then creates a Comment on the
 * ticket authored by the reporter (Ticket.user). Single-use — clears the
 * cookie on success.
 */
export async function POST(request, { params }) {
    try {
        const { token } = await params;
        const { code, content } = await request.json();

        if (!token || !code || !content?.trim()) {
            return NextResponse.json({ error: 'Missing code or reply text.' }, { status: 400 });
        }

        const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
        if (!cookieToken) {
            return NextResponse.json(
                { error: 'Verification expired. Request a new code.' },
                { status: 401 },
            );
        }

        let payload;
        try {
            payload = jwt.verify(cookieToken, jwtSecret());
        } catch {
            return NextResponse.json(
                { error: 'Verification expired. Request a new code.' },
                { status: 401 },
            );
        }

        // Confirm the cookie was issued for THIS ticket — protects against
        // a code sent for ticket A being replayed against ticket B.
        const ticket = await prisma.ticket.findUnique({
            where: { shareToken: token },
            select: { id: true, userId: true },
        });
        if (!ticket || ticket.id !== payload.ticketId) {
            return NextResponse.json(
                { error: 'Code belongs to a different ticket.' },
                { status: 400 },
            );
        }

        const codeHash = crypto.createHash('sha256').update(String(code).trim()).digest('hex');
        if (codeHash !== payload.codeHash) {
            return NextResponse.json({ error: 'Wrong code. Try again.' }, { status: 400 });
        }

        const cleaned = String(content).slice(0, 4000).trim();
        const comment = await prisma.comment.create({
            data: {
                content: cleaned,
                ticketId: ticket.id,
                userId: payload.userId,
            },
        });

        const res = NextResponse.json({ ok: true, commentId: comment.id });
        res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
        return res;
    } catch (err) {
        console.error('track post-comment error:', err);
        return NextResponse.json({ error: 'Could not post reply.' }, { status: 500 });
    }
}
