/**
 * Schema for team (User) CSV import / export.
 *
 * Mirrors the structure of lib/inventoryCsv.js. The "Linked Device PIDs"
 * column is a comma-separated list of inventory PIDs (e.g. "EP-001,EP-014")
 * — each one is linked to the imported user on insert.
 */

export const TEAM_IMPORT_COLUMNS = [
    'Email',                  // required, primary identifier
    'First Name',
    'Last Name',
    'Phone',                  // phoneNumber
    'Department',
    'Location',
    'Role',                   // USER | AGENT | ADMIN (default USER)
    'Status',                 // PENDING | ACTIVE (default PENDING)
    'Linked Device PIDs',     // comma-separated, e.g. "EP-001,EP-014"
];

// Legacy column headers we still accept on import for back-compat.
// `Name` was the previous one-column-for-everything design.
export const TEAM_LEGACY_NAME_COLUMNS = ['Name', 'Username', 'Full Name'];

export const TEAM_FULL_EXPORT_COLUMNS = [
    'Record ID',
    ...TEAM_IMPORT_COLUMNS,
    'Created At',
    'Tickets Count',
    'Inventory Count',
];

export const TEAM_SAMPLE_ROW = {
    Email: 'alex.carter@example.com',
    'First Name': 'Alex',
    'Last Name': 'Carter',
    Phone: '+91 9876543210',
    Department: 'Engineering',
    Location: 'Mumbai HQ',
    Role: 'USER',
    Status: 'PENDING',
    'Linked Device PIDs': 'EP-001,EP-014',
};

export function buildTeamSampleCsv() {
    return serializeCsv(TEAM_IMPORT_COLUMNS, [TEAM_SAMPLE_ROW]);
}

export function buildTeamExportCsv(users) {
    const rows = users.map((u) => {
        // Prefer structured firstName/lastName; fall back to splitting the
        // legacy `username` so exported rows still split cleanly.
        let first = (u.firstName || '').trim();
        let last = (u.lastName || '').trim();
        if (!first && !last && u.username) {
            const parts = String(u.username).trim().split(/\s+/);
            first = parts[0] || '';
            last = parts.slice(1).join(' ') || '';
        }
        return {
            'Record ID': u.id,
            Email: u.email,
            'First Name': first,
            'Last Name': last,
            Phone: u.phoneNumber ?? '',
            Department: u.department ?? '',
            Location: u.location ?? '',
            Role: u.role ?? 'USER',
            Status: u.status ?? 'PENDING',
            // Roundtrip the device links so an export → import preserves them.
            'Linked Device PIDs': (u.inventory || [])
                .map((it) => it.pid)
                .filter(Boolean)
                .join(','),
            'Created At': formatTimestampForCsv(u.createdAt),
            'Tickets Count': u._count?.tickets ?? 0,
            'Inventory Count': u._count?.inventory ?? (u.inventory?.length ?? 0),
        };
    });

    return serializeCsv(TEAM_FULL_EXPORT_COLUMNS, rows);
}

function serializeCsv(headers, rows) {
    const lines = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map((row) => headers.map((header) => escapeCsvValue(row?.[header])).join(',')),
    ];
    return `﻿${lines.join('\n')}`;
}

function escapeCsvValue(value) {
    if (value === null || value === undefined) return '';
    const normalized = String(value)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
    if (/[",\n]/.test(normalized)) {
        return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
}

function formatTimestampForCsv(value) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString();
}

/** Tiny helper used by the import route to normalize enum values. */
export function normalizeRole(value) {
    const v = String(value || '').trim().toUpperCase();
    return ['USER', 'AGENT', 'ADMIN'].includes(v) ? v : 'USER';
}

export function normalizeStatus(value) {
    const v = String(value || '').trim().toUpperCase();
    return ['ACTIVE', 'PENDING', 'SUSPENDED'].includes(v) ? v : 'PENDING';
}
