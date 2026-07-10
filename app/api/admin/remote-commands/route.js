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
        const upstream = await fetchLaptopData('/api/admin/remote-commands', { searchParams });
        return proxyJsonResponse(upstream, 'Unable to fetch remote commands');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to fetch remote commands');
    }
}
