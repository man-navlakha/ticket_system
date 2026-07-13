import {
    fetchLaptopData,
    laptopDataErrorResponse,
    proxyJsonResponse,
    requireLaptopDataAccess,
} from '@/lib/laptop-data-api';
import { NextResponse } from 'next/server';

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
        const body = await request.json().catch(() => null);
        const payload = normalizeAgentUpdatePayload(body);

        if (!payload.ok) {
            return NextResponse.json({ error: payload.error }, { status: 400 });
        }

        const upstream = await fetchLaptopData('/api/admin/agent-updates', {
            method: 'POST',
            body: payload.data,
        });

        return proxyJsonResponse(upstream, 'Unable to publish agent update');
    } catch (error) {
        return laptopDataErrorResponse(error, 'Unable to publish agent update');
    }
}

function normalizeAgentUpdatePayload(body) {
    if (!body || typeof body !== 'object') {
        return { ok: false, error: 'Agent update payload is required.' };
    }

    const version = cleanString(body.version);
    const downloadUrl = cleanString(body.downloadUrl);
    const sha256 = cleanString(body.sha256).toUpperCase();
    const releaseNotes = cleanString(body.releaseNotes);

    if (!version) return { ok: false, error: 'Version is required.' };
    if (!downloadUrl) return { ok: false, error: 'Download URL is required.' };
    if (!isValidHttpUrl(downloadUrl)) return { ok: false, error: 'Download URL must be a valid HTTP or HTTPS URL.' };
    if (!sha256) return { ok: false, error: 'SHA-256 hash is required.' };
    if (!/^[A-F0-9]{64}$/.test(sha256)) return { ok: false, error: 'SHA-256 hash must be 64 hex characters.' };

    return {
        ok: true,
        data: {
            version,
            downloadUrl,
            sha256,
            isMandatory: parseBoolean(body.isMandatory),
            makeActive: parseBoolean(body.makeActive),
            releaseNotes,
        },
    };
}

function cleanString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function parseBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
    return Boolean(value);
}

function isValidHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}
