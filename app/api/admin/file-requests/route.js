import {
    fetchLaptopData,
    laptopDataErrorResponse,
    proxyJsonResponse,
    requireLaptopDataAccess,
} from '@/lib/laptop-data-api';

export const dynamic = 'force-dynamic';

export async function GET() {
    const { response } = await requireLaptopDataAccess();
    if (response) return response;

    try {
        const upstream = await fetchLaptopData('/api/admin/file-requests');
        return proxyJsonResponse(upstream, 'Unable to fetch file requests');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to fetch file requests');
    }
}

export async function POST(request) {
    const { response } = await requireLaptopDataAccess();
    if (response) return response;

    try {
        const body = await request.json();
        const upstream = await fetchLaptopData('/api/admin/file-requests', {
            method: 'POST',
            body,
        });

        return proxyJsonResponse(upstream, 'Unable to create file request');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to create file request');
    }
}
