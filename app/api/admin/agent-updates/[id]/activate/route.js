import { NextResponse } from 'next/server';

import {
    fetchLaptopData,
    laptopDataErrorResponse,
    proxyJsonResponse,
    requireLaptopDataAccess,
} from '@/lib/laptop-data-api';

export const dynamic = 'force-dynamic';

export async function POST(_request, { params }) {
    const { response } = await requireLaptopDataAccess();
    if (response) return response;

    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Agent version ID is required' }, { status: 400 });
    }

    try {
        const upstream = await fetchLaptopData(`/api/admin/agent-updates/${encodeURIComponent(id)}/activate`, {
            method: 'POST',
        });

        return proxyJsonResponse(upstream, 'Unable to activate agent update');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to activate agent update');
    }
}
