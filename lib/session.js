import {
    getAccessTokenFromCookie,
    getRefreshTokenFromCookie,
    verifyAccessToken,
    verifyRefreshTokenToken,
    generateAccessToken,
    setAccessTokenCookie,
} from './auth';
import { prisma } from './prisma';

export async function getCurrentUser() {
    // ── Step 1: Try the short-lived access token (15 min) ──────────────────
    // Happy path: valid token → decode payload, no DB call needed.
    const accessToken = await getAccessTokenFromCookie();
    if (accessToken) {
        const payload = verifyAccessToken(accessToken);
        if (payload && payload.userId) {
            // Token is valid — return user data directly from the JWT payload
            return {
                id: payload.userId,
                email: payload.email,
                role: payload.role,
                phoneNumber: payload.phoneNumber ?? null,
            };
        }
    }

    // ── Step 2: Access token missing or expired — try the refresh token ────
    // This is the only place the refresh token is used for auth purposes,
    // and only to silently renew the access token, not as auth itself.
    const refreshToken = await getRefreshTokenFromCookie();
    if (!refreshToken) return null;

    const refreshPayload = verifyRefreshTokenToken(refreshToken);
    if (!refreshPayload || !refreshPayload.userId) return null;

    try {
        // Fetch full user from DB (refresh path only — infrequent)
        const user = await prisma.user.findUnique({
            where: { id: refreshPayload.userId },
            select: { id: true, email: true, role: true, username: true, phoneNumber: true }
        });
        if (!user) return null;

        // Silently issue a new access token and store it in a cookie.
        //
        // IMPORTANT: `cookies().set()` THROWS when called during a Server
        // Component render ("Cookies can only be modified in a Server
        // Action or Route Handler"). Dashboard pages are Server Components,
        // so without isolating this failure the entire refresh path would
        // throw → outer catch → return null → user gets auto-logged-out
        // every 15 minutes when the access token expires. The fix: keep
        // the user authenticated even if the cookie write isn't allowed
        // here. The token will be re-issued on the next mutating request
        // (route handler / server action / middleware) where the cookie
        // store is writable.
        const newAccessToken = generateAccessToken(user);
        try {
            await setAccessTokenCookie(newAccessToken);
        } catch {
            // RSC render-context cookie write — non-fatal. User stays
            // logged in via the still-valid refresh token.
        }

        return user;
    } catch {
        // Genuine DB or token error — fall back to logged-out.
        return null;
    }
}

