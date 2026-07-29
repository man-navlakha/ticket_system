'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    Copy,
    Download,
    Globe2,
    Pencil,
    RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    SIGNATURE_DIR,
    ATLAS_GIF,
    RENDER_WIDTH,
    ATLAS_HEIGHT,
    SIGN_HEIGHT,
} from '@/lib/email-signatures';
import cloudinaryManifest from '@/lib/email-signature-cloudinary.json';

const CONFIGURED_ASSET_BASE_URL =
    process.env.NEXT_PUBLIC_SIGNATURE_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    '';

const DEFAULT_CONTACT = 'Feel free to contact us in case of any query.';
const DEFAULT_CLOSING = 'Thanking you,\nWith best regards,';
const DEFAULT_CONTACT_FONT_SIZE = 14;
const DEFAULT_CLOSING_FONT_SIZE = 14;
const DEFAULT_ATLAS_WIDTH = RENDER_WIDTH;
const DEFAULT_SIGNATURE_WIDTH = RENDER_WIDTH;

const FONT_SIZE_MIN = 10;
const FONT_SIZE_MAX = 24;
const IMAGE_WIDTH_MIN = 300;
const IMAGE_WIDTH_MAX = 700;

const subscribeToOrigin = () => () => {};
const getBrowserOrigin = () => window.location.origin;
const getServerOrigin = () => '';

export function signatureAssetBaseUrl(origin = '') {
    return (CONFIGURED_ASSET_BASE_URL || origin).replace(/\/+$/, '');
}

// Build a public URL for a file inside /public/Email Signature.
// encodeURI keeps "/" and "()" but turns spaces into %20 so email clients load it.
export function fileUrl(origin, file) {
    const cloudinaryUrl = cloudinaryManifest.assets?.[file];
    if (isPublicHttpsUrl(cloudinaryUrl)) return cloudinaryUrl;

    const baseUrl = signatureAssetBaseUrl(origin);
    return `${baseUrl}/${encodeURI(`${SIGNATURE_DIR}/${file}`)}`;
}

function isPublicHttpsUrl(value) {
    if (!value) return false;

    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    } catch {
        return false;
    }
}

function clampNumber(value, min, max, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.round(parsed)));
}

function scaledHeight(width, originalHeight) {
    return Math.round((width / RENDER_WIDTH) * originalHeight);
}

// Keep user-typed text valid inside HTML.
function escapeHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// The email-safe signature markup uses a single-column table and inline styles.
// Explicit pixel attributes keep the chosen sizes consistent in Gmail and Outlook.
export function buildSignatureHtml(origin, person, opts = {}) {
    const atlas = fileUrl(origin, ATLAS_GIF);
    const sign = fileUrl(origin, person.file);
    const contact = escapeHtml(opts.contactMessage ?? DEFAULT_CONTACT).trim();
    const closing = escapeHtml(opts.closing ?? DEFAULT_CLOSING).replace(/\r?\n/g, '<br>').trim();
    const contactFontSize = clampNumber(
        opts.contactFontSize,
        FONT_SIZE_MIN,
        FONT_SIZE_MAX,
        DEFAULT_CONTACT_FONT_SIZE,
    );
    const closingFontSize = clampNumber(
        opts.closingFontSize,
        FONT_SIZE_MIN,
        FONT_SIZE_MAX,
        DEFAULT_CLOSING_FONT_SIZE,
    );
    const atlasWidth = clampNumber(
        opts.atlasWidth,
        IMAGE_WIDTH_MIN,
        IMAGE_WIDTH_MAX,
        DEFAULT_ATLAS_WIDTH,
    );
    const signatureWidth = clampNumber(
        opts.signatureWidth,
        IMAGE_WIDTH_MIN,
        IMAGE_WIDTH_MAX,
        DEFAULT_SIGNATURE_WIDTH,
    );
    const atlasHeight = scaledHeight(atlasWidth, ATLAS_HEIGHT);
    const signatureHeight = scaledHeight(signatureWidth, SIGN_HEIGHT);
    const tableWidth = Math.max(atlasWidth, signatureWidth);

    return `<table cellpadding="0" cellspacing="0" border="0" width="${tableWidth}" style="border-collapse:collapse;font-family:Tahoma,Arial,sans-serif;width:${tableWidth}px;">

  <!-- Contact Message -->
  <tr>
    <td style="padding:0 0 16px 0;">

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">

        <tr>
          <td style="
              font-family:Georgia,serif;
              font-size:${contactFontSize}px;
              color:#143b74;
              font-weight:bold;">
            ${contact}
          </td>
        </tr>

        <tr>
          <td style="border-bottom:2px dashed #6d2db7;height:8px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- Closing -->
  <tr>
    <td style="
        padding:0 0 16px 0;
        font-family:Tahoma,Arial,sans-serif;
        font-size:${closingFontSize}px;
        line-height:${Math.round(closingFontSize * 2)}px;
        color:#6d2db7;
        font-weight:bold;">
      ${closing}
    </td>
  </tr>

  <!-- Atlas Banner -->
  <tr>
    <td style="padding:0 0 6px 0;">
      <a href="https://atlas.excellentpublicity.com" style="text-decoration:none;">
        <img
          src="${atlas}"
          width="${atlasWidth}"
          height="${atlasHeight}"
          alt="Atlas by Excellent Publicity"
          style="display:block;border:0;outline:none;width:${atlasWidth}px;height:${atlasHeight}px;">
      </a>
    </td>
  </tr>

  <!-- Signature -->
  <tr>
    <td>
      <img
        src="${sign}"
        width="${signatureWidth}"
        height="${signatureHeight}"
        alt="${person.name} - Excellent Publicity"
        style="display:block;border:0;outline:none;width:${signatureWidth}px;height:${signatureHeight}px;">
    </td>
  </tr>

</table>`;
}

