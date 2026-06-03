import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import * as XLSX from 'xlsx';
import { normalizeRole, normalizeStatus } from '@/lib/teamCsv';
import { resolveNameFromRow } from '@/lib/user';

/**
 * POST /api/team/bulk
 *
 * Bulk-import users + optionally link inventory devices to them.
 *
 * Each row in the CSV creates or enriches a User and links any devices
 * named in the "Linked Device PIDs" column (comma-separated, e.g.
 * "EP-001,EP-014"). Existing user fields are never overwritten — we only
 * fill in blanks.
 *
 * Auth: ADMIN or AGENT only.
 */
export async function POST(request) {
    try {
        const me = await getCurrentUser();
        if (!me) {
            return NextResponse.json(
                {
                    error:
                        'Your session has expired. Refresh the page and sign in again, then retry the upload.',
                },
                { status: 401 },
            );
        }
        if (me.role !== 'ADMIN' && me.role !== 'AGENT') {
            return NextResponse.json(
                {
                    error: `Only ADMIN or AGENT roles can bulk-import the team. Your current role is ${me.role || 'USER'}.`,
                },
                { status: 403 },
            );
        }

        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        if (!file.name?.toLowerCase().endsWith('.csv')) {
            return NextResponse.json(
                { error: 'Only CSV files are supported. Please upload a .csv file.' },
                { status: 400 },
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const csvText = buffer.toString('utf8').replace(/^﻿/, '');
        const workbook = XLSX.read(csvText, { type: 'string' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
        }

        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            devicesLinked: 0,
            errors: [],
        };

        const getVal = (row, key) => {
            const exact = row[key];
            if (exact !== undefined && exact !== '') return exact;
            const norm = key.toLowerCase().replace(/\s+/g, '');
            const found = Object.keys(row).find(
                (k) => k.toLowerCase().replace(/\s+/g, '') === norm,
            );
            return found ? row[found] : undefined;
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2; // header is row 1

            try {
                const emailRaw = getVal(row, 'Email');
                const email = emailRaw ? String(emailRaw).trim().toLowerCase() : '';
                if (!email || !email.includes('@')) {
                    throw new Error('Missing or invalid Email');
                }

                // Resolve first/last name — explicit columns win, otherwise
                // split a legacy single-column Name / Username / Full Name.
                const { firstName, lastName, derivedUsername } = resolveNameFromRow({
                    firstName: getVal(row, 'First Name'),
                    lastName: getVal(row, 'Last Name'),
                    singleName:
                        getVal(row, 'Name') ||
                        getVal(row, 'Username') ||
                        getVal(row, 'Full Name'),
                });
                const name = derivedUsername || '';
                const phone = String(getVal(row, 'Phone') || getVal(row, 'Phone Number') || '').trim();
                const department = String(getVal(row, 'Department') || '').trim();
                const location = String(getVal(row, 'Location') || '').trim();
                const role = normalizeRole(getVal(row, 'Role'));
                const status = normalizeStatus(getVal(row, 'Status'));
                const linkedPidsRaw = String(getVal(row, 'Linked Device PIDs') || '').trim();

                const linkedPids = linkedPidsRaw
                    ? linkedPidsRaw.split(/[,;]+/).map((p) => p.trim()).filter(Boolean)
                    : [];

                // === Create or enrich the user ===
                const existing = await prisma.user.findFirst({
                    where: { email: { equals: email, mode: 'insensitive' } },
                });

                let userId;
                if (existing) {
                    userId = existing.id;
                    const patch = {};
                    if (!existing.firstName && firstName) patch.firstName = firstName;
                    if (!existing.lastName && lastName) patch.lastName = lastName;
                    if (!existing.username && name) patch.username = name;
                    if (!existing.phoneNumber && phone) patch.phoneNumber = phone;
                    if (!existing.department && department) patch.department = department;
                    if (!existing.location && location) patch.location = location;
                    // Role / Status are only set on creation — we don't downgrade
                    // an ACTIVE user back to PENDING or change someone's role
                    // implicitly. Leave those alone on enrichment.
                    if (Object.keys(patch).length > 0) {
                        try {
                            await prisma.user.update({ where: { id: userId }, data: patch });
                        } catch (uErr) {
                            // Most likely a unique-username conflict — non-fatal.
                            console.warn(`Enrich failed for ${email}:`, uErr.message);
                        }
                    }
                    results.updated += 1;
                } else {
                    try {
                        const created = await prisma.user.create({
                            data: {
                                email,
                                username: name || null,
                                firstName: firstName || null,
                                lastName: lastName || null,
                                password: null,
                                role,
                                status,
                                phoneNumber: phone || null,
                                department: department || null,
                                location: location || null,
                            },
                        });
                        userId = created.id;
                        results.created += 1;
                    } catch (cErr) {
                        // Username conflict → retry without username
                        if (cErr.code === 'P2002' && name) {
                            const created = await prisma.user.create({
                                data: {
                                    email,
                                    username: null,
                                    firstName: firstName || null,
                                    lastName: lastName || null,
                                    password: null,
                                    role,
                                    status,
                                    phoneNumber: phone || null,
                                    department: department || null,
                                    location: location || null,
                                },
                            });
                            userId = created.id;
                            results.created += 1;
                        } else {
                            throw cErr;
                        }
                    }
                }

                // === Link inventory devices by PID ===
                if (userId && linkedPids.length > 0) {
                    const matched = await prisma.inventoryItem.findMany({
                        where: { pid: { in: linkedPids } },
                        select: { id: true, pid: true },
                    });

                    if (matched.length > 0) {
                        const matchedIds = matched.map((m) => m.id);
                        const updated = await prisma.inventoryItem.updateMany({
                            where: { id: { in: matchedIds } },
                            data: { userId },
                        });
                        results.devicesLinked += updated.count;
                    }

                    const matchedPidSet = new Set(matched.map((m) => m.pid));
                    const missing = linkedPids.filter((p) => !matchedPidSet.has(p));
                    if (missing.length > 0) {
                        results.errors.push(
                            `Row ${rowNumber}: PID(s) not found — ${missing.join(', ')}`,
                        );
                    }
                }
            } catch (err) {
                results.failed += 1;
                results.errors.push(`Row ${rowNumber}: ${err.message}`);
            }
        }

        return NextResponse.json({
            message: `Processed ${rows.length} rows`,
            results,
        });
    } catch (err) {
        console.error('Team bulk import error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
