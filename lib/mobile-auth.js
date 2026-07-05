import { prisma } from './prisma';
import { getCurrentUser } from './session';
import { verifyAccessToken } from './auth';

const MOBILE_USER_SELECT = {
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

async function findActiveUser(userId) {
    if (!userId) return null;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: MOBILE_USER_SELECT,
    });

    if (!user || user.status !== 'ACTIVE') {
        return null;
    }

    return user;
}

function getBearerToken(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.slice('Bearer '.length).trim();
    return token || null;
}

export async function getMobileApiUser(request) {
    const bearerToken = getBearerToken(request);
    if (bearerToken) {
        const payload = verifyAccessToken(bearerToken);
        const bearerUser = await findActiveUser(payload?.userId);
        if (bearerUser) return bearerUser;
    }

    const accessCookie = request.cookies.get('access_token')?.value;
    if (accessCookie) {
        const payload = verifyAccessToken(accessCookie);
        const cookieUser = await findActiveUser(payload?.userId);
        if (cookieUser) return cookieUser;
    }

    const sessionUser = await getCurrentUser();
    return findActiveUser(sessionUser?.id);
}
