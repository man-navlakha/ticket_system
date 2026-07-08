import {
    fetchLaptopData,
    laptopDataErrorResponse,
    proxyJsonResponse,
    requireLaptopDataAccess,
} from '@/lib/laptop-data-api';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { response } = await requireLaptopDataAccess();
    if (response) return response;

    try {
        const { searchParams } = new URL(request.url);
        const upstream = await fetchLaptopData('/api/admin/files/search', { searchParams });
        return proxyJsonResponse(upstream, 'Unable to search files');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to search files');
    }
}
