import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { buildTeamSampleCsv } from '@/lib/teamCsv';

export async function GET() {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return new NextResponse(buildTeamSampleCsv(), {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="team-sample.csv"',
            'Cache-Control': 'no-store',
        },
    });
}
