import {
    getAccessTokenFromCookie,
    getRefreshTokenFromCookie,
    verifyAccessToken,
    verifyRefreshTokenToken,
    generateAccessToken,
    setAccessTokenCookie,
} from './auth';
import { prisma } from './prisma';

const SESSION_USER_SELECT = {
    id: true,
    email: true,
    role: true,
    username: true,
    firstName: true,
    lastName: true,
    phoneNumber: true,
    department: true,
    location: true,
    status: true,
};

function payloadHasHydratedProfile(payload) {
    return Boolean(
        payload?.userId &&
        payload.profileHydrated === true &&
        typeof payload.email !== 'undefined' &&
        typeof payload.role !== 'undefined'
    );
}

function userFromHydratedPayload(payload) {
    return {
        id: payload.userId,
        email: payload.email ?? null,
        role: payload.role ?? null,
        username: payload.username ?? null,
        firstName: payload.firstName ?? null,
        lastName: payload.lastName ?? null,
        phoneNumber: payload.phoneNumber ?? null,
        department: payload.department ?? null,
        location: payload.location ?? null,
        status: payload.status ?? null,
    };
}

async function getUserFromDb(userId) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: SESSION_USER_SELECT,
    });
}

async function refreshAccessCookie(user) {
    const newAccessToken = generateAccessToken(user);
    try {
        await setAccessTokenCookie(newAccessToken);
    } catch {
        // Server Component render context cannot mutate cookies. The current
        // request can still use the DB-hydrated user.
    }
}

async function hydrateUserFromId(userId) {
    const user = await getUserFromDb(userId);
    if (!user) return null;
    await refreshAccessCookie(user);
    return user;
}

export async function getCurrentUser() {
    const accessToken = await getAccessTokenFromCookie();
    if (accessToken) {
        const payload = verifyAccessToken(accessToken);
        if (payload?.userId) {
            if (payloadHasHydratedProfile(payload)) {
                return userFromHydratedPayload(payload);
            }

            try {
                return await hydrateUserFromId(payload.userId);
            } catch {
                return null;
            }
        }
    }

    const refreshToken = await getRefreshTokenFromCookie();
    if (!refreshToken) return null;

    const refreshPayload = verifyRefreshTokenToken(refreshToken);
    if (!refreshPayload?.userId) return null;

    try {
        return await hydrateUserFromId(refreshPayload.userId);
    } catch {
        return null;
    }
}
