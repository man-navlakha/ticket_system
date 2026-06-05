'use client';

import { useState, useRef } from 'react';
import {
    Camera, Send, Loader2, ChevronDown, ChevronUp, ShieldCheck,
    Mail, Phone, User, Laptop2, MapPin, Building2, CheckCircle2, AlertCircle,
    RotateCcw, QrCode, Sparkles, KeyRound, CheckCircle,
} from 'lucide-react';

/**
 * /report/[pid] — public scan landing page
 *
 * Typography: Inter via system fallback, large display heading, generous
 * vertical rhythm. Accent: brand pink (#ec4269 / #D4AF37 in dark mode).
 *
 * Layout: single-column, mobile-first. Two distinct sections:
 *   1. The form (textarea + photo button + send)
 *   2. The expandable details card (masked, with OTP reveal)
 */
const COMMON_PROBLEMS = [
    'Outlook not working',
    'Laptop not working',
    'Email not receiving',
    'CRM not working',
    'Laptop not charging',
    'Internet / Wi-Fi not working',
    'Printer not working',
    'Screen flickering',
    'System running slow',
    'Software not opening',
];

export default function ReportClient({ initial }) {
    const [problem, setProblem] = useState('');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successId, setSuccessId] = useState(null);
    const fileRef = useRef(null);

    // Accordion + reveal state
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [revealStep, setRevealStep] = useState('idle'); // idle | sending | code | verifying | revealed
    const [maskedTarget, setMaskedTarget] = useState(initial.person.emailMasked || '');
    const [code, setCode] = useState('');
    const [revealedPerson, setRevealedPerson] = useState(null);
    const [revealError, setRevealError] = useState('');

    // Activation state — for PENDING assignees who want their setup link emailed.
    const [activateStep, setActivateStep] = useState('idle'); // idle | sending | sent
    const [activateError, setActivateError] = useState('');
    const [activateTarget, setActivateTarget] = useState('');

    const { device, person } = initial;
    const deviceTitle = [device.brand, device.model].filter(Boolean).join(' ');

    async function onFileChange(e) {
        const picked = Array.from(e.target.files || []);
        if (picked.length === 0) return;
        const limited = picked.slice(0, 3);
        const oversize = limited.find((f) => f.size > 5 * 1024 * 1024);
        if (oversize) {
            setError('One of the photos is over 5 MB — please pick a smaller one.');
            return;
        }
        setFiles(limited);
        setError('');
    }

    async function uploadFiles() {
        if (files.length === 0) return [];
        const urls = [];
        for (const file of files) {
            const fd = new FormData();
            fd.append('file', file);
            const r = await fetch('/api/upload', { method: 'POST', body: fd });
            if (!r.ok) throw new Error('Upload failed');
            const j = await r.json();
            urls.push(j.url);
        }
        return urls;
    }

    async function onSubmit(e) {
        e.preventDefault();
        const finalDescription = problem === 'Other'
            ? description.trim()
            : (problem ? (description.trim() ? `${problem} — ${description.trim()}` : problem) : description.trim());
        if (!finalDescription) {
            setError('Please pick a problem or describe what is wrong.');
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            setUploading(files.length > 0);
            const attachmentUrls = await uploadFiles();
            setUploading(false);

            const res = await fetch('/api/quick-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid: device.pid, description: finalDescription, attachmentUrls }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || 'Could not submit.');
            setSuccessId(j.ticketId);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
    }

    async function requestReveal() {
        setRevealError('');
        setRevealStep('sending');
        try {
            const r = await fetch('/api/quick-report/request-reveal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid: device.pid }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || 'Could not send the code.');
            setMaskedTarget(j.maskedEmail || maskedTarget);
            setRevealStep('code');
        } catch (err) {
            setRevealStep('idle');
            setRevealError(err.message);
        }
    }

    async function requestActivation() {
        setActivateError('');
        setActivateStep('sending');
        try {
            const r = await fetch('/api/quick-report/send-activation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid: device.pid }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || 'Could not send the activation link.');
            setActivateTarget(j.maskedEmail || person.emailMasked || '');
            setActivateStep('sent');
        } catch (err) {
            setActivateStep('idle');
            setActivateError(err.message);
        }
    }

    async function verifyReveal() {
        if (!/^\d{6}$/.test(code)) {
            setRevealError('Enter the 6-digit code from the email.');
            return;
        }
        setRevealError('');
        setRevealStep('verifying');
        try {
            const r = await fetch('/api/quick-report/verify-reveal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid: device.pid, code }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || 'Wrong code.');
            setRevealedPerson(j.person);
            setRevealStep('revealed');
        } catch (err) {
            setRevealStep('code');
            setRevealError(err.message);
        }
    }

    // === SUCCESS SCREEN ===
    if (successId) {
        return (
            <div className="report-shell">
                <main className="mx-auto w-full max-w-md px-5 py-12 sm:py-20">
                    <div className="text-center space-y-7 animate-in fade-in slide-in-from-bottom-3 duration-500">
                        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 ring-1 ring-emerald-500/30 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={1.6} />
                        </div>
                        <div className="space-y-3">
                            <h1 className="display-heading text-4xl sm:text-5xl">We got it.</h1>
                            <p className="text-base text-muted-foreground leading-relaxed">
                                Your report just landed with the IT team. You&apos;ll hear back by email or WhatsApp shortly.
                            </p>
                        </div>
                        <div className="rounded-3xl border border-border bg-card p-6 text-left space-y-2">
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Ticket ID</div>
                            <div className="font-mono text-sm break-all leading-relaxed">{successId}</div>
                            <div className="text-[11px] text-muted-foreground pt-2 border-t border-border mt-3">
                                Save this ID — paste it on the homepage to check status any time.
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setSuccessId(null); setProblem(''); setDescription(''); setFiles([]); }}
                            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Report another issue
                        </button>
                    </div>
                </main>
                <ReportShellStyle />
            </div>
        );
    }

    return (
        <div className="report-shell">
            <main className="mx-auto w-full max-w-md px-5 py-8 sm:py-12 space-y-8 pb-24">

                {/* Hero */}
                <header className="space-y-4">
                    <div className="flex items-center justify-between">
                        
                    </div>

                    <h1 className="display-heading text-[2.25rem] sm:text-5xl leading-[1.05]">
                        What&apos;s wrong with this device?
                    </h1>

                    <div className="device-card">
                        <div className="device-card-pid">{device.pid}</div>
                        <div className="device-card-meta">
                            {deviceTitle || device.type || 'Device'}
                        </div>
                    </div>
                </header>

                {/* The form */}
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <div className="form-label">
                            <span className="form-label-step">01</span>
                            <span className="form-label-text">Tell us what happened</span>
                        </div>
                        <select
                            value={problem}
                            onChange={(e) => {
                                setProblem(e.target.value);
                                if (e.target.value !== 'Other') setDescription('');
                            }}
                            className="form-select"
                            aria-label="Pick a common problem"
                        >
                            <option value="">Pick a problem…</option>
                            {COMMON_PROBLEMS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                            <option value="Other">Other (type your own)</option>
                        </select>
                        {problem === 'Other' && (
                            <>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={5}
                                    required
                                    placeholder="e.g. The screen flickers every few seconds and goes black when I plug in the charger."
                                    className="form-textarea"
                                    maxLength={4000}
                                    autoFocus
                                />
                                <div className="text-[10px] text-muted-foreground text-right">
                                    {description.length}/4000
                                </div>
                            </>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div className="form-label">
                            <span className="form-label-step">02</span>
                            <span className="form-label-text">Add a photo <span className="text-muted-foreground font-normal normal-case tracking-normal">— optional</span></span>
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            onChange={onFileChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="photo-btn"
                        >
                            <Camera className="w-5 h-5" />
                            <span className="text-sm font-medium">
                                {files.length === 0
                                    ? 'Take a photo or pick from gallery'
                                    : `${files.length} photo${files.length > 1 ? 's' : ''} attached`}
                            </span>
                        </button>
                        {files.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {files.map((f, i) => {
                                    const u = URL.createObjectURL(f);
                                    return (
                                        <img
                                            key={i}
                                            src={u}
                                            alt={`Attached ${i + 1}`}
                                            className="w-20 h-20 object-cover rounded-xl border border-border"
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive p-4 text-sm">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span className="leading-relaxed">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || (!problem || (problem === 'Other' && !description.trim()))}
                        className="submit-btn"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {uploading ? 'Uploading photo…' : 'Sending…'}
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Send report
                            </>
                        )}
                    </button>
                </form>

                {/* Details accordion */}
                <section className="details-card">
                    <button
                        type="button"
                        onClick={() => setDetailsOpen((v) => !v)}
                        aria-expanded={detailsOpen}
                        className="details-card-trigger"
                    >
                        <span className="inline-flex items-center gap-2.5">
                            <Laptop2 className="w-4 h-4 text-muted-foreground" />
                            <span>Show my details</span>
                            {!detailsOpen && (
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-1">
                                    Masked
                                </span>
                            )}
                        </span>
                        {detailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {detailsOpen && (
                        <div className="details-card-body">
                            {/* Device info */}
                            <div>
                                <div className="section-eyebrow">Device</div>
                                <ul className="info-list">
                                    <Row label="Asset ID" value={device.pid} mono />
                                    <Row label="Type" value={device.type} />
                                    <Row label="Brand / Model" value={deviceTitle || '—'} />
                                    {device.serialNumber && <Row label="Serial" value={device.serialNumber} mono />}
                                    {device.os && <Row label="OS" value={device.os} />}
                                </ul>
                            </div>

                            {/* Person info */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="section-eyebrow !mb-0">Assigned person</div>
                                    {revealStep === 'revealed' && (
                                        <span className="verified-pill">
                                            <ShieldCheck className="w-3 h-3" /> Verified
                                        </span>
                                    )}
                                </div>

                                {!person.hasAny ? (
                                    <p className="text-xs text-muted-foreground">
                                        This device is not assigned to anyone yet.
                                    </p>
                                ) : (
                                    <ul className="info-list">
                                        {/* Show every row that has SOMETHING — even if only
                                            the name is known and email/phone are missing. */}
                                        {person.hasName && (
                                            <Row
                                                icon={<User className="w-3.5 h-3.5" />}
                                                label="Name"
                                                value={revealedPerson?.name || person.nameMasked}
                                            />
                                        )}
                                        {person.hasEmail && (
                                            <Row
                                                icon={<Mail className="w-3.5 h-3.5" />}
                                                label="Email"
                                                value={revealedPerson?.email || person.emailMasked}
                                                mono
                                            />
                                        )}
                                        {person.hasPhone && (
                                            <Row
                                                icon={<Phone className="w-3.5 h-3.5" />}
                                                label="Phone"
                                                value={revealedPerson?.phone || person.phoneMasked}
                                                mono
                                            />
                                        )}
                                        {(revealedPerson?.department || device.department) && (
                                            <Row
                                                icon={<Building2 className="w-3.5 h-3.5" />}
                                                label="Department"
                                                value={revealedPerson?.department || device.department}
                                            />
                                        )}
                                        {(revealedPerson?.location || device.location) && (
                                            <Row
                                                icon={<MapPin className="w-3.5 h-3.5" />}
                                                label="Location"
                                                value={revealedPerson?.location || device.location}
                                            />
                                        )}
                                    </ul>
                                )}

                                {/* "No email on file" hint when we know who but can't OTP-reveal */}
                                {person.hasAny && !person.canReveal && (
                                    <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
                                        No email is on file for this person — full contact details
                                        can&apos;t be revealed automatically. The IT team will reach
                                        out directly.
                                    </p>
                                )}

                                {/*
                                  Activation CTA — visible when the assigned user is PENDING
                                  (account created but not yet activated). The button emails the
                                  setup link to the user's own address. Useful when a fresh hire
                                  scans their own laptop QR and realises they never finished setup.
                                */}
                                {person.canActivate && (
                                    <div className="mt-4 pt-4 border-t border-border">
                                        {activateStep === 'sent' ? (
                                            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-foreground">
                                                        Activation link sent
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                        Check{' '}
                                                        <span className="font-mono text-foreground">
                                                            {activateTarget}
                                                        </span>{' '}
                                                        — the setup link expires in 24 hours.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-start gap-2.5 mb-3">
                                                    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                                                        Pending
                                                    </span>
                                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                        This account hasn&apos;t been activated yet. If you&apos;re the
                                                        assigned person, we can email you a fresh setup link.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={requestActivation}
                                                    disabled={activateStep === 'sending'}
                                                    className="reveal-btn"
                                                >
                                                    {activateStep === 'sending' ? (
                                                        <>
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            Sending link…
                                                        </>
                                                    ) : (
                                                        <>
                                                            <KeyRound className="w-4 h-4" />
                                                            Activate this account
                                                        </>
                                                    )}
                                                </button>
                                                {activateError && (
                                                    <p className="mt-2 text-[11px] text-destructive flex items-center gap-1.5">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {activateError}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {person.canReveal && revealStep !== 'revealed' && (
                                    <div className="mt-5 pt-5 border-t border-border">
                                        {revealStep === 'idle' && (
                                            <>
                                                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                                    To see the full email and phone, verify with a 6-digit code we&apos;ll email to the assigned person.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={requestReveal}
                                                    className="reveal-btn"
                                                >
                                                    <ShieldCheck className="w-4 h-4" />
                                                    Verify to reveal
                                                </button>
                                            </>
                                        )}

                                        {revealStep === 'sending' && (
                                            <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Sending code to {person.emailMasked}…
                                            </div>
                                        )}

                                        {(revealStep === 'code' || revealStep === 'verifying') && (
                                            <div className="space-y-4">
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Code sent to <span className="font-mono text-foreground">{maskedTarget}</span>. Expires in 10 minutes.
                                                </p>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="\d{6}"
                                                    maxLength={6}
                                                    value={code}
                                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="••••••"
                                                    className="otp-input"
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={verifyReveal}
                                                    disabled={revealStep === 'verifying' || code.length !== 6}
                                                    className="reveal-btn reveal-btn-primary"
                                                >
                                                    {revealStep === 'verifying' ? (
                                                        <>
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            Verifying…
                                                        </>
                                                    ) : (
                                                        <>Reveal full details</>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={requestReveal}
                                                    className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                                                >
                                                    Resend code
                                                </button>
                                            </div>
                                        )}

                                        {revealError && (
                                            <div className="mt-3 text-xs text-destructive flex items-center gap-1.5">
                                                <AlertCircle className="w-3 h-3" />
                                                {revealError}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    <Sparkles className="inline w-3 h-3 mr-1 align-text-bottom text-emerald-500" />
                    Team Excellent Publicity -&nbsp; Man Navlakha
                </p>
            </main>

            <ReportShellStyle />
        </div>
    );
}

function Row({ label, value, mono, icon }) {
    return (
        <li className="info-row">
            <span className="info-row-label">
                {icon}
                {label}
            </span>
            <span className={`info-row-value ${mono ? 'font-mono text-[13px] break-all' : ''}`}>
                {value}
            </span>
        </li>
    );
}

/**
 * All page-specific CSS lives here so the rest of the app keeps its
 * Tailwind tokens untouched. Inter font fallbacks, brand accent, animations.
 */
function ReportShellStyle() {
    return (
        <style>{`
            .report-shell {
                min-height: 100vh;
                background:
                    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(236, 66, 105, 0.12), transparent 60%),
                    var(--color-background, #fafafa);
                color: var(--color-foreground, #0a0a0a);
                font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                font-feature-settings: "ss01", "cv11";
                letter-spacing: -0.01em;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            .dark .report-shell {
                background:
                    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212, 175, 55, 0.10), transparent 60%),
                    var(--color-background, #0a0a0a);
            }

            .display-heading {
                font-weight: 800;
                letter-spacing: -0.035em;
                line-height: 1.05;
                color: var(--color-foreground);
            }
            .accent {
                background: linear-gradient(135deg, #ec4269 0%, #ec3176 100%);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
            }
            .dark .accent {
                background: linear-gradient(135deg, #D4AF37 0%, #f0c75e 100%);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
            }

            .device-card {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.75rem;
                padding: 0.875rem 1.125rem;
                border-radius: 1rem;
                border: 1px solid var(--color-border);
                background: var(--color-card);
                box-shadow: 0 1px 0 rgba(0,0,0,0.02);
            }
            .device-card-pid {
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 0.875rem;
                font-weight: 700;
                letter-spacing: 0.02em;
                color: var(--color-foreground);
            }
            .device-card-meta {
                font-size: 0.75rem;
                color: var(--color-muted-foreground);
                text-align: right;
                line-height: 1.3;
                word-break: break-word;
            }

            .form-label {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
            }
            .form-label-step {
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 9px;
                letter-spacing: 0.2em;
                font-weight: 700;
                color: #ec4269;
                background: rgba(236, 66, 105, 0.10);
                border: 1px solid rgba(236, 66, 105, 0.25);
                border-radius: 999px;
                padding: 2px 7px;
            }
            .dark .form-label-step {
                color: #D4AF37;
                background: rgba(212, 175, 55, 0.10);
                border-color: rgba(212, 175, 55, 0.30);
            }
            .form-label-text {
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.18em;
                color: var(--color-foreground);
            }

            .form-select {
                width: 100%;
                border-radius: 999px;
                border: 1px solid var(--color-border);
                background: var(--color-card);
                padding: 0.625rem 2.5rem 0.625rem 1.125rem;
                font-size: 0.85rem;
                font-weight: 500;
                font-family: inherit;
                color: var(--color-foreground);
                outline: none;
                cursor: pointer;
                appearance: none;
                -webkit-appearance: none;
                background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
                background-repeat: no-repeat;
                background-position: right 1.125rem center;
                transition: border-color 0.15s, box-shadow 0.15s;
            }
            .form-select:focus {
                border-color: rgba(236, 66, 105, 0.4);
                box-shadow: 0 0 0 4px rgba(236, 66, 105, 0.08);
            }
            .dark .form-select:focus {
                border-color: rgba(212, 175, 55, 0.5);
                box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.10);
            }

            .form-textarea {
                width: 100%;
                border-radius: 1.25rem;
                border: 1px solid var(--color-border);
                background: var(--color-card);
                padding: 1rem 1.125rem;
                font-size: 0.95rem;
                line-height: 1.55;
                font-family: inherit;
                color: var(--color-foreground);
                resize: none;
                transition: border-color 0.15s, box-shadow 0.15s;
                outline: none;
            }
            .form-textarea::placeholder { color: var(--color-muted-foreground); }
            .form-textarea:focus {
                border-color: rgba(236, 66, 105, 0.4);
                box-shadow: 0 0 0 4px rgba(236, 66, 105, 0.08);
            }
            .dark .form-textarea:focus {
                border-color: rgba(212, 175, 55, 0.5);
                box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.10);
            }

            .photo-btn {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.625rem;
                min-height: 64px;
                border-radius: 1.25rem;
                border: 1.5px dashed var(--color-border);
                background: var(--color-card);
                color: var(--color-muted-foreground);
                font-family: inherit;
                transition: border-color 0.15s, background 0.15s, color 0.15s;
            }
            .photo-btn:hover {
                border-color: var(--color-foreground);
                color: var(--color-foreground);
            }

            .submit-btn {
                width: 100%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                height: 56px;
                border-radius: 999px;
                background: #ec4269;
                color: #ffffff;
                font-weight: 700;
                font-size: 0.95rem;
                letter-spacing: -0.01em;
                box-shadow:
                    0 1px 0 rgba(255,255,255,0.2) inset,
                    0 10px 25px -10px rgba(236, 66, 105, 0.55);
                transition: transform 0.12s, opacity 0.15s;
            }
            .submit-btn:hover { opacity: 0.95; }
            .submit-btn:active { transform: scale(0.99); }
            .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .dark .submit-btn {
                background: #D4AF37;
                color: #18181b;
                box-shadow:
                    0 1px 0 rgba(255,255,255,0.15) inset,
                    0 10px 25px -10px rgba(212, 175, 55, 0.45);
            }

            .details-card {
                border: 1px solid var(--color-border);
                background: var(--color-card);
                border-radius: 1.5rem;
                overflow: hidden;
            }
            .details-card-trigger {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.125rem 1.25rem;
                font-size: 0.95rem;
                font-weight: 600;
                color: var(--color-foreground);
                font-family: inherit;
            }
            .details-card-body {
                padding: 0 1.25rem 1.5rem;
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }
            .section-eyebrow {
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.18em;
                color: var(--color-muted-foreground);
                margin-bottom: 0.75rem;
            }

            .info-list {
                display: flex;
                flex-direction: column;
                gap: 0.625rem;
                font-size: 0.875rem;
            }
            .info-row {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 0.75rem;
            }
            .info-row-label {
                display: inline-flex;
                align-items: center;
                gap: 0.4rem;
                color: var(--color-muted-foreground);
                flex-shrink: 0;
            }
            .info-row-value {
                text-align: right;
                color: var(--color-foreground);
            }

            .verified-pill {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 10px;
                font-weight: 700;
                color: #059669;
                background: rgba(16, 185, 129, 0.10);
                border: 1px solid rgba(16, 185, 129, 0.30);
                padding: 2px 8px;
                border-radius: 999px;
            }
            .dark .verified-pill { color: #34d399; }

            .reveal-btn {
                width: 100%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.4rem;
                height: 42px;
                border-radius: 999px;
                border: 1px solid var(--color-border);
                background: var(--color-background);
                color: var(--color-foreground);
                font-size: 0.85rem;
                font-weight: 600;
                font-family: inherit;
                transition: background 0.15s;
            }
            .reveal-btn:hover { background: var(--color-muted); }
            .reveal-btn-primary {
                background: var(--color-foreground);
                color: var(--color-background);
                border-color: var(--color-foreground);
            }
            .reveal-btn-primary:hover { opacity: 0.92; }
            .reveal-btn:disabled { opacity: 0.5; cursor: not-allowed; }

            .otp-input {
                width: 100%;
                height: 64px;
                text-align: center;
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 2rem;
                font-weight: 700;
                letter-spacing: 0.5em;
                text-indent: 0.5em;
                border-radius: 1rem;
                border: 1.5px solid var(--color-border);
                background: var(--color-background);
                color: var(--color-foreground);
                outline: none;
                transition: border-color 0.15s, box-shadow 0.15s;
            }
            .otp-input:focus {
                border-color: rgba(236, 66, 105, 0.5);
                box-shadow: 0 0 0 4px rgba(236, 66, 105, 0.08);
            }
            .dark .otp-input:focus {
                border-color: rgba(212, 175, 55, 0.5);
                box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.10);
            }
        `}</style>
    );
}
