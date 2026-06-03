/**
 * Resolve the public base URL (origin) of the current request.
 *
 * Priority order (most trustworthy first):
 *   1. `X-Forwarded-Proto` + `X-Forwarded-Host` headers
 *      — set by Vercel, nginx, and most reverse proxies to reflect the
 *        externally-visible origin. This is what we want in 99% of prod cases.
 *   2. `Origin` request header (browser sets this on CORS-style requests).
 *   3. `req.nextUrl.origin` — Next.js' parsed origin, built from the raw Host
 *      header. Fine when there is no proxy in front of the server.
 *   4. `Host` header directly + a guessed protocol (https in prod, http in dev).
 *   5. `NEXT_PUBLIC_APP_URL` env var.
 *   6. `http://localhost:3000` — last-resort dev fallback.
 *
 * The result never has a trailing slash, so callers can safely do
 * `${baseUrl}/dashboard/...`.
 *
 * @param {Request | import('next/server').NextRequest} request
 * @returns {string} absolute origin, e.g. "https://it.mechanicsetu.tech"
 */
export function getBaseUrl(request) {
    try {
        if (request) {
            const h = request.headers;

            // 1. Reverse-proxy forwarded headers
            const fwdProto = (h.get?.('x-forwarded-proto') || '').split(',')[0].trim();
            const fwdHost = (h.get?.('x-forwarded-host') || '').split(',')[0].trim();
            if (fwdHost) {
                const proto = fwdProto || (fwdHost.startsWith('localhost') ? 'http' : 'https');
                return `${proto}://${fwdHost}`.replace(/\/+$/, '');
            }

            // 2. Origin header (browsers attach this on POST / CORS requests)
            const origin = h.get?.('origin');
            if (origin && /^https?:\/\//i.test(origin)) {
                return origin.replace(/\/+$/, '');
            }

            // 3. Next.js parsed origin
            if (request.nextUrl?.origin) {
                return String(request.nextUrl.origin).replace(/\/+$/, '');
            }

            // 4. Raw Host header
            const host = h.get?.('host');
            if (host) {
                const proto =
                    fwdProto ||
                    (process.env.NODE_ENV === 'production' && !host.startsWith('localhost')
                        ? 'https'
                        : 'http');
                return `${proto}://${host}`.replace(/\/+$/, '');
            }
        }
    } catch {
        // fall through to env / default
    }

    // 5. Env override
    const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    if (envUrl) return envUrl.replace(/\/+$/, '');

    // 6. Last resort
    return 'http://localhost:3000';
}
