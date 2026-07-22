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
        const upstream = await fetchLaptopData('/api/agent/file-uploads/policy');
        return proxyJsonResponse(upstream, 'Unable to fetch agent file upload policy');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to fetch agent file upload policy');
    }
}
