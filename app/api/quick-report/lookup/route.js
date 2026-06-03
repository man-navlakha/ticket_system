import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { maskEmail, maskName, maskPhone } from '@/lib/mask';

/**
 * GET /api/quick-report/lookup?pid=EP-019
 *
 * Public — no auth required. The QR sticker already contains the pid, so
 * anyone scanning is assumed to physically have the device.
 *
 * Returns the device + assigned-person summary with personal fields MASKED.
 * Full details require email-OTP verification (see /request-reveal).
 */
export async function GET(request) {
    const pid = request.nextUrl.searchParams.get('pid');
    if (!pid) {
        return NextResponse.json({ error: 'Missing pid' }, { status: 400 });
    }

    const item = await prisma.inventoryItem.findUnique({
        where: { pid },
        include: {
            user: {
                select: { id: true, username: true, email: true, phoneNumber: true, department: true },
            },
        },
    });

    if (!item) {
        return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const personName = item.user?.username || item.assignedUser || null;
    const personEmail = item.user?.email || null;
    const personPhone = item.user?.phoneNumber || null;

    return NextResponse.json({
        device: {
            pid: item.pid,
            type: item.type,
            brand: item.brand,
            model: item.model,
            serialNumber: item.serialNumber, // safe — printed on the device anyway
            os: item.os,
            location: item.location,
            department: item.department || item.user?.department || null,
        },
        person: {
            // Masked previews — UI shows these by default
            nameMasked: personName ? maskName(personName) : null,
            emailMasked: personEmail ? maskEmail(personEmail) : null,
            phoneMasked: personPhone ? maskPhone(personPhone) : null,
            hasContact: Boolean(personEmail),
        },
    });
}
