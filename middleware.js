import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_TTL_SEC = 15 * 60;

/**
 * Middleware keeps signed-in navigation smooth:
 * 1. Redirect already signed-in users away from "/" and "/auth/login".
 * 2. Renew an expired dashboard access token when the refresh token is valid.
 *
 * Middleware cannot read Prisma, so renewed access tokens intentionally carry
 * identity only. getCurrentUser() will hydrate the profile from the database.
 */
export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refresh_token')?.value;
    const accessToken = request.cookies.get('access_token')?.value;

    if (pathname === '/' || pathname === '/auth/login') {
        if (!refreshToken || !REFRESH_TOKEN_SECRET) {
            return NextResponse.next();
        }

        try {
            const secret = new TextEncoder().encode(REFRESH_TOKEN_SECRET);
            await jwtVerify(refreshToken, secret);
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } catch {
            return NextResponse.next();
        }
    }

    const needsRenewal =
        pathname.startsWith('/dashboard') &&
        refreshToken &&
        REFRESH_TOKEN_SECRET &&
        JWT_SECRET;

    if (!needsRenewal) {
        return NextResponse.next();
    }

    if (accessToken) {
        try {
            const secret = new TextEncoder().encode(JWT_SECRET);
            await jwtVerify(accessToken, secret);
            return NextResponse.next();
        } catch {
            // Expired or invalid; fall through to refresh-token renewal.
        }
    }

    try {
        const refreshSecret = new TextEncoder().encode(REFRESH_TOKEN_SECRET);
        const { payload: refreshPayload } = await jwtVerify(refreshToken, refreshSecret);
        if (!refreshPayload?.userId) {
            return NextResponse.next();
        }

        const accessSecret = new TextEncoder().encode(JWT_SECRET);
        const fresh = await new SignJWT({
            userId: refreshPayload.userId,
            profileHydrated: false,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime(`${ACCESS_TOKEN_TTL_SEC}s`)
            .sign(accessSecret);

        const res = NextResponse.next();
        res.cookies.set('access_token', fresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: ACCESS_TOKEN_TTL_SEC,
        });
        return res;
    } catch {
        return NextResponse.next();
    }
}

export const config = {
    matcher: ['/', '/auth/login', '/dashboard/:path*'],
};
