import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '@/lib/auth';

export async function POST(req) {
    try {
        const { username, email, password, role } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: role || 'USER',
                status: 'ACTIVE'
            },
        });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        await setRefreshTokenCookie(refreshToken);

        return NextResponse.json({
            message: 'User created successfully',
            user: { id: user.id, email: user.email, username: user.username, role: user.role },
            accessToken,
        });
    } catch (error) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
