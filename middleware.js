import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_TTL_SEC = 15 * 60;

/**
 * Middleware responsibilities:
 *
 *   1. Landing-page redirect:
 *      If a valid refresh token exists, redirect "/" and "/auth/login"
 *      straight to "/dashboard" so signed-in users don't see the marketing
 *      page or login form.
 *
 *   2. Silent access-token renewal (the actual fix for the 15-minute
 *      auto-logout loop):
 *      Whenever a request lands on a dashboard route AND the access_token
 *      is missing/expired BUT the refresh_token is valid, re-issue a fresh
 *      access_token here at the edge — middleware is a writable cookie
 *      context, so unlike Server Components, `response.cookies.set()`
 *      always succeeds. After this runs, `getCurrentUser()` in the page
 *      finds the fresh access token via the happy path and never hits the
 *      refresh branch during render.
 */
export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refresh_token')?.value;
    const accessToken = request.cookies.get('access_token')?.value;

    // ── (1) Landing / login auto-redirect ──────────────────────────────
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

    // ── (2) Silent access-token renewal on dashboard routes ────────────
    const needsRenewal =
        pathname.startsWith('/dashboard') &&
        refreshToken &&
        REFRESH_TOKEN_SECRET &&
        JWT_SECRET;

    if (!needsRenewal) {
        return NextResponse.next();
    }

    // If the access token is present AND still valid, don't touch anything.
    if (accessToken) {
        try {
            const secret = new TextEncoder().encode(JWT_SECRET);
            await jwtVerify(accessToken, secret);
            return NextResponse.next();
        } catch {
            // Expired or invalid — fall through to renewal.
        }
    }

    // Access token missing or expired. Verify the refresh token at the
    // edge and mint a fresh access token. We mirror the payload shape used
    // by `generateAccessToken` in lib/auth.js so verifyAccessToken on the
    // server reads identical claims.
    try {
        const refreshSecret = new TextEncoder().encode(REFRESH_TOKEN_SECRET);
        const { payload: refreshPayload } = await jwtVerify(refreshToken, refreshSecret);
        if (!refreshPayload?.userId) {
            return NextResponse.next();
        }

        // Note: middleware can't read from Prisma (Edge runtime doesn't have
        // DB access here). We re-issue an access token with only `userId` +
        // any other claims that were on the refresh token — `getCurrentUser`
        // then falls back to its existing refresh-DB-lookup path the next
        // time it needs the full role/email. This is a non-breaking
        // optimization: even with a minimal claims payload, the user
        // remains authenticated and `verifyAccessToken` succeeds.
        const accessSecret = new TextEncoder().encode(JWT_SECRET);
        const fresh = await new SignJWT({
            userId: refreshPayload.userId,
            email: refreshPayload.email ?? null,
            role: refreshPayload.role ?? null,
            phoneNumber: refreshPayload.phoneNumber ?? null,
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