function SizeControl({ label, value, min, max, step = 1, onChange }) {
    return (
        <label className="grid gap-2">
            <span className="flex items-center justify-between gap-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                {label}
                <output className="min-w-12 rounded-md bg-white px-2 py-1 text-right font-mono text-[11px] text-gray-700 ring-1 ring-gray-200 dark:bg-neutral-900 dark:text-gray-200 dark:ring-neutral-700">
                    {value}px
                </output>
            </span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="h-2 w-full cursor-pointer accent-[#7a1f5c]"
                aria-label={label}
            />
        </label>
    );
}

export default function SignaturePanel({ person }) {
    const [copied, setCopied] = useState(false);
    const [editing, setEditing] = useState(false);
    const [contactMessage, setContactMessage] = useState(DEFAULT_CONTACT);
    const [closing, setClosing] = useState(DEFAULT_CLOSING);
    const [contactFontSize, setContactFontSize] = useState(DEFAULT_CONTACT_FONT_SIZE);
    const [closingFontSize, setClosingFontSize] = useState(DEFAULT_CLOSING_FONT_SIZE);
    const [atlasWidth, setAtlasWidth] = useState(DEFAULT_ATLAS_WIDTH);
    const [signatureWidth, setSignatureWidth] = useState(DEFAULT_SIGNATURE_WIDTH);
    const previewRef = useRef(null);
    const origin = useSyncExternalStore(subscribeToOrigin, getBrowserOrigin, getServerOrigin);

    const signatureOptions = {
        contactMessage,
        closing,
        contactFontSize,
        closingFontSize,
        atlasWidth,
        signatureWidth,
    };
    const signatureImageUrl = fileUrl(origin, person.file);
    const hasDurableAssetHost = isPublicHttpsUrl(signatureImageUrl);
    const previewWidth = Math.max(atlasWidth, signatureWidth);

    async function handleCopy() {
        if (!previewRef.current) return;
        const html = buildSignatureHtml(origin, person, signatureOptions);

        try {
            if (navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([
                    new window.ClipboardItem({
                        'text/html': new Blob([html], { type: 'text/html' }),
                        'text/plain': new Blob(
                            [`${person.name} - Excellent Publicity`],
                            { type: 'text/plain' },
                        ),
                    }),
                ]);
            } else {
                const range = document.createRange();
                range.selectNodeContents(previewRef.current);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                document.execCommand('copy');
                selection.removeAllRanges();
            }

            setCopied(true);
            toast.success('Signature copied - now paste it into Gmail/Outlook settings');
            setTimeout(() => setCopied(false), 2500);
        } catch {
            toast.error('Copy failed. Use the Download button instead.');
        }
    }

    function resetSignature() {
        setContactMessage(DEFAULT_CONTACT);
        setClosing(DEFAULT_CLOSING);
        setContactFontSize(DEFAULT_CONTACT_FONT_SIZE);
        setClosingFontSize(DEFAULT_CLOSING_FONT_SIZE);
        setAtlasWidth(DEFAULT_ATLAS_WIDTH);
        setSignatureWidth(DEFAULT_SIGNATURE_WIDTH);
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Signature for</p>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{person.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setEditing((value) => !value)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                            editing
                                ? 'border-[#7a1f5c] bg-[#7a1f5c]/5 text-[#7a1f5c]'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800'
                        }`}
                    >
                        <Pencil size={14} /> {editing ? 'Done' : 'Edit signature'}
                    </button>
                    <Link
                        href="/email-signature"
                        className="inline-flex items-center gap-1 px-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white"
                    >
                        <ArrowLeft size={14} /> Search
                    </Link>
                </div>
            </div>

            {editing ? (
                <div className="mb-4 grid gap-5 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="grid gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Text</p>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Contact line</label>
                            <input
                                value={contactMessage}
                                onChange={(event) => setContactMessage(event.target.value)}
                                placeholder={DEFAULT_CONTACT}
                                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a1f5c]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">
                                Closing (one line each)
                            </label>
                            <textarea
                                value={closing}
                                onChange={(event) => setClosing(event.target.value)}
                                rows={2}
                                placeholder={DEFAULT_CLOSING}
                                className="w-full resize-y rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a1f5c]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SizeControl
                                label="Contact font size"
                                value={contactFontSize}
                                min={FONT_SIZE_MIN}
                                max={FONT_SIZE_MAX}
                                onChange={setContactFontSize}
                            />
                            <SizeControl
                                label="Closing font size"
                                value={closingFontSize}
                                min={FONT_SIZE_MIN}
                                max={FONT_SIZE_MAX}
                                onChange={setClosingFontSize}
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 border-t border-gray-200 pt-4 dark:border-neutral-800">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Images</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SizeControl
                                label="Atlas banner width"
                                value={atlasWidth}
                                min={IMAGE_WIDTH_MIN}
                                max={IMAGE_WIDTH_MAX}
                                step={10}
                                onChange={setAtlasWidth}
                            />
                            <SizeControl
                                label="Signature image width"
                                value={signatureWidth}
                                min={IMAGE_WIDTH_MIN}
                                max={IMAGE_WIDTH_MAX}
                                step={10}
                                onChange={setSignatureWidth}
                            />
                        </div>
                        <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                            Height adjusts automatically to keep each image in proportion.
                        </p>
                    </div>

                    <button
                        onClick={resetSignature}
                        className="inline-flex items-center gap-1.5 self-start text-xs text-gray-500 hover:text-gray-800 dark:hover:text-white"
                    >
                        <RotateCcw size={13} /> Reset to default
                    </button>
                </div>
            ) : null}

            <div className="overflow-x-auto rounded-lg border border-dashed border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950">
                <div
                    ref={previewRef}
                    style={{ width: previewWidth }}
                    dangerouslySetInnerHTML={{
                        __html: buildSignatureHtml(origin, person, signatureOptions),
                    }}
                />
            </div>

            <div
                className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-5 ${
                    hasDurableAssetHost
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                }`}
            >
                {hasDurableAssetHost ? (
                    <Globe2 size={15} className="mt-0.5 shrink-0" />
                ) : (
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                )}
                <p>
                    {hasDurableAssetHost ? (
                        <>
                            Images load from <b>{new URL(signatureImageUrl).hostname}</b>. Keep this public host
                            online so signatures remain visible after this page is closed.
                        </>
                    ) : (
                        <>
                            Images currently use a local or non-HTTPS address. Set{' '}
                            <b>NEXT_PUBLIC_SIGNATURE_ASSET_BASE_URL</b> to an always-online HTTPS host
                            before copying.
                        </>
                    )}
                </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
                <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#7a1f5c] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#651a4d]"
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy signature'}
                </button>
                <a
                    href={fileUrl(origin, person.file)}
                    download
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-800"
                >
                    <Download size={16} />
                    Download original image
                </a>
            </div>

            <div className="mt-6 grid gap-4 text-sm md:grid-cols-2">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                    <p className="mb-2 font-semibold text-gray-900 dark:text-white">📧 Gmail</p>
                    <ol className="list-inside list-decimal space-y-1 text-gray-600 dark:text-gray-400">
                        <li>Click <b>Copy signature</b> above.</li>
                        <li>Gmail → ⚙️ → <b>See all settings</b>.</li>
                        <li>Scroll to <b>Signature</b> → paste (Ctrl+V).</li>
                        <li><b>Save Changes</b> at the bottom.</li>
                    </ol>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                    <p className="mb-2 font-semibold text-gray-900 dark:text-white">📨 Outlook</p>
                    <ol className="list-inside list-decimal space-y-1 text-gray-600 dark:text-gray-400">
                        <li>Click <b>Copy signature</b> above.</li>
                        <li>Outlook → File → Options → Mail → <b>Signatures</b>.</li>
                        <li>Create/select a signature → paste (Ctrl+V).</li>
                        <li><b>OK</b> to save.</li>
                    </ol>
                </div>
            </div>
            <p className="mt-4 text-xs text-gray-400">
                The selected font and image sizes are included in the copied signature for Gmail and Outlook.
            </p>
        </div>
    );
}
