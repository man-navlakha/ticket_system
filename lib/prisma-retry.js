const TRANSIENT_PRISMA_ERROR_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017']);

export function isTransientPrismaConnectionError(error) {
    if (!error) return false;

    if (typeof error.code === 'string' && TRANSIENT_PRISMA_ERROR_CODES.has(error.code)) {
        return true;
    }

    const message = typeof error.message === 'string' ? error.message : '';
    return /can't reach database server|database server.*timed out|server has closed the connection/i.test(message);
}

export async function withPrismaRetry(operation, options = {}) {
    const retries = options.retries ?? 2;
    const delayMs = options.delayMs ?? 600;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            const isLastAttempt = attempt === retries;
            if (!isTransientPrismaConnectionError(error) || isLastAttempt) {
                throw error;
            }

            await wait(delayMs * (attempt + 1));
        }
    }
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
