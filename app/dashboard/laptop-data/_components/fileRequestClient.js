'use client';

export async function createFileRequest(file, { requestedBy, reason }) {
    const res = await fetch('/api/admin/file-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            deviceCode: file.deviceCode,
            requestedPath: file.fullPath,
            requestedBy: requestedBy || 'Dashboard',
            reason: reason || 'Requested from Laptop Data dashboard',
        }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || data?.success === false) {
        throw new Error(data?.error || data?.message || 'Unable to create file request.');
    }

    return data;
}

export async function createZipFileRequest({ deviceCode, requestedPaths, requestedBy, reason }) {
    const res = await fetch('/api/admin/file-requests/zip-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            deviceCode,
            requestedPaths,
            requestedBy: requestedBy || 'Dashboard',
            reason: reason || 'Multiple files ZIP requested from Laptop Data dashboard',
        }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || data?.success === false) {
        throw new Error(data?.error || data?.message || 'Unable to create ZIP file request.');
    }

    return data;
}

export async function createFolderZipRequest({ deviceCode, folderPath, requestedBy, reason }) {
    const res = await fetch('/api/admin/file-requests/folder-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            deviceCode,
            folderPath,
            requestedBy: requestedBy || 'Dashboard',
            reason: reason || 'Folder ZIP requested from Laptop Data dashboard',
        }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || data?.success === false) {
        throw new Error(data?.error || data?.message || 'Unable to create folder ZIP request.');
    }

    return data;
}

export async function waitForCompletedRequest(requestId, { attempts = 12, intervalMs = 1500 } = {}) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        await delay(intervalMs);

        const res = await fetch('/api/admin/file-requests', { cache: 'no-store' });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
            throw new Error(data?.error || 'Unable to check file request status.');
        }

        const currentRequest = Array.isArray(data)
            ? data.find((request) => request.id === requestId)
            : null;

        if (!currentRequest) continue;
        if (currentRequest.status === 'completed') return currentRequest;
        if (currentRequest.status === 'failed' || currentRequest.errorMessage) {
            throw new Error(currentRequest.errorMessage || 'File request failed.');
        }
    }

    return null;
}

export async function downloadRequestFile(requestId, fallbackName) {
    const res = await fetch(`/api/admin/file-requests/${encodeURIComponent(requestId)}/download`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Unable to download requested file.');
    }

    const blob = await res.blob();
    const filename = getFilenameFromDisposition(res.headers.get('content-disposition')) || fallbackName || 'requested-file';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

export function getFileKey(file) {
    return `${file.deviceCode || 'device'}-${file.fullPath || file.fileName || 'file'}`;
}

function delay(ms) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

function getFilenameFromDisposition(disposition) {
    if (!disposition) return '';

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1].replace(/"/g, ''));
        } catch {
            return utf8Match[1].replace(/"/g, '');
        }
    }

    const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
    return filenameMatch?.[1] || '';
}
