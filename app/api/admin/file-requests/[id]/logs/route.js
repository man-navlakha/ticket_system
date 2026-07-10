import { NextResponse } from 'next/server';

import {
    fetchLaptopData,
    laptopDataErrorResponse,
    proxyJsonResponse,
    requireLaptopDataAccess,
} from '@/lib/laptop-data-api';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
    const { response } = await requireLaptopDataAccess();
    if (response) return response;

    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    try {
        const upstream = await fetchLaptopData(`/api/admin/file-requests/${encodeURIComponent(id)}/logs`);
        return proxyJsonResponse(upstream, 'Unable to fetch file request logs');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to fetch file request logs');
    }
}
