import { NextResponse } from 'next/server';

import {
    fetchLaptopData,
    laptopDataErrorResponse,
    proxyJsonResponse,
    requireLaptopDataAccess,
} from '@/lib/laptop-data-api';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const { response } = await requireLaptopDataAccess();
    if (response) return response;

    const { deviceCode } = await params;

    if (!deviceCode) {
        return NextResponse.json({ error: 'Device code is required' }, { status: 400 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const upstream = await fetchLaptopData(
            `/api/admin/devices/${encodeURIComponent(deviceCode)}/logs`,
            { searchParams }
        );

        return proxyJsonResponse(upstream, 'Unable to fetch device logs');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to fetch device logs');
    }
}
