import { NextResponse } from 'next/server';
import {
    fetchLaptopData,
    laptopDataErrorResponse,
    proxyJsonResponse,
    requireLaptopDataAccess,
} from '@/lib/laptop-data-api';
import { formatFullName } from '@/lib/user';

export const dynamic = 'force-dynamic';

const REQUIRED_CONFIRMATION = 'REMOVE EPDesk Agent';

export async function POST(request) {
    const { response, user } = await requireLaptopDataAccess();
    if (response) return response;

    if (user.role !== 'ADMIN') {
        return NextResponse.json(
            { error: 'Only administrators can remove the EPDesk Agent.' },
            { status: 403 }
        );
    }

    const removalKey = process.env.Security__AgentRemovalApiKey;
    if (!removalKey) {
        return NextResponse.json(
            { error: 'Agent removal is not configured on this server.' },
            { status: 503 }
        );
    }

    const body = await request.json().catch(() => null);
    const deviceCode = String(body?.deviceCode || '').trim();
    const confirmation = body?.confirmation;

    if (!deviceCode || confirmation !== REQUIRED_CONFIRMATION) {
        return NextResponse.json(
            { error: 'A device code and the exact confirmation text are required.' },
            { status: 400 }
        );
    }

    const requestedBy =
        formatFullName(user) ||
        user.email ||
        user.username ||
        `Admin ${user.id}`;

    try {
        const upstream = await fetchLaptopData(
            '/api/admin/remote-commands/remove-epdesk-agent',
            {
                method: 'POST',
                headers: {
                    'X-Agent-Removal-Key': removalKey,
                },
                body: {
                    deviceCode,
                    requestedBy,
                    confirmation: REQUIRED_CONFIRMATION,
                },
            }
        );

        return proxyJsonResponse(upstream, 'Unable to queue EPDesk Agent removal');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to queue EPDesk Agent removal');
    }
}
