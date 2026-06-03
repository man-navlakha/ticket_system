import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { buildTeamExportCsv } from '@/lib/teamCsv';

/**
 * GET /api/team/export
 *
 * Roundtrip-safe team export. Schema matches /api/team/bulk import so
 * you can: Export → edit in Excel → Import without losing data.
 */
export async function GET() {
    const me = await getCurrentUser();
    if (!me || (me.role !== 'ADMIN' && me.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            department: true,
            location: true,
            role: true,
            status: true,
            createdAt: true,
            inventory: { select: { pid: true } },
            _count: { select: { tickets: true, inventory: true } },
        },
    });

    const csv = buildTeamExportCsv(users);
    const dateStamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="team-export-${dateStamp}.csv"`,
            'Cache-Control': 'no-store',
        },
    });
}
