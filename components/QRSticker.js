/**
 * QRSticker — a single device QR sticker, used in both single-print and
 * bulk-print so the layout is pixel-identical regardless of how many you
 * generate at once.
 *
 * Renders as a fixed-size card (≈ 58 × 38 mm), 6 stickers fit on an A4 sheet.
 * The QR image is generated server-side (via the `qrcode` lib) and embedded
 * as a base64 data URL — so the print page works offline and there's no
 * extra network request per sticker.
 */

import QRCode from 'qrcode';

const STICKER_MM = { width: 58, height: 38 }; // 58×38 mm — fits 6-up on A4

async function makeQrDataUrl(url) {
    return QRCode.toDataURL(url, {
        margin: 1,
        width: 220,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000ff', light: '#ffffffff' },
    });
}

export default async function QRSticker({
    item,
    baseUrl,
    // Dark-on-white logo for the printed sticker. White background → use the
    // dark variant (`EP_Logo.png`); the `_White` / `_W`-suffixed assets are
    // reserved for dark backgrounds and would disappear on paper.
    logoSrc = '/EP_Logo.png',
    logoAlt = 'Excellent Publicity',
}) {
    const scanUrl = `${baseUrl}/report/${encodeURIComponent(item.pid)}`;
    const qrSrc = await makeQrDataUrl(scanUrl);

    const deviceLine =
        [item.brand, item.model].filter(Boolean).join(' ') || (item.type || '');

    return (
        <div
            className="qr-sticker"
            style={{
                width: `${STICKER_MM.width}mm`,
                height: `${STICKER_MM.height}mm`,
                boxSizing: 'border-box',
                border: '1px solid #cbd5e1',
                borderRadius: '2.5mm',
                padding: '2mm 2.5mm',
                display: 'flex',
                alignItems: 'stretch',
                gap: '2mm',
                background: '#ffffff',
                color: '#0f172a',
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
                overflow: 'hidden',
            }}
        >
            {/* QR */}
            <img
                src={qrSrc}
                alt={`QR for ${item.pid}`}
                style={{
                    width: '32mm',
                    height: '32mm',
                    flexShrink: 0,
                    display: 'block',
                }}
            />

            {/* Right column */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minWidth: 0,
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: '6pt',
                            color: '#64748b',
                            letterSpacing: '0.6pt',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                        }}
                    >
                        Scan Me
                    </div>
                    <div
                        style={{
                            fontSize: '14pt',
                            fontWeight: 800,
                            lineHeight: 1.05,
                            marginTop: '0.4mm',
                            letterSpacing: '-0.2pt',
                        }}
                    >
                        {item.pid}
                    </div>
                    {deviceLine && (
                        <div
                            style={{
                                fontSize: '7pt',
                                color: '#334155',
                                marginTop: '0.8mm',
                                lineHeight: 1.25,
                                // Allow up to 2 lines so "LENOVO IDEAPAD…" wraps
                                // instead of being truncated with an ellipsis.
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                                overflow: 'hidden',
                                wordBreak: 'break-word',
                            }}
                        >
                            {deviceLine}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        marginTop: '0.5mm',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                    }}
                >
                    <img
                        src={logoSrc}
                        alt={logoAlt}
                        style={{
                            // Sticker is 38 mm tall; ~9 mm logo reads strongly
                            // without crowding the device-name line above it.
                            height: '9mm',
                            width: 'auto',
                            maxWidth: '24mm',
                            display: 'block',
                            objectFit: 'contain',
                            // Force a high-contrast paint regardless of theme:
                            // the printed sticker is always on white paper, so
                            // we treat the logo as a dark mark.
                            filter: 'none',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
