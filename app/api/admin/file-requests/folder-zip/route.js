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
        const upstream = await fetchLaptopData('/api/admin/file-requests/folder-zip', {
            method: 'POST',
            body,
        });

        return proxyJsonResponse(upstream, 'Unable to create folder ZIP request');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to create folder ZIP request');
    }
}
