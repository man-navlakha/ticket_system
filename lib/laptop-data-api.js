import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';

const DEFAULT_AGENT_API_BASE_URL = 'https://laptop-data.excellentpublicity.co';

function getAgentApiBaseUrl() {
    return (
        process.env.LAPTOP_DATA_API_BASE_URL ||
        process.env.EPDESK_AGENT_API_BASE_URL ||
        DEFAULT_AGENT_API_BASE_URL
    ).replace(/\/+$/, '');
}

export async function requireLaptopDataAccess() {
    const user = await getCurrentUser();

    if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT')) {
        return {
            response: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }),
            user: null,
        };
    }

    return { response: null, user };
}

export function buildLaptopDataUrl(path, searchParams) {
    const url = new URL(path, `${getAgentApiBaseUrl()}/`);

    if (searchParams) {
        for (const [key, value] of searchParams.entries()) {
            url.searchParams.append(key, value);
        }
    }

    return url;
}

export async function fetchLaptopData(path, options = {}) {
    const { method = 'GET', searchParams, body, headers = {} } = options;
    const requestHeaders = {
        accept: '*/*',
        ...headers,
    };

    const fetchOptions = {
        method,
        headers: requestHeaders,
        cache: 'no-store',
    };

    if (typeof body !== 'undefined') {
        requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    return fetch(buildLaptopDataUrl(path, searchParams), fetchOptions);
}

export async function proxyJsonResponse(upstreamResponse, fallbackMessage) {
    const text = await upstreamResponse.text();
    const payload = parseJson(text);

    if (!upstreamResponse.ok) {
        return NextResponse.json(
            {
                error:
                    payload?.error ||
                    payload?.message ||
                    text ||
                    fallbackMessage ||
                    'Request failed',
            },
            { status: upstreamResponse.status || 500 }
        );
    }

    return NextResponse.json(payload ?? null, { status: upstreamResponse.status });
}

export function laptopDataErrorResponse(error, fallbackMessage) {
    console.error(fallbackMessage, error);
    return NextResponse.json(
        { error: fallbackMessage || 'Laptop data service is unavailable' },
        { status: 502 }
    );
}

function parseJson(text) {
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}
