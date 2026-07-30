import { proxyAgentActivityControl } from '@/lib/agent-activity-control';

export const dynamic = 'force-dynamic';

export async function POST(request, context) {
    return proxyAgentActivityControl(request, context, {
        upstreamPrefix: '/api/admin/remote-commands/scan',
        activityLabel: 'file scanning',
    });
}
