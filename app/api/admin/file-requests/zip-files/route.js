import {
    fetchLaptopData,
    laptopDataErrorResponse,
    proxyJsonResponse,
    requireLaptopDataAccess,
} from '@/lib/laptop-data-api';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    const { response } = await requireLaptopDataAccess();
    if (response) return response;

    try {
        const body = await request.json();
        const upstream = await fetchLaptopData('/api/admin/file-requests/zip-files', {
            method: 'POST',
            body,
        });

        return proxyJsonResponse(upstream, 'Unable to create ZIP file request');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to create ZIP file request');
    }
}
