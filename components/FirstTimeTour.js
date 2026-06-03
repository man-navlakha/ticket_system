'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, ChevronLeft, ChevronRight, Sparkles, Compass } from 'lucide-react';

const TOUR_DONE_KEY = 'ts-first-tour-done-v3';
const TOUR_STEP_KEY = 'ts-first-tour-step-v3';
const TOUR_ACTIVE_KEY = 'ts-first-tour-active-v3';
const TOUR_VARIANT_KEY = 'ts-first-tour-variant-v3';
export const TOUR_START_EVENT = 'ts-start-tour';

const MOBILE_BREAKPOINT_PX = 768; // matches Tailwind `md`

/**
 * Each step:
 *  - path: route the user must be on. If different, the tour navigates there.
 *  - target: CSS selector to highlight. null = floating modal (no highlight).
 *  - title, body: copy
 *  - placement: 'center' | 'auto' (default 'auto' = follow target)
 */

// Shared form-walkthrough steps (same on mobile + desktop — the form is responsive)
const CREATE_FORM_STEPS = [
    {
        path: '/dashboard/create',
        target: '[data-tour="classification"]',
        title: 'Classification — what kind of issue?',
        body:
            "Pick one: Laptop & Desktop (any device you own), Email & Drive (account / software access), or Other (network, printers, anything else). This decides who gets your ticket.",
    },
    {
        path: '/dashboard/create',
        target: '[data-tour="target-asset"]',
        title: 'Target Asset — which device?',
        body:
            "If you picked Laptop & Desktop, choose the device from your inventory and (optionally) a sub-component (screen, keyboard, battery, etc.). The agent will see the full asset history.",
    },
    {
        path: '/dashboard/create',
        target: '[data-tour="summary"]',
        title: 'Summary — one short line',
        body:
            "Write the headline in 5–10 words. Example: 'Laptop won't turn on' or 'Cannot log in to email'. Keep it short — details go in the next field.",
    },
    {
        path: '/dashboard/create',
        target: '[data-tour="priority"]',
        title: 'Operational Priority',
        body:
            "How urgent is it? LOW = can wait a day. MEDIUM = needs attention today (default). HIGH = blocking your work right now. Be honest — abuse of HIGH slows everyone down.",
    },
    {
        path: '/dashboard/create',
        target: '[data-tour="description"]',
        title: 'In-Depth Description — give context',
        body:
            "Tell us: (1) what happened, (2) when it started, (3) what you already tried, (4) any error message you see. The clearer this is, the faster we fix it.",
    },
    {
        path: '/dashboard/create',
        target: '[data-tour="attachments"]',
        title: 'Attachments & Screenshots — fastest help',
        bodyDesktop:
            "A screenshot is worth a thousand words. Press PrtScn on your keyboard, click the box, and Ctrl+V to paste. You can also attach PDFs.",
        bodyMobile:
            "Tap the box to attach a photo from your gallery — or take a fresh one with the camera. PDFs work too.",
    },
    {
        path: '/dashboard/create',
        target: '[data-tour="notify"]',
        title: 'Notify all agents via email',
        body:
            "Leave this ON if it's urgent — every agent gets a heads-up. Turn it OFF for low-priority routine requests so we don't spam the team.",
    },
    {
        path: '/dashboard/create',
        target: '[data-tour="cancel-send"]',
        title: 'Cancel or Send',
        body:
            "When ready, tap 'Send request'. You'll be redirected to the dashboard and the ticket ID appears in your list. Tap Cancel if you changed your mind.",
    },
];

