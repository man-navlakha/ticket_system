import { NextResponse } from 'next/server';

export function middleware(request) {
    const path = request.nextUrl.pathname;

    // Define public paths that don't require authentication
    // 1. Landing page (root)
    // 2. Auth pages (/auth/login, /auth/signup, etc.)
    // 3. API routes (APIs handle their own auth responses, usually JSON 401, not redirects)
    // 4. Next.js internal files (_next)
    // 5. Common static files (favicon, manifest, public assets)
    if (
        path === '/' ||
        path.startsWith('/auth') ||
        path.startsWith('/api') ||
        path.startsWith('/_next') ||
        path.includes('.') // Naive check for files (images, favicon, manifest, etc.)
    ) {
        return NextResponse.next();
    }

    // Check for the refresh token cookie
    const token = request.cookies.get('refresh_token')?.value;

    // If no token is present, and the user is trying to access a protected page,
    // redirect them to the login page.
    if (!token) {
        const loginUrl = new URL('/auth/login', request.url);
        // Optional: Add a 'callbackUrl' query param if you want to redirect back after login
        // loginUrl.searchParams.set('callbackUrl', path);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * 1. /api/*
         * 2. /_next/static/*
         * 3. /_next/image/*
         * 4. /favicon.ico, /sitemap.xml, /robots.txt
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
