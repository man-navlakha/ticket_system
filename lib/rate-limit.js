import { prisma } from './prisma';

/**
 * Basic database-backed rate limiter for Next.js 15
 * @param {string} key - Unique key for the rate limit (e.g. userId:endpoint)
 * @param {number} limit - Maximum number of requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<{success: boolean, remaining: number, reset: Date}>}
 */
export async function rateLimit(key, limit, windowMs) {
    const now = new Date();
    
    // Cleanup expired records (randomly to avoid extra load on every request)
    if (Math.random() < 0.1) {
        prisma.rateLimit.deleteMany({
            where: { expiresAt: { lt: now } }
        }).catch(console.error);
    }

    try {
        const record = await prisma.rateLimit.upsert({
            where: { key },
            create: {
                key,
                count: 1,
                expiresAt: new Date(now.getTime() + windowMs)
            },
            update: {
                count: { increment: 1 }
            }
        });

        // If the record exists but was from an old window, reset it
        if (record.expiresAt < now) {
            const newExpiry = new Date(now.getTime() + windowMs);
            const resetRecord = await prisma.rateLimit.update({
                where: { key },
                data: {
                    count: 1,
                    expiresAt: newExpiry
                }
            });
            return {
                success: true,
                remaining: limit - 1,
                reset: newExpiry
            };
        }

        const success = record.count <= limit;
        return {
            success,
            remaining: Math.max(0, limit - record.count),
            reset: record.expiresAt
        };
    } catch (error) {
        console.error('Rate limit error:', error);
        // Fail open if rate limit fails to avoid blocking users
        return { success: true, remaining: 1, reset: now };
    }
}
