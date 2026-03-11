import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Only run on the root landing page
    if (pathname !== '/') {
        return NextResponse.next();
    }

    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
        return NextResponse.next();
    }

    try {
        // If secret is not configured, skip the redirect check (fail safe → show landing page)
        if (!REFRESH_TOKEN_SECRET) {
            return NextResponse.next();
        }

        // Verify the JWT at the edge (no DB call needed)
        const secret = new TextEncoder().encode(REFRESH_TOKEN_SECRET);
        await jwtVerify(refreshToken, secret);

        // Token is valid → redirect straight to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
        // Token invalid or expired → show landing page as normal
        return NextResponse.next();
    }
}

export const config = {
    matcher: ['/', '/auth/login', '/register'],
};
