import { NextResponse } from 'next/server';
import { removeRefreshTokenCookie } from '@/lib/auth';

export async function POST() {
    await removeRefreshTokenCookie();
    return NextResponse.json({ message: 'Logged out successfully' });
}
