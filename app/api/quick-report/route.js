import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNewTicketNotification, sendTicketConfirmationToReporter } from '@/lib/email';
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
            include: {
                user: {
                    select: { id: true, email: true, username: true, status: true },
                },
            },
        });
        if (!item) {
            return NextResponse.json({ error: 'Device not found.' }, { status: 404 });
        }

        // === Resolve a ticket owner — never block the scan. ====================
        // Preference order:
        //   1. The device's assigned user, regardless of status (PENDING /
        //      SUSPENDED users still get the ticket attributed to them; an
        //      agent can re-route later if needed).
        //   2. The longest-tenured ACTIVE admin (catch-all owner).
        //   3. Any ACTIVE agent.
        // If none of those exist, return a friendly message — but at this
        // point the system has no working IT team to receive the ticket,
        // which is a much bigger problem than the scan.
        let ownerId = item.userId || null;
        let ownerNote = '';
        if (!ownerId) {
            const fallback = await prisma.user.findFirst({
                where: { status: 'ACTIVE', role: { in: ['ADMIN', 'AGENT'] } },
                orderBy: [{ role: 'asc' }, { createdAt: 'asc' }], // ADMIN before AGENT
                select: { id: true, email: true, role: true },
            });
            if (!fallback) {
                return NextResponse.json(
                    {
                        error:
                            'No IT staff are available to receive this report yet. Please email support directly.',
                    },
                    { status: 503 },
                );
            }
            ownerId = fallback.id;
            ownerNote = `\n\n⚠ Device is currently unassigned — routed to ${fallback.role.toLowerCase()} ${fallback.email} as catch-all.`;
        } else if (item.user?.status && item.user.status !== 'ACTIVE') {
            // Assignee exists but hasn't activated yet (PENDING) or is
            // suspended. We still attribute the ticket to them, but flag
            // it so agents know the owner can't respond from the dashboard.
            ownerNote = `\n\nℹ Note: assigned user (${item.user.email}) is currently ${item.user.status.toLowerCase()} — agent action may be required.`;
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
                description: cleanedDescription + reporterLine + ownerNote,
                priority: 'MEDIUM',
                status: 'OPEN',
                userId: ownerId, // resolved above — never null
                inventoryItemId: item.id,
                productName: `${item.brand || ''} ${item.model || ''} (${item.pid})`.trim(),
                attachmentUrls: safeAttachments,
            },
        });

        // Notify agents + reporter (best-effort, fire & forget). All further
        // conversation happens over email — IT updates ticket status manually
        // in the dashboard for now.
        const baseUrl = getBaseUrl(request);
        const reporterEmail = item.user?.email || null;
        const itInbox = process.env.GMAIL_USER || null;
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
                            userEmail: reporterEmail || '(device unassigned — see ticket body)',
                            userName:
                                item.user?.username ||
                                item.assignedUser ||
                                (item.user ? item.user.email : 'Anonymous scan'),
                        },
                        baseUrl,
                        reporterEmail || undefined, // Reply-To → reporter, so IT can just hit Reply
                    );
                }

                // Confirm to the reporter (assigned user). Reply-To points at
                // the IT inbox so their reply lands with IT directly.
                if (reporterEmail) {
                    await sendTicketConfirmationToReporter(
                        reporterEmail,
                        {
                            id: ticket.id,
                            title: ticket.title,
                            description: cleanedDescription,
                            priority: ticket.priority,
                        },
                        itInbox || undefined,
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
