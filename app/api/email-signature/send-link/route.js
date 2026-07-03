import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { maskEmail } from '@/lib/mask';
import { SIGNATURES } from '@/lib/email-signatures';
import { sendSignatureLinkEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

// For manually-typed addresses (fallback only) — restrict to company mailboxes
// so this public endpoint can't be used to mail arbitrary people.
const ALLOWED_DOMAIN = 'excellentpublicity.com';

function baseUrl(request) {
    return (
        process.env.NEXT_PUBLIC_APP_URL ||
        request.headers.get('origin') ||
        new URL(request.url).origin
    );
}

// Same rule the signature list was generated with, so a person's name maps to
// their /email-signature/[slug] page.
function slugify(name) {
    return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * POST /api/email-signature/send-link
 * Body: { pid?, email?, slug? }
 *
 * Preferred: pass `pid` — we look up the device's assigned person and email
 * THEM the link (the address is never exposed to the browser). Falls back to a
 * manually-typed company email when the device has no person/email on file.
 */
export async function POST(request) {
    try {
        const { pid, email, slug } = await request.json().catch(() => ({}));

        const person = slug ? SIGNATURES.find((p) => p.slug === slug) : null;
        const link = `${baseUrl(request)}/email-signature${person ? `/${person.slug}` : ''}`;
        const ip = request.headers.get('x-forwarded-for') || 'anon';

        // --- Preferred path: resolve the email from the device pid ----------
        if (pid) {
            const rl = await rateLimit(`sig-link:pid:${pid}:${ip}`, 5, 10 * 60_000);
            if (!rl.success) {
                return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 });
            }
            const item = await prisma.inventoryItem.findUnique({
                where: { pid },
                select: {
                    user: {
                        select: { email: true, firstName: true, lastName: true, username: true, signatureSlug: true },
                    },
                },
            });
            const target = item?.user?.email;
            if (!target) {
                return NextResponse.json(
                    { error: 'No email on file for this device — enter yours instead.', needsEmail: true },
                    { status: 409 },
                );
            }

            // Deep-link straight to the assigned person's signature page when we
            // can match their name; otherwise fall back to the search page.
            const fullName =
                [item.user.firstName, item.user.lastName].filter(Boolean).join(' ').trim() ||
                item.user.username ||
                '';
            // Prefer the explicit team-page assignment, then the slug the page
            // resolved, then a name match.
            const matched =
                SIGNATURES.find((p) => p.slug === item.user.signatureSlug) ||
                (slug && SIGNATURES.find((p) => p.slug === slug)) ||
                SIGNATURES.find((p) => p.slug === slugify(fullName));
            const personLink = `${baseUrl(request)}/email-signature${matched ? `/${matched.slug}` : ''}`;

            await sendSignatureLinkEmail(target, personLink);
            return NextResponse.json({ ok: true, maskedEmail: maskEmail(target), slug: matched?.slug || null });
        }

        // --- Fallback path: manually-typed company email --------------------
        const clean = String(email || '').trim().toLowerCase();
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
        if (!emailOk) {
            return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
        }
        if (!clean.endsWith(`@${ALLOWED_DOMAIN}`)) {
            return NextResponse.json({ error: `Use your @${ALLOWED_DOMAIN} email.` }, { status: 403 });
        }

        const rl = await rateLimit(`sig-link:${clean}:${ip}`, 5, 10 * 60_000);
        if (!rl.success) {
            return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 });
        }

        await sendSignatureLinkEmail(clean, link);
        return NextResponse.json({ ok: true, maskedEmail: maskEmail(clean) });
    } catch (err) {
        console.error('send-link error:', err);
        return NextResponse.json({ error: 'Could not send the link.' }, { status: 500 });
    }
}
