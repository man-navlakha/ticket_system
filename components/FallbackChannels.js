'use client';

import { useState } from 'react';
import { MessageCircle, Mail, Phone, PlayCircle, QrCode, X } from 'lucide-react';

const WHATSAPP_NUMBER = '919999999999'; // TODO: replace with the real support number
const SUPPORT_EMAIL = 'support@excellentpublicity.com';
const PHONE_DISPLAY = '+91 99999 99999';
const VIDEO_URL = ''; // TODO: drop in a Loom / YouTube embed URL when ready

const waMessage = encodeURIComponent(
    "Hi, I need IT support.\n\nName: \nDepartment: \nIssue: "
);

export default function FallbackChannels({ simple = false }) {
    const [showVideo, setShowVideo] = useState(false);
    const [showQR, setShowQR] = useState(false);

    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background border-b border-border">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
                        No login needed
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                        {simple ? "Don't want to log in?" : 'Prefer a quicker way?'}
                    </h2>
                    <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm">
                        {simple
                            ? "Send us a WhatsApp message, an email, or just call. We'll raise the ticket for you."
                            : 'Reach us on WhatsApp, email, or phone — and watch the 30-second walkthrough below.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* WhatsApp */}
                    <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card hover:border-emerald-500/40 hover:shadow-lg transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowQR(true);
                                }}
                                className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                            >
                                <QrCode className="w-3 h-3" /> QR
                            </button>
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground mb-1">WhatsApp us</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {simple
                                    ? 'Open WhatsApp and send a message. We answer in minutes.'
                                    : 'Best for field & factory staff. Replies under 15 min during work hours.'}
                            </p>
                        </div>
                        <span className="text-xs font-mono text-emerald-600 dark:text-emerald-500">
                            {PHONE_DISPLAY}
                        </span>
                    </a>

                    {/* Email */}
                    <a
                        href={`mailto:${SUPPORT_EMAIL}?subject=IT%20support%20request&body=Hi%20team%2C%0A%0AName%3A%20%0ADepartment%3A%20%0AIssue%3A%20%0A%0AAttach%20screenshots%20if%20possible.`}
                        className="group flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card hover:border-blue-500/40 hover:shadow-lg transition-all"
                    >
                        <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground mb-1">Email support</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {simple
                                    ? 'Write us a quick email — even a one-liner is fine.'
                                    : 'A ticket is auto-created from your email and the ID is sent back.'}
                            </p>
                        </div>
                        <span className="text-xs font-mono text-blue-600 dark:text-blue-500 truncate">
                            {SUPPORT_EMAIL}
                        </span>
                    </a>

                    {/* Phone */}
                    <a
                        href={`tel:${PHONE_DISPLAY.replace(/\s+/g, '')}`}
                        className="group flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card hover:border-amber-500/40 hover:shadow-lg transition-all"
                    >
                        <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground mb-1">Call us</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {simple
                                    ? "If it's urgent, call us. We'll raise the ticket while you talk."
                                    : 'Best for urgent outages. Mon–Sat, 9 AM – 7 PM IST.'}
                            </p>
                        </div>
                        <span className="text-xs font-mono text-amber-600 dark:text-amber-500">
                            {PHONE_DISPLAY}
                        </span>
                    </a>
                </div>

                {/* Video walkthrough */}
                <div className="mt-12">
                    <button
                        type="button"
                        onClick={() => setShowVideo(true)}
                        className="group w-full relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-muted/30 p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center gap-6 text-left hover:border-foreground/30 transition-all"
                    >
                        <div className="shrink-0 w-16 h-16 rounded-full bg-[#ec4269] dark:bg-[#D4AF37] flex items-center justify-center text-white dark:text-zinc-900 shadow-2xl group-hover:scale-110 transition-transform">
                            <PlayCircle className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                                30-second walkthrough
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                                {simple ? 'Watch how to raise a ticket' : 'See it work in 30 seconds'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Quick overview: create, attach, track. No reading required.
                            </p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Video modal */}
            {showVideo && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setShowVideo(false)}
                >
                    <div
                        className="relative w-full max-w-3xl bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setShowVideo(false)}
                            aria-label="Close video"
                            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="aspect-video bg-black flex items-center justify-center">
                            {VIDEO_URL ? (
                                <iframe
                                    src={VIDEO_URL}
                                    title="How to raise a ticket"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                />
                            ) : (
                                <div className="text-center text-muted-foreground text-sm p-8">
                                    <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    Walkthrough video is coming soon.
                                    <br />
                                    Drop your Loom / YouTube URL into{' '}
                                    <code className="font-mono text-xs">FallbackChannels.js</code>.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* QR modal */}
            {showQR && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setShowQR(false)}
                >
                    <div
                        className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-6 text-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setShowQR(false)}
                            aria-label="Close QR"
                            className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <h4 className="text-base font-semibold text-foreground mb-1">
                            Scan to chat on WhatsApp
                        </h4>
                        <p className="text-xs text-muted-foreground mb-4">
                            Open your phone camera and point at the code.
                        </p>
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                                `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`
                            )}`}
                            alt="WhatsApp QR code"
                            width={240}
                            height={240}
                            className="mx-auto rounded-lg border border-border"
                        />
                        <div className="mt-3 text-xs font-mono text-muted-foreground">
                            {PHONE_DISPLAY}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
