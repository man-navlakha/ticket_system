import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { maskEmail, maskName, maskPhone } from '@/lib/mask';
import ReportClient from './ReportClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { pid } = await params;
    return {
        title: `Report an issue · ${pid}`,
        description: `Report a problem with device ${pid}. No login required.`,
        robots: { index: false, follow: false },
    };
}

/**
 * /report/[pid]
 *
 * Public scan landing page. Anyone holding the device (which has the QR
 * sticker on it) can open this URL and file a ticket in 20 seconds.
 *
 * Device details + masked person details are pre-fetched on the server so
 * the page is instant on slow mobile networks. Full details require an
 * email OTP — handled client-side via /api/quick-report/verify-reveal.
 */
export default async function PublicReportPage({ params }) {
    const { pid } = await params;
    if (!pid) notFound();

    const item = await prisma.inventoryItem.findUnique({
        where: { pid },
        include: {
            user: {
                select: { id: true, username: true, email: true, phoneNumber: true, department: true },
            },
        },
    });
    if (!item) notFound();

    const personName = item.user?.username || item.assignedUser || null;
    const personEmail = item.user?.email || null;
    const personPhone = item.user?.phoneNumber || null;

    const data = {
        device: {
            pid: item.pid,
            type: item.type,
            brand: item.brand,
            model: item.model,
            serialNumber: item.serialNumber,
            os: item.os,
            location: item.location,
            department: item.department || item.user?.department || null,
        },
        person: {
            nameMasked: personName ? maskName(personName) : null,
            emailMasked: personEmail ? maskEmail(personEmail) : null,
            phoneMasked: personPhone ? maskPhone(personPhone) : null,
            hasContact: Boolean(personEmail),
        },
    };

    return <ReportClient initial={data} />;
}
