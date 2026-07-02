'use client';

import { useState } from 'react';
import { Mail, Copy, Check, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Copy that also works on http / mobile where navigator.clipboard is blocked.
async function copyText(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        /* fall through to legacy path */
    }
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    } catch {
        return false;
    }
}

/**
 * Email-signature shortcut for the device QR landing page.
 * Someone scans on mobile but sets up Gmail/Outlook on their laptop, so we let
 * them move the link across: copy it, or email it to the assigned person.
 *
 * Props:
 *   pid          – device id; lets the server email the assigned person directly
 *   emailMasked  – masked email for the confirmation message (e.g. m•••@…)
 *   hasEmail     – whether the device has an assigned email on file
 *   signatureSlug– assigned person's slug, so links go straight to their page
 */
export default function EmailSignatureCta({ pid, emailMasked, hasEmail, signatureSlug }) {
    const [copied, setCopied] = useState(false);
    const [sending, setSending] = useState(false);
    const [sentTo, setSentTo] = useState('');
    // Manual-entry mode only appears when there's no email on file.
    const [askEmail, setAskEmail] = useState(false);
    const [email, setEmail] = useState('');

    // Deep-link straight to the person's signature page when we know it.
    const path = `/email-signature${signatureSlug ? `/${signatureSlug}` : ''}`;
    const link = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;

    async function copyLink() {
        const ok = await copyText(link);
        if (ok) {
            setCopied(true);
            toast.success('Link copied');
            setTimeout(() => setCopied(false), 2000);
        } else {
            toast.error('Could not copy — long-press the link to copy it manually.');
        }
    }

    async function send(body) {
        setSending(true);
        try {
            const r = await fetch('/api/email-signature/send-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) {
                // Device has no email on file → reveal the manual input.
                if (j.needsEmail) { setAskEmail(true); toast.error(j.error); return; }
                throw new Error(j.error || 'Could not send the link.');
            }
            setSentTo(j.maskedEmail || 'your inbox');
            toast.success('Link sent — check your inbox on your laptop.');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSending(false);
        }
    }

    // Primary click: use the email we already have (via pid). No typing needed.
    function emailMe() {
        if (askEmail) return; // manual form handles submit
        send({ pid, slug: signatureSlug });
    }

    return (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" strokeWidth={1.8} />
                <div>
                    <div className="text-sm font-semibold text-foreground">Get your email signature</div>
                    <div className="text-[11px] text-muted-foreground">Open on your laptop to set up Gmail / Outlook</div>
                </div>
            </div>

            {sentTo ? (
                <p className="text-[13px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Sent to {sentTo}. Open it on your laptop.
                </p>
            ) : (
                <>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={copyLink}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 h-10 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy link'}
                        </button>

                        {!askEmail && (
                            <button
                                type="button"
                                onClick={emailMe}
                                disabled={sending}
                                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 h-10 text-sm font-semibold disabled:opacity-50 transition-opacity"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {hasEmail && emailMasked ? `Email me (${emailMasked})` : 'Email me the link'}
                            </button>
                        )}
                    </div>

                    {askEmail && (
                        <form
                            onSubmit={(e) => { e.preventDefault(); if (email.trim()) send({ email: email.trim(), slug: signatureSlug }); }}
                            className="flex flex-col sm:flex-row gap-2"
                        >
                            <input
                                type="email"
                                inputMode="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@excellentpublicity.com"
                                required
                                className="flex-1 rounded-full border border-border bg-background px-4 h-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <button
                                type="submit"
                                disabled={sending || !email.trim()}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-4 h-10 text-sm font-semibold disabled:opacity-50 transition-opacity"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send
                            </button>
                        </form>
                    )}
                </>
            )}
        </div>
    );
}
