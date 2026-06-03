'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sparkles, Search, KeyRound, Laptop2, Wifi, Printer, Download, Mail, Lock, ChevronRight } from 'lucide-react';

const TEMPLATES = [
    {
        id: 'laptop-slow',
        icon: Laptop2,
        title: 'My laptop is slow or frozen',
        plain: "It's slow, frozen, or won't start",
        type: 'inventory',
        priority: 'MEDIUM',
        ticketTitle: 'Laptop performance issue',
        ticketDescription:
            "What's happening:\n• \n\nWhen it started:\n• \n\nWhat I've already tried:\n• Restarted the laptop\n• ",
    },
    {
        id: 'wifi-down',
        icon: Wifi,
        title: 'WiFi or internet not working',
        plain: 'No internet or WiFi keeps disconnecting',
        type: 'personal',
        priority: 'HIGH',
        ticketTitle: 'WiFi / network connectivity issue',
        ticketDescription:
            'Location / desk number:\n• \n\nWhat I see:\n• WiFi shows connected but no internet / WiFi will not connect / Keeps dropping\n\nDevices affected:\n• Only my laptop / Multiple devices',
    },
    {
        id: 'install-software',
        icon: Download,
        title: 'I need software installed',
        plain: 'Install an app or program for me',
        type: 'personal',
        priority: 'LOW',
        ticketTitle: 'Software installation request',
        ticketDescription:
            'Software name:\n• \n\nWhy I need it:\n• \n\nLicense / approval (if any):\n• ',
    },
    {
        id: 'email-access',
        icon: Mail,
        title: 'Email or Drive access issue',
        plain: "Can't log in to email / Drive / Docs",
        type: 'email',
        priority: 'HIGH',
        ticketTitle: 'Email / Drive access problem',
        ticketDescription:
            'Service affected:\n• Email / Drive / Calendar / Other\n\nError message I see:\n• \n\nWhen it started:\n• ',
    },
    {
        id: 'printer',
        icon: Printer,
        title: 'Printer or scanner not working',
        plain: 'Printer is offline or printing wrong',
        type: 'personal',
        priority: 'MEDIUM',
        ticketTitle: 'Printer / scanner issue',
        ticketDescription:
            'Printer name / location:\n• \n\nWhat happens when I print:\n• Shows offline / Prints blank / Paper jam / Other\n\nError code (if any):\n• ',
    },
    {
        id: 'password-reset',
        icon: Lock,
        title: 'Password reset / locked out',
        plain: "I can't log in to my account",
        type: 'personal',
        priority: 'HIGH',
        ticketTitle: 'Account locked / password reset',
        ticketDescription:
            'Account locked out of:\n• Windows / Email / VPN / Other\n\nLast time it worked:\n• \n\nError message:\n• ',
    },
];

function buildCreateHref(t) {
    const params = new URLSearchParams({
        type: t.type,
        priority: t.priority,
        title: t.ticketTitle,
        description: t.ticketDescription,
        template: t.id,
    });
    return `/dashboard/create?${params.toString()}`;
}

export default function StarterCard({ simple = false }) {
    const [openTemplates, setOpenTemplates] = useState(false);

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-border bg-background">
            <div className="max-w-5xl mx-auto">
                {/* New here? Start here */}
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-10">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                                <Sparkles className="w-3 h-3 text-emerald-500" />
                                {simple ? 'First time here?' : 'New here? Start here'}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                {simple ? 'What do you want to do?' : 'Pick what you need'}
                            </h2>
                            <p className="text-sm text-muted-foreground max-w-lg">
                                {simple
                                    ? "No tech words. Just pick one of the three options below — we'll guide you."
                                    : 'Three quick paths for first-time users. No jargon, no setup required.'}
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link
                            href="/dashboard/create"
                            className="group flex flex-col gap-3 p-5 rounded-2xl border border-border bg-background hover:border-foreground/30 hover:shadow-lg transition-all"
                        >
                            <div className="w-10 h-10 rounded-lg bg-[#ec4269]/10 dark:bg-[#D4AF37]/10 flex items-center justify-center text-[#ec4269] dark:text-[#D4AF37]">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground text-sm mb-1">
                                    {simple ? 'Report a new problem' : 'Raise my first ticket'}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {simple
                                        ? 'Tell us what is wrong and we will help fix it.'
                                        : 'Guided form, 60 seconds. We auto-route to the right agent.'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium text-[#ec4269] dark:text-[#D4AF37] group-hover:gap-2 transition-all">
                                Start <ChevronRight className="w-3 h-3" />
                            </div>
                        </Link>

                        <button
                            type="button"
                            onClick={() =>
                                document
                                    .getElementById('track-ticket-input')
                                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }
                            className="group flex flex-col gap-3 p-5 rounded-2xl border border-border bg-background hover:border-foreground/30 hover:shadow-lg transition-all text-left"
                        >
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Search className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground text-sm mb-1">
                                    {simple ? 'Check an old request' : 'Track an existing ticket'}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {simple
                                        ? 'Got a ticket number? Paste it to see the status.'
                                        : 'Paste your ticket ID. No login required.'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium text-blue-500 group-hover:gap-2 transition-all">
                                Track <ChevronRight className="w-3 h-3" />
                            </div>
                        </button>

                        <a
                            href="mailto:support@excellentpublicity.com?subject=I%20forgot%20my%20ticket%20ID&body=Hi%20team%2C%20I%20raised%20a%20ticket%20but%20lost%20the%20ID.%20My%20name%3A%20%0AMy%20email%3A%20%0AWhat%20the%20ticket%20was%20about%3A%20"
                            className="group flex flex-col gap-3 p-5 rounded-2xl border border-border bg-background hover:border-foreground/30 hover:shadow-lg transition-all"
                        >
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <KeyRound className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground text-sm mb-1">
                                    {simple ? "I lost my ticket number" : 'I forgot my ticket ID'}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {simple
                                        ? "Email us — we'll find it for you."
                                        : "Email us your name — we'll look it up in seconds."}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium text-amber-500 group-hover:gap-2 transition-all">
                                Email us <ChevronRight className="w-3 h-3" />
                            </div>
                        </a>
                    </div>
                </div>

                {/* Sample issue templates */}
                <div className="mt-10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">
                                {simple ? 'Pick what is wrong' : 'Common issues — one click to start'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {simple
                                    ? "Tap one that matches your problem. We'll fill out most of the form for you."
                                    : 'Templates pre-fill the form so you finish faster.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpenTemplates(v => !v)}
                            className="sm:hidden text-xs font-medium text-[#ec4269] dark:text-[#D4AF37]"
                        >
                            {openTemplates ? 'Hide' : 'Show all'}
                        </button>
                    </div>

                    <div
                        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${openTemplates ? '' : 'max-sm:hidden'
                            }`}
                    >
                        {TEMPLATES.map(t => {
                            const Icon = t.icon;
                            return (
                                <Link
                                    key={t.id}
                                    href={buildCreateHref(t)}
                                    className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-[#ec4269]/40 dark:hover:border-[#D4AF37]/40 hover:bg-muted/40 transition-all"
                                >
                                    <div className="shrink-0 w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground/70 group-hover:text-[#ec4269] dark:group-hover:text-[#D4AF37] transition-colors">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-foreground truncate">
                                            {simple ? t.plain : t.title}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground mt-0.5">
                                            Tap to start · priority auto-set to {t.priority.toLowerCase()}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
