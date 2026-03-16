import { NextResponse } from 'next/server';
import { removeRefreshTokenCookie, removeAccessTokenCookie } from '@/lib/auth';

export async function POST() {
    await removeRefreshTokenCookie();
    await removeAccessTokenCookie();
    return NextResponse.json({ message: 'Logged out successfully' });
}
