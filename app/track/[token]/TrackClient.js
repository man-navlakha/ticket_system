'use client';

import { useState } from 'react';
import Link from 'next/link';

const DETERRENT = "The data is private , so don't be smart fool";

const STATUS_STYLES = {
    OPEN: { bg: '#dcfce7', color: '#166534', label: 'Open' },
    IN_PROGRESS: { bg: '#dbeafe', color: '#1e40af', label: 'In Progress' },
    RESOLVED: { bg: '#e0e7ff', color: '#3730a3', label: 'Resolved' },
    CLOSED: { bg: '#f1f5f9', color: '#475569', label: 'Closed' },
    CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
    REOPENED: { bg: '#fef3c7', color: '#92400e', label: 'Reopened' },
};

const PRIORITY_STYLES = {
    HIGH: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    MEDIUM: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    LOW: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
};

/**
 * Blur-gated block. Any copy/cut/drag attempt while still blurred replaces
 * the clipboard contents with the deterrent string. Once `unlocked` (user is
 * logged in), the block renders normally.
 */
function Gated({ unlocked, children, label }) {
    function clobber(e) {
        if (unlocked) return;
        e.preventDefault();
        try {
            e.clipboardData?.setData('text/plain', DETERRENT);
        } catch {
            /* older browsers — preventDefault is enough */
        }
    }

    return (
        <div
            onCopy={clobber}
            onCut={clobber}
            onDragStart={clobber}
            onContextMenu={(e) => !unlocked && e.preventDefault()}
            style={{
                position: 'relative',
                userSelect: unlocked ? 'auto' : 'none',
                WebkitUserSelect: unlocked ? 'auto' : 'none',
            }}
        >
            <div
                style={{
                    filter: unlocked ? 'none' : 'blur(6px)',
                    pointerEvents: unlocked ? 'auto' : 'none',
                    transition: 'filter 200ms ease',
                }}
                aria-hidden={!unlocked}
            >
                {children}
            </div>
            {!unlocked && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#52525b',
                        background: 'rgba(255,255,255,0.35)',
                        backdropFilter: 'blur(1px)',
                    }}
                >
                    🔒 Log in to view {label}
                </div>
            )}
        </div>
    );
}

