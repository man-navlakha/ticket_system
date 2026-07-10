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
        const upstream = await fetchLaptopData('/api/admin/agent-updates');
        return proxyJsonResponse(upstream, 'Unable to fetch agent updates');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to fetch agent updates');
    }
}

export async function POST(request) {
    const { response } = await requireLaptopDataAccess();
    if (response) return response;

    try {
        const body = await request.json();
        const upstream = await fetchLaptopData('/api/admin/agent-updates', {
            method: 'POST',
            body,
        });

        return proxyJsonResponse(upstream, 'Unable to publish agent update');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to publish agent update');
    }
}
