import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/common-problems
 *
 * Public — used by the /report/[pid] page to populate the "Pick a problem"
 * dropdown. Returns only active items, ordered for display.
 */
export async function GET() {
    try {
        const rows = await prisma.commonProblem.findMany({
            where: { active: true },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            select: { id: true, label: true },
        });
        return NextResponse.json({ items: rows });
    } catch (err) {
        console.error('common-problems list error:', err);
        return NextResponse.json({ items: [] });
    }
}