export default function TrackClient({ token, publicData, gatedData, isLoggedIn }) {
    const status = STATUS_STYLES[publicData.status] || STATUS_STYLES.OPEN;
    const priority = PRIORITY_STYLES[publicData.priority] || PRIORITY_STYLES.MEDIUM;

    // OTP comment flow state
    const [otpStep, setOtpStep] = useState('idle'); // idle | sending | code | posting | done
    const [maskedEmail, setMaskedEmail] = useState('');
    const [code, setCode] = useState('');
    const [comment, setComment] = useState('');
    const [otpError, setOtpError] = useState('');

    async function startOtp() {
        setOtpError('');
        setOtpStep('sending');
        try {
            const r = await fetch(`/api/track/${token}/request-comment-otp`, { method: 'POST' });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || 'Could not send code.');
            setMaskedEmail(j.maskedEmail || '');
            setOtpStep('code');
        } catch (err) {
            setOtpError(err.message);
            setOtpStep('idle');
        }
    }

    async function submitComment(e) {
        e.preventDefault();
        if (!comment.trim() || !code.trim()) return;
        setOtpError('');
        setOtpStep('posting');
        try {
            const r = await fetch(`/api/track/${token}/post-comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.trim(), content: comment.trim() }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || 'Could not post comment.');
            setOtpStep('done');
            setComment('');
            setCode('');
        } catch (err) {
            setOtpError(err.message);
            setOtpStep('code');
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', padding: '24px 16px' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, color: '#71717a', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
                        Ticket Tracker
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#09090b', margin: 0 }}>
                        {publicData.title}
                    </h1>
                </div>

                {/* Public meta — always visible */}
                <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <Row label="Ticket ID" value={<code style={{ fontFamily: 'SFMono-Regular, Consolas, monospace', fontSize: 12, background: '#f4f4f5', padding: '2px 6px', borderRadius: 4 }}>{publicData.id}</code>} />
                    <Row label="Status" value={
                        <span style={{ display: 'inline-block', background: status.bg, color: status.color, padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {status.label}
                        </span>
                    } />
                    <Row label="Priority" value={
                        <span style={{ display: 'inline-block', background: priority.bg, color: priority.color, border: `1px solid ${priority.border}`, padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {publicData.priority}
                        </span>
                    } />
                    {publicData.device && <Row label="Device" value={publicData.device} />}
                    {publicData.category && <Row label="Category" value={publicData.category} />}
                    <Row label="Created" value={new Date(publicData.createdAt).toLocaleString()} />
                    <Row label="Last update" value={new Date(publicData.updatedAt).toLocaleString()} last />
                </div>

                {/* Login CTA — only if not logged in */}
                {!isLoggedIn && (
                    <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ fontSize: 13, color: '#52525b' }}>
                            Description, reporter and full conversation are hidden. Log in to view.
                        </div>
                        <Link
                            href="/auth/login"
                            style={{ background: '#09090b', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
                        >
                            Log in →
                        </Link>
                    </div>
                )}

                {/* Description */}
                <SectionTitle>Description</SectionTitle>
                <Gated unlocked={isLoggedIn} label="description">
                    <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 12, padding: 20, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, color: '#27272a', minHeight: 80 }}>
                        {gatedData.description}
                    </div>
                </Gated>

                {/* Reporter */}
                <SectionTitle>Reported by</SectionTitle>
                <Gated unlocked={isLoggedIn} label="reporter">
                    <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 12, padding: 20, minHeight: 60 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#09090b' }}>{gatedData.reporterName}</div>
                        {gatedData.reporterEmail && (
                            <div style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>{gatedData.reporterEmail}</div>
                        )}
                    </div>
                </Gated>

                {/* Resolution */}
                {gatedData.resolutionDetails && (
                    <>
                        <SectionTitle>Resolution</SectionTitle>
                        <Gated unlocked={isLoggedIn} label="resolution">
                            <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 12, padding: 20, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, color: '#27272a' }}>
                                {gatedData.resolutionDetails}
                            </div>
                        </Gated>
                    </>
                )}

                {/* Comments */}
                <SectionTitle>Conversation ({gatedData.comments.length})</SectionTitle>
                <Gated unlocked={isLoggedIn} label="conversation">
                    <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 12, padding: 20, minHeight: 100 }}>
                        {gatedData.comments.length === 0 ? (
                            <div style={{ fontSize: 13, color: '#71717a' }}>No replies yet.</div>
                        ) : (
                            gatedData.comments.map((c) => (
                                <div key={c.id} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #f4f4f5' }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#09090b', marginBottom: 4 }}>
                                        {c.authorName} <span style={{ color: '#a1a1aa', fontWeight: 400 }}>· {new Date(c.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div style={{ fontSize: 14, color: '#27272a', whiteSpace: 'pre-wrap' }}>{c.content}</div>
                                </div>
                            ))
                        )}
                    </div>
                </Gated>

                {/* Reporter OTP-reply (no login needed) */}
                <SectionTitle>Reply as the reporter</SectionTitle>
                <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 12, padding: 20 }}>
                    {otpStep === 'idle' && (
                        <>
                            <p style={{ fontSize: 13, color: '#52525b', margin: '0 0 12px 0' }}>
                                Are you the person who reported this ticket? You can post a reply without logging in — we&apos;ll email you a 6-digit code to verify.
                            </p>
                            <button
                                type="button"
                                onClick={startOtp}
                                style={{ background: '#09090b', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                            >
                                Email me a code
                            </button>
                            {otpError && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{otpError}</p>}
                        </>
                    )}

                    {otpStep === 'sending' && <p style={{ fontSize: 13, color: '#52525b' }}>Sending code…</p>}

                    {(otpStep === 'code' || otpStep === 'posting') && (
                        <form onSubmit={submitComment} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <p style={{ fontSize: 13, color: '#52525b', margin: 0 }}>
                                We sent a 6-digit code to <strong>{maskedEmail}</strong>. Enter it and your reply below.
                            </p>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="6-digit code"
                                required
                                style={{ padding: 10, border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 16, letterSpacing: 4, textAlign: 'center', fontFamily: 'SFMono-Regular, Consolas, monospace' }}
                            />
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Your reply…"
                                rows={4}
                                required
                                style={{ padding: 10, border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 14, lineHeight: 1.5, resize: 'vertical' }}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    type="submit"
                                    disabled={otpStep === 'posting' || !code || !comment.trim()}
                                    style={{ background: '#09090b', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: otpStep === 'posting' ? 0.6 : 1 }}
                                >
                                    {otpStep === 'posting' ? 'Posting…' : 'Post reply'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setOtpStep('idle'); setCode(''); setOtpError(''); }}
                                    style={{ background: 'transparent', color: '#52525b', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid #e4e4e7', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                            </div>
                            {otpError && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{otpError}</p>}
                        </form>
                    )}

                    {otpStep === 'done' && (
                        <div>
                            <p style={{ fontSize: 14, color: '#166534', fontWeight: 600, margin: '0 0 8px 0' }}>✓ Reply posted</p>
                            <p style={{ fontSize: 13, color: '#52525b', margin: 0 }}>
                                IT will see it. Refresh the page to view your reply in the conversation.
                            </p>
                        </div>
                    )}
                </div>

                <p style={{ textAlign: 'center', fontSize: 12, color: '#a1a1aa', marginTop: 32 }}>
                    Designed By Man Navlakha ( IT Support )
                </p>
            </div>
        </div>
    );
}

function Row({ label, value, last }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: last ? 'none' : '1px solid #f4f4f5', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 14, color: '#27272a', textAlign: 'right' }}>{value}</span>
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <div style={{ fontSize: 11, color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, margin: '24px 4px 8px 4px' }}>
            {children}
        </div>
    );
}
