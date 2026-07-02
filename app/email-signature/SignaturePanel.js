'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Copy, Check, Download, Pencil, RotateCcw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
    SIGNATURE_DIR,
    ATLAS_GIF,
    RENDER_WIDTH,
    ATLAS_HEIGHT,
    SIGN_HEIGHT,
} from '@/lib/email-signatures';

// Build a public URL for a file inside /public/Email Signature.
// encodeURI keeps "/" and "()" but turns spaces into %20 so email clients load it.
export function fileUrl(origin, file) {
    return `${origin}/${encodeURI(`${SIGNATURE_DIR}/${file}`)}`;
}

// Editable text defaults.
const DEFAULT_CONTACT = 'Feel free to contact us in case of any query.';
const DEFAULT_CLOSING = 'Thanking you,\nBest regards,';

// Keep user-typed text valid inside HTML.
function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// The email-safe signature markup: a single-column table, inline styles only,
// explicit width/height ATTRIBUTES on every <img> so Outlook (Word engine) and
// Gmail render it at the exact same size. `opts` carries the editable text.
export function buildSignatureHtml(origin, person, opts = {}) {
    const atlas = fileUrl(origin, ATLAS_GIF);
    const sign = fileUrl(origin, person.file);
    const contact = escapeHtml(opts.contactMessage ?? DEFAULT_CONTACT).trim();
    const closing = escapeHtml(opts.closing ?? DEFAULT_CLOSING).replace(/\r?\n/g, '<br>').trim();
    return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Tahoma,Arial,sans-serif;">

  <!-- Contact Message -->
  <tr>
    <td style="padding:0 0 16px 0;">

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="border-top:2px dashed #6d2db7;height:8px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <tr>
          <td style="
              padding:10px 14px;
              border-left:1px solid #cfcfcf;
              font-family:Georgia,serif;
              font-size:18px;
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
        font-size:16px;
        line-height:28px;
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
          width="${RENDER_WIDTH}"
          height="${ATLAS_HEIGHT}"
          alt="Atlas by Excellent Publicity"
          style="display:block;border:0;outline:none;width:${RENDER_WIDTH}px;height:${ATLAS_HEIGHT}px;">
      </a>
    </td>
  </tr>

  <!-- Signature -->
  <tr>
    <td>
      <img
        src="${sign}"
        width="${RENDER_WIDTH}"
        height="${SIGN_HEIGHT}"
        alt="${person.name} - Excellent Publicity"
        style="display:block;border:0;outline:none;width:${RENDER_WIDTH}px;height:${SIGN_HEIGHT}px;">
    </td>
  </tr>

</table>`;
}

export default function SignaturePanel({ person }) {
    const [copied, setCopied] = useState(false);
    const [editing, setEditing] = useState(false);
    const [contactMessage, setContactMessage] = useState(DEFAULT_CONTACT);
    const [closing, setClosing] = useState(DEFAULT_CLOSING);
    const previewRef = useRef(null);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    async function handleCopy() {
        if (!previewRef.current) return;
        const html = buildSignatureHtml(origin, person, { contactMessage, closing });
        try {
            if (navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([
                    new window.ClipboardItem({
                        'text/html': new Blob([html], { type: 'text/html' }),
                        'text/plain': new Blob([`${person.name} — Excellent Publicity`], { type: 'text/plain' }),
                    }),
                ]);
            } else {
                const range = document.createRange();
                range.selectNodeContents(previewRef.current);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                document.execCommand('copy');
                sel.removeAllRanges();
            }
            setCopied(true);
            toast.success('Signature copied — now paste it into Gmail/Outlook settings');
            setTimeout(() => setCopied(false), 2500);
        } catch (e) {
            toast.error('Copy failed. Use the Download button instead.');
        }
    }

    return (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Signature for</p>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{person.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setEditing((v) => !v)}
                        className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${editing
                            ? 'border-[#7a1f5c] text-[#7a1f5c] bg-[#7a1f5c]/5'
                            : 'border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
                    >
                        <Pencil size={14} /> {editing ? 'Done' : 'Edit text'}
                    </button>
                    <Link
                        href="/email-signature"
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white px-2"
                    >
                        <ArrowLeft size={14} /> Search
                    </Link>
                </div>
            </div>

            {/* Edit panel — only the text is editable; the banner & card are fixed designs */}
            {editing && (
                <div className="mb-4 grid gap-3 rounded-lg border border-gray-200 dark:border-neutral-800 p-4 bg-gray-50 dark:bg-neutral-950">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Contact line</label>
                        <input
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            placeholder={DEFAULT_CONTACT}
                            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#7a1f5c]/40"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Closing (one line each)</label>
                        <textarea
                            value={closing}
                            onChange={(e) => setClosing(e.target.value)}
                            rows={2}
                            placeholder={DEFAULT_CLOSING}
                            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#7a1f5c]/40 resize-y"
                        />
                    </div>
                    <button
                        onClick={() => { setContactMessage(DEFAULT_CONTACT); setClosing(DEFAULT_CLOSING); }}
                        className="inline-flex items-center gap-1.5 self-start text-xs text-gray-500 hover:text-gray-800 dark:hover:text-white"
                    >
                        <RotateCcw size={13} /> Reset to default
                    </button>
                </div>
            )}

            {/* Live preview — rendered from the SAME HTML that gets copied */}
            <div className="overflow-x-auto rounded-lg border border-dashed border-gray-200 dark:border-neutral-700 p-4 bg-white dark:bg-neutral-950">
                <div
                    ref={previewRef}
                    style={{ width: RENDER_WIDTH }}
                    dangerouslySetInnerHTML={{ __html: buildSignatureHtml(origin, person, { contactMessage, closing }) }}
                />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-5">
                <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7a1f5c] hover:bg-[#651a4d] text-white text-sm font-medium transition-colors"
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy signature'}
                </button>
                <a
                    href={fileUrl(origin, person.file)}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                    <Download size={16} />
                    Download image
                </a>
            </div>

            {/* Install instructions */}
            <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg bg-gray-50 dark:bg-neutral-950 border border-gray-100 dark:border-neutral-800 p-4">
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">📧 Gmail</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
                        <li>Click <b>Copy signature</b> above.</li>
                        <li>Gmail → ⚙️ → <b>See all settings</b>.</li>
                        <li>Scroll to <b>Signature</b> → paste (Ctrl+V).</li>
                        <li><b>Save Changes</b> at the bottom.</li>
                    </ol>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-neutral-950 border border-gray-100 dark:border-neutral-800 p-4">
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">📨 Outlook</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
                        <li>Click <b>Copy signature</b> above.</li>
                        <li>Outlook → File → Options → Mail → <b>Signatures</b>.</li>
                        <li>Create/select a signature → paste (Ctrl+V).</li>
                        <li><b>OK</b> to save.</li>
                    </ol>
                </div>
            </div>
            <p className="mt-4 text-xs text-gray-400">
                Images are fixed at {RENDER_WIDTH}px wide, so the signature looks identical in Gmail and Outlook Classic.
            </p>
        </div>
    );
}
