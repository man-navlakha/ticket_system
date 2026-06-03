import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

/**
 * POST /api/admin/inventory/heal-links?dryRun=true
 *
 * Scans every inventory row where `userId` is NULL but `assignedUser`
 * is a free-text name like "Kapil Jogi" and tries to link it to an
 * existing User row using a fuzzy match.
 *
 * Match strategy (first hit wins per device):
 *   1. firstName + lastName (case-insensitive)
 *   2. username (case-insensitive)
 *   3. email local-part (e.g. "kapil" → "kapil@...")
 *   4. firstName only (when there's no last name)
 *
 * Only UNAMBIGUOUS matches (exactly one candidate) get linked. Devices
 * with multiple candidates are returned as `ambiguous` so an admin can
 * resolve them manually.
 *
 * Pass ?dryRun=true to preview without writing.
 */
export async function POST(request) {
    const me = await getCurrentUser();
    if (!me || (me.role !== 'ADMIN' && me.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true';

    // 1. Pull all orphan rows in one query
    const orphans = await prisma.inventoryItem.findMany({
        where: {
            userId: null,
            assignedUser: { not: null },
        },
        select: { id: true, pid: true, assignedUser: true },
    });

    if (orphans.length === 0) {
        return NextResponse.json({
            ok: true,
            scanned: 0,
            linked: 0,
            ambiguous: [],
            unmatched: [],
            note: 'No orphan rows to heal — every assigned device is already linked.',
        });
    }

    // 2. Pull every user once (way cheaper than running 125 separate queries)
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
        },
    });

    // Build cheap lookup indexes
    const byFullName = new Map();       // "kapil jogi" → [user, ...]
    const byUsername = new Map();       // "kapil jogi" → [user, ...]
    const byEmailLocal = new Map();     // "kapil"      → [user, ...]
    const byFirstName = new Map();      // "kapil"      → [user, ...]

    const push = (map, key, u) => {
        const k = key.toLowerCase().trim();
        if (!k) return;
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(u);
    };

    for (const u of users) {
        const first = (u.firstName || '').trim();
        const last = (u.lastName || '').trim();
        if (first || last) push(byFullName, `${first} ${last}`.trim(), u);
        if (u.username) push(byUsername, u.username, u);
        if (u.email && u.email.includes('@')) {
            push(byEmailLocal, u.email.split('@')[0], u);
        }
        if (first) push(byFirstName, first, u);
    }

    // 3. Walk every orphan and decide
    const linked = [];
    const ambiguous = [];
    const unmatched = [];

    for (const row of orphans) {
        const text = (row.assignedUser || '').trim().replace(/\s+/g, ' ');
        if (!text) {
            unmatched.push({ pid: row.pid, assignedUser: text });
            continue;
        }
        const lower = text.toLowerCase();
        const parts = text.split(' ');
        const first = (parts[0] || '').toLowerCase();
        const hasLast = parts.length > 1;

        // Pick the first strategy that returns a non-empty hit list
        let candidates =
            byFullName.get(lower) ||
            byUsername.get(lower) ||
            byEmailLocal.get(lower) ||
            (!hasLast ? byFirstName.get(first) : null) ||
            [];

        if (candidates.length === 1) {
            linked.push({
                pid: row.pid,
                assignedUser: text,
                userId: candidates[0].id,
                email: candidates[0].email,
            });
        } else if (candidates.length > 1) {
            ambiguous.push({
                pid: row.pid,
                assignedUser: text,
                candidateCount: candidates.length,
                candidates: candidates.map((c) => ({
                    id: c.id,
                    email: c.email,
                    name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.username,
                })),
            });
        } else {
            unmatched.push({ pid: row.pid, assignedUser: text });
        }
    }

    // 4. Apply the unambiguous links unless dryRun
    if (!dryRun && linked.length > 0) {
        // Group inventory ids by userId so we can do one updateMany per user
        const byUserId = new Map();
        for (const l of linked) {
            if (!byUserId.has(l.userId)) byUserId.set(l.userId, []);
            byUserId.get(l.userId).push(
                orphans.find((o) => o.pid === l.pid)?.id,
            );
        }

        for (const [userId, invIds] of byUserId.entries()) {
            const cleanIds = invIds.filter(Boolean);
            if (cleanIds.length === 0) continue;
            try {
                await prisma.inventoryItem.updateMany({
                    where: { id: { in: cleanIds } },
                    data: { userId },
                });
            } catch (e) {
                console.warn(`Heal-link failed for user ${userId}:`, e.message);
            }
        }
    }

    return NextResponse.json({
        ok: true,
        dryRun,
        scanned: orphans.length,
        linked: linked.length,
        ambiguousCount: ambiguous.length,
        unmatchedCount: unmatched.length,
        // Sample data so the admin can see what was decided
        linkedSample: linked.slice(0, 20),
        ambiguous: ambiguous.slice(0, 20),
        unmatched: unmatched.slice(0, 20),
    });
}
