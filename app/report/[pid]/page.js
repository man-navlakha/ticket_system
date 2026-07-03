import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { maskEmail, maskName, maskPhone } from '@/lib/mask';
import { SIGNATURES } from '@/lib/email-signatures';
import ReportClient from './ReportClient';

// Same rule the signature list was generated with, so a person's name maps to
// their /email-signature/[slug] page.
function signatureSlugFor(name) {
    if (!name) return null;
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return SIGNATURES.some((p) => p.slug === slug) ? slug : null;
}

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
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phoneNumber: true,
                    department: true,
                    status: true,
                    signatureSlug: true,
                },
            },
        },
    });
    if (!item) notFound();

    // === Fuzzy heal: link orphaned inventory rows to existing users ==========
    // If the inventory row has no `userId` but does have a free-text
    // `assignedUser` like "Kapil Jogi", try to find a User whose:
    //   - firstName + lastName matches, OR
    //   - username matches (case-insensitive)
    // If we find exactly one, persist the link so future scans use it directly
    // — and use it for THIS render so the QR page shows the email + activation.
    if (!item.user && item.assignedUser) {
        const fullText = item.assignedUser.trim().replace(/\s+/g, ' ');
        const parts = fullText.split(' ');
        const first = parts[0] || '';
        const last = parts.slice(1).join(' ');

        const candidates = await prisma.user.findMany({
            where: {
                OR: [
                    // Exact "first last" match on structured columns
                    last
                        ? {
                            AND: [
                                { firstName: { equals: first, mode: 'insensitive' } },
                                { lastName: { equals: last, mode: 'insensitive' } },
                            ],
                        }
                        : { firstName: { equals: first, mode: 'insensitive' } },
                    // Legacy single-string username (e.g. imported as "Kapil Jogi")
                    { username: { equals: fullText, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                department: true,
                status: true,
                signatureSlug: true,
            },
            take: 2,
        });

        // Only auto-link when there's an UNAMBIGUOUS match — otherwise we'd
        // risk attaching the device to the wrong person.
        if (candidates.length === 1) {
            const match = candidates[0];
            try {
                await prisma.inventoryItem.update({
                    where: { id: item.id },
                    data: { userId: match.id },
                });
                item.userId = match.id;
                item.user = match;
            } catch (e) {
                // Healing is best-effort; never break the public page if the
                // write fails. Fall back to surfacing the match read-only.
                item.user = match;
            }
        }
    }

    // Build the assigned person from whichever fields exist. The User row
    // may be missing entirely (free-text `assignedUser` only — e.g. an
    // external contractor), or the User may exist but be PENDING with no
    // phone yet. Either way we surface every field we know about; the
    // client decides what to render.
    const firstName = item.user?.firstName || '';
    const lastName = item.user?.lastName || '';
    const structuredFullName = `${firstName} ${lastName}`.trim();
    const personName =
        structuredFullName ||
        item.user?.username ||
        item.assignedUser ||
        null;
    const personEmail = item.user?.email || null;
    const personPhone = item.user?.phoneNumber || null;

    const commonProblems = await prisma.commonProblem.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, label: true },
    });

    const data = {
        commonProblems,
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
            hasName: Boolean(personName),
            hasEmail: Boolean(personEmail),
            hasPhone: Boolean(personPhone),
            // True if there's ANY assigned person info — name OR contact.
            hasAny: Boolean(personName || personEmail || personPhone),
            // True only when we can email a verification code.
            canReveal: Boolean(personEmail),
            // Keep `hasContact` for back-compat — older clients still work.
            hasContact: Boolean(personEmail),
            // Account status — drives the "Activate your account" CTA.
            //   PENDING = invite was sent but user hasn't set a password yet.
            //   ACTIVE  = fully signed up.
            //   SUSPENDED / null are not activatable from here.
            status: item.user?.status || null,
            // True when the linked user has not yet set a password — they
            // can request a fresh activation link to their own email.
            canActivate: Boolean(personEmail) && item.user?.status === 'PENDING',
            // Direct link to this person's email-signature page. Prefer the
            // explicit assignment from the team page; fall back to a name match.
            signatureSlug:
                (item.user?.signatureSlug &&
                    SIGNATURES.some((p) => p.slug === item.user.signatureSlug) &&
                    item.user.signatureSlug) ||
                signatureSlugFor(personName),
        },
    };

    return <ReportClient initial={data} />;
}