// =============================================================================
// DESKTOP TOUR — relies on the Sidebar (hidden on mobile)
// =============================================================================
const STEPS_DESKTOP = [
    {
        path: '/dashboard',
        target: null,
        placement: 'center',
        title: 'Welcome — let me show you around 👋',
        body:
            "This guided tour walks you through the whole system in ~90 seconds. We'll visit every important screen and explain each field. You can skip any time.",
    },
    {
        path: '/dashboard',
        target: '[data-tour="create-ticket"]',
        title: 'Step 1 · Start a new ticket',
        body:
            "When something breaks, click 'New Ticket' here. We'll take you to the request form next — click Next or the highlighted button to continue.",
    },
    // Create form walkthrough
    ...CREATE_FORM_STEPS,
    // Tickets list
    {
        path: '/dashboard/tickets',
        target: '[data-tour="tickets-header"]',
        title: 'All Tickets — your inbox',
        body:
            "Every ticket you've raised lives here. Status updates in real time. Click any row to open the full conversation with the agent.",
    },
    {
        path: '/dashboard/tickets',
        target: '[data-tour="tickets-search"]',
        title: 'Search & filter tickets',
        body:
            "Search by title, description, or ticket ID. Combine it with status and priority filters to find anything fast.",
    },
    {
        path: '/dashboard/tickets',
        target: '[data-tour="tickets-table"]',
        title: 'Status at a glance',
        body:
            "Each row shows the ticket ID, summary, status (Open / In Progress / Resolved / Closed), and priority. Click a row to open it.",
    },
    // Inventory
    {
        path: '/dashboard/inventory',
        target: '[data-tour="inventory-hero"]',
        title: 'Inventory — your asset register',
        body:
            "Every laptop, monitor, peripheral, and other tracked asset lives here. You can see what's assigned to you, what's in maintenance, and warranty status.",
    },
    {
        path: '/dashboard/inventory',
        target: '[data-tour="inventory-register"]',
        title: 'Asset register — search & inspect',
        body:
            "Search by serial / brand / owner. Click any asset to see its full history, related tickets, and maintenance logs. Link an asset to a ticket from this screen.",
    },
    // Knowledge Base
    {
        path: '/dashboard/knowledge-base',
        target: '[data-tour="kb-page"]',
        title: 'Knowledge Base — fix it yourself',
        body:
            "Before raising a ticket, search here. Common fixes (WiFi reset, password reset, VPN setup, printer config) are documented step-by-step.",
    },
    {
        path: '/dashboard',
        target: null,
        placement: 'center',
        title: "You're all set 🎉",
        body:
            "That's the whole product. You can replay this tour anytime from the sidebar (Start guided tour, bottom-left). Need anything else? WhatsApp, email, or just raise a ticket.",
    },
];

// =============================================================================
// MOBILE TOUR — relies on the bottom bar (Home / Assets / FAB)
// =============================================================================
const STEPS_MOBILE = [
    {
        path: '/dashboard',
        target: null,
        placement: 'center',
        title: 'Welcome — quick tour 👋',
        body:
            "I'll walk you through the app in about a minute. Every important button gets highlighted — tap it (or tap Next) to keep moving. You can skip any time.",
    },
    {
        path: '/dashboard',
        target: '[data-tour="mobile-home"]',
        title: 'Home — your dashboard',
        body:
            "Tap the Home icon at any time to come back to this screen — your tickets, stats, and recent activity all live here.",
    },
    {
        path: '/dashboard',
        target: '[data-tour="mobile-create-fab"]',
        title: 'The + button — raise a ticket',
        body:
            "Tap the big + in the centre of the bottom bar to start a new ticket. We'll take you to the request form next.",
    },
    // Create form walkthrough — same field-by-field as desktop, but with mobile-friendly copy on attachments
    ...CREATE_FORM_STEPS,
    // Tickets — no bottom-nav target, just explain after arriving
    {
        path: '/dashboard/tickets',
        target: '[data-tour="tickets-header"]',
        title: 'All Tickets — your inbox',
        body:
            "Every ticket you've raised lives here. Status updates live. Tap any row to open the conversation with the agent.",
    },
    {
        path: '/dashboard/tickets',
        target: '[data-tour="tickets-search"]',
        title: 'Search & filter',
        body:
            "Search by title or ticket ID. Filters narrow it down by status (Open / Resolved) and priority.",
    },
    // Inventory — highlight the mobile Assets bottom-nav icon, then the page itself
    {
        path: '/dashboard',
        target: '[data-tour="mobile-inventory"]',
        title: 'Assets — your devices',
        body:
            "Tap the Assets icon to see every laptop, monitor, and peripheral assigned to you. Next, we'll open it.",
    },
    {
        path: '/dashboard/inventory',
        target: '[data-tour="inventory-hero"]',
        title: 'Inventory page',
        body:
            "Track assignments and warranty status. From here you can link an asset to a ticket so the agent has full context.",
    },
    {
        path: '/dashboard/inventory',
        target: '[data-tour="inventory-register"]',
        title: 'Asset register',
        body:
            "Scroll to find any tracked device. Tap a row to see its full history — past tickets, maintenance logs, and owner.",
    },
    // Knowledge Base
    {
        path: '/dashboard/knowledge-base',
        target: '[data-tour="kb-page"]',
        title: 'Knowledge Base — fix it yourself',
        body:
            "Before raising a ticket, check here. Common fixes (WiFi, password, VPN, printer) are documented step-by-step — usually faster than waiting.",
    },
    {
        path: '/dashboard',
        target: null,
        placement: 'center',
        title: "You're all set 🎉",
        body:
            "That's the whole app. Replay this tour anytime — open the side menu (top-left logo) → Start guided tour. Or just tap the + and raise a ticket.",
    },
];

