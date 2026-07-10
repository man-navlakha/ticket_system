import { NextResponse } from 'next/server';

import {
    fetchLaptopData,
    laptopDataErrorResponse,
    proxyJsonResponse,
    requireLaptopDataAccess,
} from '@/lib/laptop-data-api';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
    const { response } = await requireLaptopDataAccess();
    if (response) return response;

    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Command ID is required' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const upstream = await fetchLaptopData(
            `/api/admin/remote-commands/${encodeURIComponent(id)}/mark-failed`,
            {
                method: 'POST',
                body,
            }
        );

        return proxyJsonResponse(upstream, 'Unable to mark remote command failed');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to mark remote command failed');
    }
}
