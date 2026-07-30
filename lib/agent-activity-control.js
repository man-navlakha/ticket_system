import { NextResponse } from 'next/server';
import { formatFullName } from '@/lib/user';
import {
    fetchLaptopData,
    laptopDataErrorResponse,
    proxyJsonResponse,
    requireLaptopDataAccess,
} from '@/lib/laptop-data-api';

const ALLOWED_ACTIONS = new Set(['start', 'stop']);

export async function proxyAgentActivityControl(
    request,
    context,
    { upstreamPrefix, activityLabel }
) {
    const { response, user } = await requireLaptopDataAccess();
    if (response) return response;

    const { action } = await context.params;
    if (!ALLOWED_ACTIONS.has(action)) {
        return NextResponse.json({ error: 'Activity action not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const deviceCode = String(body?.deviceCode || '').trim();

    if (!deviceCode) {
        return NextResponse.json({ error: 'Device code is required.' }, { status: 400 });
    }

    const requestedBy =
        formatFullName(user) ||
        user.email ||
        user.username ||
        `${user.role} ${user.id}`;

    try {
        const upstream = await fetchLaptopData(`${upstreamPrefix}/${action}`, {
            method: 'POST',
            body: {
                deviceCode,
                requestedBy,
            },
        });

        return proxyJsonResponse(upstream, `Unable to ${action} ${activityLabel}`);
    } catch (error) {
        return laptopDataErrorResponse(error, `Unable to ${action} ${activityLabel}`);
    }
}
