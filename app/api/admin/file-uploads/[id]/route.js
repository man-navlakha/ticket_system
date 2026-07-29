import { NextResponse } from 'next/server';

import {
    fetchLaptopData,
    laptopDataErrorResponse,
    proxyJsonResponse,
    requireLaptopDataAccess,
} from '@/lib/laptop-data-api';

export const dynamic = 'force-dynamic';

export async function DELETE(_request, { params }) {
    const { response } = await requireLaptopDataAccess();
    if (response) return response;

    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Upload ID is required.' }, { status: 400 });
    }

    try {
        const upstream = await fetchLaptopData(`/api/admin/file-uploads/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });

        return proxyJsonResponse(upstream, 'Unable to delete file upload');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to delete file upload');
    }
}
