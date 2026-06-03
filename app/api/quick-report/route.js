import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNewTicketNotification } from '@/lib/email';
import { getBaseUrl } from '@/lib/get-base-url';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/quick-report
 *
 * Public endpoint hit by the QR-scan landing page. Creates a ticket linked
 * to the inventory item (by pid) and to the assigned user.
 *
 * Body:
 *   { pid: "EP-019",
 *     description: "Screen is flickering",
 *     attachmentUrls?: string[],
 *     reporterName?: string,    // when reporter is not the assigned user
 *     reporterContact?: string, // email / phone — free text for the agent
 *   }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { pid, description, attachmentUrls, reporterName, reporterContact } = body || {};

        if (!pid || !description?.trim()) {
            return NextResponse.json(
                { error: 'Please write what is wrong with the device.' },
                { status: 400 },
            );
        }

        // Rate-limit by pid + IP — prevent spam scans
        const ip = request.headers.get('x-forwarded-for') || 'anon';
        const rl = await rateLimit(`qr-report:${pid}:${ip}`, 5, 10 * 60_000);
        if (!rl.success) {
            return NextResponse.json(
                { error: 'You have submitted several reports just now. Please wait a few minutes.' },
                { status: 429 },
            );
        }

        const item = await prisma.inventoryItem.findUnique({
            where: { pid },
            include: { user: { select: { id: true, email: true, username: true } } },
        });
        if (!item) {
            return NextResponse.json({ error: 'Device not found.' }, { status: 404 });
        }
        if (!item.userId) {
            return NextResponse.json(
                {
                    error:
                        'This device is not linked to a user, so a ticket cannot be raised through the QR. Please contact support directly.',
                },
                { status: 409 },
            );
        }

        const cleanedDescription = String(description).slice(0, 4000).trim();
        const reporterLine =
            reporterName || reporterContact
                ? `\n\n— Reported by ${[reporterName, reporterContact].filter(Boolean).join(' · ')} via QR scan`
                : '\n\n— Reported via QR scan';

        const safeAttachments = Array.isArray(attachmentUrls)
            ? attachmentUrls.filter((u) => typeof u === 'string' && u.length < 2048).slice(0, 6)
            : [];

        const ticket = await prisma.ticket.create({
            data: {
                title: `[QR] ${item.brand || ''} ${item.model || ''} (${item.pid})`.trim(),
                description: cleanedDescription + reporterLine,
                priority: 'MEDIUM',
                status: 'OPEN',
                userId: item.userId, // attributed to the assigned user
                inventoryItemId: item.id,
                productName: `${item.brand || ''} ${item.model || ''} (${item.pid})`.trim(),
                attachmentUrls: safeAttachments,
            },
        });

        // Notify agents (best-effort, fire & forget)
        const baseUrl = getBaseUrl(request);
        (async () => {
            try {
                const staff = await prisma.user.findMany({
                    where: { role: { in: ['ADMIN', 'AGENT'] }, status: 'ACTIVE' },
                    select: { email: true },
                });
                for (const person of staff) {
                    await sendNewTicketNotification(
                        person.email,
                        {
                            id: ticket.id,
                            title: ticket.title,
                            description: ticket.description,
                            priority: ticket.priority,
                            userEmail: item.user?.email || '(no email)',
                            userName: item.user?.username || item.assignedUser || 'Unknown',
                        },
                        baseUrl,
                    );
                }
            } catch (err) {
                console.error('QR-report notify error:', err);
            }
        })();

        return NextResponse.json({
            ok: true,
            ticketId: ticket.id,
            trackUrl: `${baseUrl}/?ticket=${ticket.id}`,
        });
    } catch (err) {
        console.error('quick-report error:', err);
        return NextResponse.json({ error: 'Could not submit the report.' }, { status: 500 });
    }
}
