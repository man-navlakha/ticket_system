import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getBaseUrl } from '@/lib/get-base-url';
import QRSticker from '@/components/QRSticker';
import PrintControls from './PrintControls';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Print QR Stickers · Inventory' };

/**
 * /dashboard/inventory/print-qr
 *
 * Supports three modes (same visual layout for all):
 *   ?id=<inventoryItemId>        — single sticker
 *   ?ids=id1,id2,id3             — selected
 *   ?all=1                       — every device in inventory
 *
 * The card chrome (header, buttons) is hidden when printing — only the
 * sticker sheet ends up on paper.
 */
export default async function PrintQrPage({ searchParams }) {
    const user = await getCurrentUser();
    if (!user) redirect('/auth/login');
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        redirect('/dashboard/inventory');
    }

    const sp = (await searchParams) || {};
    const singleId = sp.id;
    const idsParam = sp.ids;
    const all = sp.all === '1' || sp.all === 'true';

    let where = {};
    if (singleId) {
        where = { id: singleId };
    } else if (idsParam) {
        const ids = String(idsParam)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        where = { id: { in: ids } };
    } else if (!all) {
        // No params at all → empty (controls let admin pick mode)
        where = { id: '__none__' };
    }

    const items = await prisma.inventoryItem.findMany({
        where,
        orderBy: { pid: 'asc' },
        include: {
            user: { select: { id: true, username: true, email: true } },
        },
    });

    // Build base URL from the LIVE request so QRs encode the public domain,
    // never localhost (uses the helper we built for emails).
    const h = await headers();
    const baseUrl = getBaseUrl({ headers: h });

    return (
        <div className="space-y-6">
            <PrintControls
                count={items.length}
                mode={singleId ? 'single' : all ? 'all' : idsParam ? 'selected' : 'none'}
            />

            {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
                    <p className="text-sm">
                        No devices selected. Use the buttons on the inventory page to print
                        QRs for one, several, or all devices.
                    </p>
                </div>
            ) : (
                <div className="print-sheet">
                    {items.map((item) => (
                        <QRSticker key={item.id} item={item} baseUrl={baseUrl} />
                    ))}
                </div>
            )}

            {/*
              Print-only CSS:
              - Hide the controls bar and surrounding chrome
              - Fit 6 stickers per A4 page (3 columns × 2 rows, ish)
              - Avoid page-breaks inside individual stickers
            */}
            <style>{`
                .print-sheet {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 5mm;
                    padding: 5mm;
                    background: #f8fafc;
                    border: 1px dashed #e2e8f0;
                    border-radius: 12px;
                }

                @media print {
                    /* A4 portrait, 5 mm margins so we have ~200 × 287 mm usable.
                       Three 58 mm stickers + 2 × 3 mm gaps = 180 mm — fits with
                       comfortable side margin. Seven 38 mm stickers + 6 × 3 mm
                       gaps = 284 mm vertically — fits 21 per page cleanly. */
                    @page { size: A4 portrait; margin: 5mm; }

                    /* Reset every ancestor that might add padding / max-width
                       so the sticker sheet starts at the page's left edge. */
                    html, body {
                        background: #ffffff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body * { box-sizing: border-box; }

                    /* Hide every piece of app chrome — sidebar, headers, navs,
                       toolbar, anything explicitly opted out. */
                    body > div > aside,
                    body header,
                    body nav,
                    [data-print-hide],
                    [data-print-hide] * {
                        display: none !important;
                        visibility: hidden !important;
                    }

                    /* Strip the layout containers' padding + max-width clamps
                       so the sticker grid uses the full printable area. */
                    main,
                    body > div,
                    body > div > div {
                        margin: 0 !important;
                        padding: 0 !important;
                        max-width: 100% !important;
                        width: 100% !important;
                    }

                    /* Switch to flex-wrap on print: easier for the browser to
                       page-break cleanly than a stretchy grid. */
                    .print-sheet {
                        display: flex !important;
                        flex-wrap: wrap;
                        align-content: flex-start;
                        justify-content: flex-start;
                        gap: 3mm !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: #ffffff !important;
                        border: 0 !important;
                        border-radius: 0 !important;
                        width: 100% !important;
                    }

                    /* Each sticker keeps its fixed mm size and never splits
                       across a page break. */
                    .print-sheet > * {
                        flex: 0 0 auto;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    /* Make any rogue lingering page > 0 origin start clean. */
                    .qr-sticker {
                        margin: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
