import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '@/lib/auth';

export async function POST(req) {
    try {
        const { identifier, password } = await req.json(); // Changed from 'email' to 'identifier'

        if (!identifier || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Find user by email OR username (case-insensitive)
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: { equals: identifier, mode: 'insensitive' } },
                    { username: { equals: identifier, mode: 'insensitive' } }
                ]
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check if account is active
        if (user.status === 'PENDING') {
            return NextResponse.json({ error: 'Please complete your account setup first. Check your email for the invitation link.' }, { status: 403 });
        }

        if (user.status === 'SUSPENDED') {
            return NextResponse.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 });
        }

        // Password might be null for PENDING users
        if (!user.password) {
            return NextResponse.json({ error: 'Please complete your account setup first.' }, { status: 403 });
        }

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        await setRefreshTokenCookie(refreshToken);

        return NextResponse.json({
            message: 'Login successful',
            user: { id: user.id, email: user.email, username: user.username, role: user.role },
            accessToken,
        });
    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
