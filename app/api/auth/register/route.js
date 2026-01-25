import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '@/lib/auth';

export async function POST(req) {
    try {
        return NextResponse.json({
            error: 'Registration is restricted. Please contact your administrator for an invitation link.'
        }, { status: 403 });

        /* Public registration disabled in favor of invite system
        const { username, email, password, role } = await req.json();
        ... rest of code ...
        */
    } catch (error) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
