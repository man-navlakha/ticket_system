import {
    fetchLaptopData,
    laptopDataErrorResponse,
    proxyJsonResponse,
    requireLaptopDataAccess,
} from '@/lib/laptop-data-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
    const { response } = await requireLaptopDataAccess();
    if (response) return response;

    const { deviceCode } = await params;

    if (!deviceCode) {
        return NextResponse.json({ error: 'Device code is required' }, { status: 400 });
    }

    try {
        const body = await request.json().catch(() => null);
        const nickname = typeof body?.nickname === 'string' ? body.nickname.trim() : '';

        if (!nickname) {
            return NextResponse.json({ error: 'Nickname is required' }, { status: 400 });
        }

        const upstream = await fetchLaptopData(
            `/api/admin/devices/${encodeURIComponent(deviceCode)}/nickname`,
            {
                method: 'PATCH',
                body: { nickname },
            }
        );

        return proxyJsonResponse(upstream, 'Unable to update device nickname');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to update device nickname');
    }
}
