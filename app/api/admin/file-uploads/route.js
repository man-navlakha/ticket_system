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
        const searchParams = new URL(request.url).searchParams;
        const upstream = await fetchLaptopData('/api/admin/file-uploads', { searchParams });
        return proxyJsonResponse(upstream, 'Unable to fetch automatic file uploads');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to fetch automatic file uploads');
    }
}
