import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getTicketAuditLogs } from '@/lib/audit';

export async function GET(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get audit logs for the ticket
        const logs = await getTicketAuditLogs(id);

        return NextResponse.json({
            logs: logs.map(log => ({
                id: log.id,
                action: log.action,
                changes: log.changes,
                metadata: log.metadata,
                user: log.user,
                createdAt: log.createdAt,
            })),
        });
    } catch (error) {
        console.error('Audit logs error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch audit logs' },
            { status: 500 }
        );
    }
}
