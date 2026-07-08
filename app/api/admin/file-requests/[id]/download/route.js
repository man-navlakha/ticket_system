import {
    fetchLaptopData,
    laptopDataErrorResponse,
    requireLaptopDataAccess,
} from '@/lib/laptop-data-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const { response } = await requireLaptopDataAccess();
    if (response) return response;

    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    try {
        const upstream = await fetchLaptopData(`/api/admin/file-requests/${encodeURIComponent(id)}/download`);

        if (!upstream.ok) {
            const text = await upstream.text();
            let payload = null;

            try {
                payload = text ? JSON.parse(text) : null;
            } catch {
                payload = null;
            }

            return NextResponse.json(
                {
                    error:
                        payload?.error ||
                        payload?.message ||
                        text ||
                        'Unable to download requested file',
                },
                { status: upstream.status || 500 }
            );
        }

        const headers = new Headers();
        const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
        const contentDisposition = upstream.headers.get('content-disposition');
        const contentLength = upstream.headers.get('content-length');

        headers.set('Content-Type', contentType);
        if (contentDisposition) headers.set('Content-Disposition', contentDisposition);
        if (contentLength) headers.set('Content-Length', contentLength);

        return new Response(upstream.body, {
            status: upstream.status,
            headers,
        });
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to download requested file');
    }
}