function isMobileViewport() {
    if (typeof window === 'undefined') return false;
    try {
        return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`).matches;
    } catch {
        return window.innerWidth < MOBILE_BREAKPOINT_PX;
    }
}

function readStoredVariant() {
    try {
        return window.localStorage.getItem(TOUR_VARIANT_KEY) || null;
    } catch {
        return null;
    }
}

function writeStoredVariant(v) {
    try {
        window.localStorage.setItem(TOUR_VARIANT_KEY, v);
    } catch { }
}

function readStep(stepsLen) {
    try {
        const n = parseInt(window.localStorage.getItem(TOUR_STEP_KEY) || '0', 10);
        return Number.isFinite(n) ? Math.max(0, Math.min(n, stepsLen - 1)) : 0;
    } catch {
        return 0;
    }
}

function writeStep(n) {
    try { window.localStorage.setItem(TOUR_STEP_KEY, String(n)); } catch { }
}

function isDone() {
    try { return window.localStorage.getItem(TOUR_DONE_KEY) === '1'; } catch { return false; }
}

function isActive() {
    try { return window.localStorage.getItem(TOUR_ACTIVE_KEY) === '1'; } catch { return false; }
}

function setActive(v) {
    try { window.localStorage.setItem(TOUR_ACTIVE_KEY, v ? '1' : '0'); } catch { }
}

function getRect(selector) {
    if (!selector) return null;
    const el = document.querySelector(selector);
    if (!el) return null;
    // Scroll element into view first
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height, el };
}

export default function FirstTimeTour() {
    const router = useRouter();
    const pathname = usePathname();

    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [rect, setRect] = useState(null);
    const [resolvedForStep, setResolvedForStep] = useState(-1);
    // 'mobile' | 'desktop' — locked when the tour starts; if the viewport flips
    // mid-tour, we restart from step 0 with the new variant.
    const [variant, setVariant] = useState(null);
    const pollRef = useRef(null);

    // Pick the right step array for this variant.
    const steps = variant === 'mobile' ? STEPS_MOBILE : STEPS_DESKTOP;

    // First load: decide whether to auto-open the tour
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const detected = isMobileViewport() ? 'mobile' : 'desktop';
        const stored = readStoredVariant();

        const startNow = (v) => {
            const useVariant = v || stored || detected;
            const stepsForVariant = useVariant === 'mobile' ? STEPS_MOBILE : STEPS_DESKTOP;
            // If the stored variant doesn't match the current viewport, restart at 0
            const stepIdx = stored && stored !== detected ? 0 : readStep(stepsForVariant.length);
            setVariant(useVariant);
            writeStoredVariant(useVariant);
            setStep(stepIdx);
            writeStep(stepIdx);
            setActive(true);
            setOpen(true);
        };

        if (isActive()) {
            // resume across page navigations
            startNow();
            return;
        }
        if (!isDone()) {
            const t = setTimeout(() => startNow(), 700);
            return () => clearTimeout(t);
        }
    }, []);

    // Listen for manual restart (works whether tour is already open or closed)
    useEffect(() => {
        const handler = () => {
            try {
                window.localStorage.removeItem(TOUR_DONE_KEY);
                window.localStorage.setItem(TOUR_STEP_KEY, '0');
            } catch { }
            const v = isMobileViewport() ? 'mobile' : 'desktop';
            writeStoredVariant(v);
            setVariant(v);
            setStep(0);
            setActive(true);
            setOpen(true);
        };
        window.addEventListener(TOUR_START_EVENT, handler);
        return () => window.removeEventListener(TOUR_START_EVENT, handler);
    }, []);

    // Watch viewport — if it crosses the breakpoint while the tour is open,
    // restart from step 0 with the variant that matches the new layout.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
        const handler = (e) => {
            if (!open) return;
            const nextVariant = e.matches ? 'mobile' : 'desktop';
            if (nextVariant === variant) return;
            writeStoredVariant(nextVariant);
            setVariant(nextVariant);
            setStep(0);
            writeStep(0);
            setResolvedForStep(-1);
            setRect(null);
        };
        try {
            mql.addEventListener('change', handler);
            return () => mql.removeEventListener('change', handler);
        } catch {
            mql.addListener(handler);
            return () => mql.removeListener(handler);
        }
    }, [open, variant]);

    const current = steps[step];

    // When step or pathname changes: navigate if needed, then wait for target to appear
    useEffect(() => {
        if (!open) return;
        if (!current) return;

        // Navigate if we are on the wrong page (router.push does NOT setState in React tree)
        if (current.path && pathname !== current.path) {
            router.push(current.path);
            return;
        }

        // We're on the right page — wait for the target to appear in the DOM.
        // All state writes below happen inside async callbacks (timeouts), not
        // synchronously in the effect body — satisfies react-hooks/set-state-in-effect.
        let tries = 0;
        const maxTries = 60; // ~6 seconds at 100ms
        let rafTrackId = 0;
        let rafEndTime = 0;
        let resizeObserver = null;

        // Continuously re-measure for ~1.2s after resolution to keep up with
        // entrance animations, fade-ins, font-loading, and image reflows.
        const trackRect = (selector) => {
            if (!selector) return;
            const loop = () => {
                const r = getRect(selector);
                if (r) setRect(r);
                if (typeof performance !== 'undefined' && performance.now() < rafEndTime) {
                    rafTrackId = window.requestAnimationFrame(loop);
                }
            };
            rafEndTime = (typeof performance !== 'undefined' ? performance.now() : 0) + 1200;
            rafTrackId = window.requestAnimationFrame(loop);

            // Also keep rect in sync with any late layout shifts via ResizeObserver
            try {
                const el = document.querySelector(selector);
                if (el && typeof ResizeObserver !== 'undefined') {
                    resizeObserver = new ResizeObserver(() => {
                        const r2 = getRect(selector);
                        if (r2) setRect(r2);
                    });
                    resizeObserver.observe(el);
                    resizeObserver.observe(document.documentElement);
                }
            } catch { }
        };

        const tick = () => {
            const r = getRect(current.target);
            if (!current.target || r) {
                if (r?.el) {
                    try {
                        r.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } catch { }
                }
                // Re-read rect after scrolling animation, then keep tracking
                pollRef.current = window.setTimeout(() => {
                    setRect(getRect(current.target));
                    setResolvedForStep(step);
                    trackRect(current.target);
                }, 250);
                return;
            }
            tries += 1;
            if (tries >= maxTries) {
                // Give up — show centered card
                setRect(null);
                setResolvedForStep(step);
                return;
            }
            pollRef.current = window.setTimeout(tick, 100);
        };
        // Defer first tick to the next frame so we never call setState synchronously
        // during the effect body.
        pollRef.current = window.setTimeout(tick, 0);

        return () => {
            if (pollRef.current) window.clearTimeout(pollRef.current);
            if (rafTrackId) window.cancelAnimationFrame(rafTrackId);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [open, step, pathname, current, router]);

    // Derived flag — true whenever the current step hasn't been resolved yet.
    const waiting = open && resolvedForStep !== step;

    // Keep highlight rect updated on scroll/resize
    useEffect(() => {
        if (!open) return;
        const update = () => {
            if (current?.target) setRect(getRect(current.target));
        };
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [open, current]);

    const dismiss = useCallback(() => {
        try {
            window.localStorage.setItem(TOUR_DONE_KEY, '1');
            window.localStorage.removeItem(TOUR_STEP_KEY);
        } catch { }
        setActive(false);
        setOpen(false);
    }, []);

    const next = useCallback(() => {
        if (step >= steps.length - 1) {
            dismiss();
            return;
        }
        const n = step + 1;
        writeStep(n);
        setStep(n);
    }, [step, steps.length, dismiss]);

    const back = useCallback(() => {
        const n = Math.max(0, step - 1);
        writeStep(n);
        setStep(n);
    }, [step]);

    if (!open || !current) return null;

    const pct = Math.round(((step + 1) / steps.length) * 100);
    const useCenter = current.placement === 'center' || !rect;

    // Resolve copy: a step can have a single `body` OR variant-specific `bodyMobile`/`bodyDesktop`.
    const bodyText =
        (variant === 'mobile' ? current.bodyMobile : current.bodyDesktop) || current.body || '';

    // Card position: try to place near the target, otherwise center
    let cardStyle = {};
    if (useCenter) {
        cardStyle =
            variant === 'mobile'
                ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
                : { left: '50%', bottom: '6%', transform: 'translateX(-50%)' };
    } else if (variant === 'mobile') {
        // On mobile, always center horizontally and place above/below the target —
        // the target itself is usually small and near the bottom (FAB) or top.
        const spaceBelow = window.innerHeight - (rect.top + rect.height);
        const cardH = 260;
        if (spaceBelow > cardH + 16) {
            cardStyle = {
                top: rect.top + rect.height + 12,
                left: '50%',
                transform: 'translateX(-50%)',
            };
        } else {
            cardStyle = {
                bottom: window.innerHeight - rect.top + 12,
                left: '50%',
                transform: 'translateX(-50%)',
            };
        }
    } else {
        // Desktop: place below the highlight, or above if no room
        const spaceBelow = window.innerHeight - (rect.top + rect.height);
        const cardH = 240;
        if (spaceBelow > cardH + 24) {
            cardStyle = {
                top: rect.top + rect.height + 16,
                left: Math.max(16, Math.min(rect.left, window.innerWidth - 460)),
                maxWidth: 440,
            };
        } else {
            cardStyle = {
                bottom: window.innerHeight - rect.top + 16,
                left: Math.max(16, Math.min(rect.left, window.innerWidth - 460)),
                maxWidth: 440,
            };
        }
    }

    // Geometry for the 4 backdrop-blur panels around the highlight rect.
    // Padding makes the "hole" slightly larger than the target so the ring fits.
    const HOLE_PAD = 6;
    const holeTop = rect ? Math.max(0, rect.top - HOLE_PAD) : 0;
    const holeLeft = rect ? Math.max(0, rect.left - HOLE_PAD) : 0;
    const holeRight = rect ? rect.left + rect.width + HOLE_PAD : 0;
    const holeBottom = rect ? rect.top + rect.height + HOLE_PAD : 0;
    const panelClass =
        'absolute bg-black/55 backdrop-blur-sm pointer-events-auto cursor-default transition-all duration-300';

    return (
        <div className="fixed inset-0 z-[80] pointer-events-none">
            {/*
              Two modes:
              (a) No target rect → render a single full-screen blurred dim panel.
              (b) Target rect exists → render 4 blurred panels around the hole
                  (top / bottom / left / right) so the spotlighted target stays
                  crisp and bright while EVERYTHING else is dimmed AND blurred.

              None of the panels dismiss on click — only the X and Skip do.
            */}
            {!rect && (
                <div
                    className="absolute inset-0 bg-black/65 backdrop-blur-md pointer-events-auto transition-opacity cursor-default"
                    aria-hidden="true"
                />
            )}

            {rect && (
                <>
                    {/* Top panel */}
                    <div
                        className={panelClass}
                        style={{ top: 0, left: 0, right: 0, height: holeTop }}
                        aria-hidden="true"
                    />
                    {/* Bottom panel */}
                    <div
                        className={panelClass}
                        style={{ top: holeBottom, left: 0, right: 0, bottom: 0 }}
                        aria-hidden="true"
                    />
                    {/* Left panel */}
                    <div
                        className={panelClass}
                        style={{
                            top: holeTop,
                            left: 0,
                            width: holeLeft,
                            height: holeBottom - holeTop,
                        }}
                        aria-hidden="true"
                    />
                    {/* Right panel */}
                    <div
                        className={panelClass}
                        style={{
                            top: holeTop,
                            left: holeRight,
                            right: 0,
                            height: holeBottom - holeTop,
                        }}
                        aria-hidden="true"
                    />

                    {/* Highlight ring (purely decorative, no dim) */}
                    <div
                        className="absolute rounded-xl ring-4 ring-[#ec4269] dark:ring-[#D4AF37] ring-offset-2 ring-offset-transparent transition-all duration-300 pointer-events-none"
                        style={{
                            top: rect.top - HOLE_PAD,
                            left: rect.left - HOLE_PAD,
                            width: rect.width + HOLE_PAD * 2,
                            height: rect.height + HOLE_PAD * 2,
                            background: 'transparent',
                        }}
                    />

                    {/*
                      Click-to-advance overlay above the highlighted target.
                      Transparent button — clicking the visible target advances
                      the tour instead of bouncing off the dim panels.
                    */}
                    <button
                        type="button"
                        onClick={next}
                        aria-label="Advance tour"
                        title="Click to continue"
                        className="absolute rounded-xl pointer-events-auto bg-transparent border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ec4269] dark:focus:ring-[#D4AF37]"
                        style={{
                            top: rect.top - HOLE_PAD,
                            left: rect.left - HOLE_PAD,
                            width: rect.width + HOLE_PAD * 2,
                            height: rect.height + HOLE_PAD * 2,
                        }}
                    />
                </>
            )}

            {/* Card */}
            <div
                className="absolute pointer-events-auto bg-card border border-border rounded-2xl shadow-2xl w-[92vw] sm:w-[440px] p-6 animate-in fade-in slide-in-from-bottom-4"
                style={cardStyle}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        Step {step + 1} of {steps.length}
                        <span className="ml-1 opacity-60 normal-case tracking-normal text-[9px]">
                            · {variant === 'mobile' ? 'mobile' : 'desktop'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={dismiss}
                        aria-label="Skip tour"
                        className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                    {current.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{bodyText}</p>

                {waiting && (
                    <div className="mt-3 text-[11px] text-muted-foreground inline-flex items-center gap-2">
                        <Compass className="w-3 h-3 animate-spin" />
                        Loading the next screen…
                    </div>
                )}

                {!waiting && rect && (
                    <div className="mt-3 text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ec4269] dark:bg-[#D4AF37] animate-pulse" />
                        Tip: click the highlighted area to continue.
                    </div>
                )}

                <div className="mt-4 h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full bg-[#ec4269] dark:bg-[#D4AF37] transition-all duration-300"
                        style={{ width: `${pct}%` }}
                    />
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={dismiss}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Skip tour
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={back}
                            disabled={step === 0 || waiting}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium border border-border bg-background hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-3 h-3" /> Back
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            disabled={waiting}
                            className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-xs font-semibold bg-[#ec4269] dark:bg-[#D4AF37] text-white dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {step === steps.length - 1 ? 'Finish' : 'Next'}
                            {step !== steps.length - 1 && <ChevronRight className="w-3 h-3" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Imperatively start (or restart) the tour from anywhere. Use in a "Start tour" button.
 */
export function startTour() {
    try {
        window.dispatchEvent(new CustomEvent(TOUR_START_EVENT));
    } catch { }
}
