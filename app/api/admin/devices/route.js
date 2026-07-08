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
        const upstream = await fetchLaptopData('/api/admin/devices');
        return proxyJsonResponse(upstream, 'Unable to fetch devices');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to fetch devices');
    }
}
