import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRefreshTokenToken, generateAccessToken, getRefreshTokenFromCookie } from '@/lib/auth';

export async function POST() {
    try {
        const refreshToken = await getRefreshTokenFromCookie();

        if (!refreshToken) {
            return NextResponse.json({ error: 'No refresh token found' }, { status: 401 });
        }

        const payload = verifyRefreshTokenToken(refreshToken);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        const newAccessToken = generateAccessToken(user);

        return NextResponse.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error('Refresh Token Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
