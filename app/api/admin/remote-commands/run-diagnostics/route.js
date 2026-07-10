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
        const upstream = await fetchLaptopData('/api/admin/remote-commands/run-diagnostics', {
            method: 'POST',
            body,
        });

        return proxyJsonResponse(upstream, 'Unable to run device diagnostics');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to run device diagnostics');
    }
}
