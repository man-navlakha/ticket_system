import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const COOKIE_NAME = 'qr-reveal-otp';

function jwtSecret() {
    return (
        process.env.QR_REVEAL_SECRET ||
        process.env.JWT_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        'dev-secret-do-not-use-in-prod'
    );
}

/**
 * POST /api/quick-report/verify-reveal { pid, code }
 *
 * Reads the signed JWT cookie set by /request-reveal, checks the SHA-256
 * hash of `code` matches what's inside, and only then returns the full
 * unmasked details of the assigned user.
 */
export async function POST(request) {
    try {
        const { pid, code } = await request.json();
        if (!pid || !code) {
            return NextResponse.json({ error: 'Missing pid or code' }, { status: 400 });
        }

        const token = request.cookies.get(COOKIE_NAME)?.value;
        if (!token) {
            return NextResponse.json(
                { error: 'Verification expired. Please request a new code.' },
                { status: 401 },
            );
        }

        let payload;
        try {
            payload = jwt.verify(token, jwtSecret());
        } catch {
            return NextResponse.json(
                { error: 'Verification expired. Please request a new code.' },
                { status: 401 },
            );
        }

        if (payload.pid !== pid) {
            return NextResponse.json(
                { error: 'Code belongs to a different device.' },
                { status: 400 },
            );
        }

        const codeHash = crypto.createHash('sha256').update(String(code).trim()).digest('hex');
        if (codeHash !== payload.codeHash) {
            return NextResponse.json({ error: 'Wrong code. Try again.' }, { status: 400 });
        }

        const item = await prisma.inventoryItem.findUnique({
            where: { pid },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        phoneNumber: true,
                        department: true,
                        location: true,
                    },
                },
            },
        });
        if (!item || !item.user) {
            return NextResponse.json({ error: 'Device or user no longer available.' }, { status: 404 });
        }

        // Clear the OTP cookie — one shot per code
        const res = NextResponse.json({
            ok: true,
            person: {
                name: item.user.username || item.assignedUser || null,
                email: item.user.email || null,
                phone: item.user.phoneNumber || null,
                department: item.user.department || item.department || null,
                location: item.user.location || item.location || null,
            },
        });
        res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
        return res;
    } catch (err) {
        console.error('verify-reveal error:', err);
        return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
    }
}
