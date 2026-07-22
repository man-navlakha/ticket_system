import {
    fetchLaptopData,
    laptopDataErrorResponse,
    proxyJsonResponse,
    requireLaptopDataAccess,
} from '@/lib/laptop-data-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const { response } = await requireLaptopDataAccess();
    if (response) return response;

    try {
        const upstream = await fetchLaptopData('/api/admin/file-upload-policy');
        return proxyJsonResponse(upstream, 'Unable to fetch file upload policy');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to fetch file upload policy');
    }
}

export async function PUT(request) {
    const { response } = await requireLaptopDataAccess();
    if (response) return response;

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json({ error: 'A valid file upload policy payload is required.' }, { status: 400 });
    }

    try {
        const upstream = await fetchLaptopData('/api/admin/file-upload-policy', {
            method: 'PUT',
            body,
        });

        return proxyJsonResponse(upstream, 'Unable to update file upload policy');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to update file upload policy');
    }
}
