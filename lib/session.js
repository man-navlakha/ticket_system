import { getRefreshTokenFromCookie, verifyRefreshTokenToken } from './auth';
import { prisma } from './prisma';

export async function getCurrentUser() {
    const token = await getRefreshTokenFromCookie();
    if (!token) return null;

    const payload = verifyRefreshTokenToken(token);
    if (!payload || !payload.userId) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, role: true, username: true, phoneNumber: true }
        });
        return user;
    } catch (error) {
        return null;
    }
}
