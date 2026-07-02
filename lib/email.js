import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    }
});

const LOGO_URL = 'https://man-support.vercel.app/_next/image?url=%2FEP_Logo_fav.png&w=64&q=75';
const SIGNATURE = 'Designed By Man Navlakha ( IT Support )';

/**
 * Minimal HTML wrapper: company logo on top, plain text body, signature at the bottom.
 * No buttons, no boxes, no styling chrome — just text.
 */
function renderTextEmail(bodyText, title) {
    const escapedBody = String(bodyText)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#111;background:#fff;">
    <img src="${LOGO_URL}" alt="Excellent Publicity" height="28" style="display:block;height:28px;width:auto;border:0;margin-bottom:24px;">
    <div>${escapedBody}</div>
    <p style="margin-top:32px;color:#666;font-size:13px;">${SIGNATURE}</p>
</body>
</html>`;
}

function buildSignedText(bodyText) {
    return `${bodyText}\n\n--\n${SIGNATURE}`;
}

/**
 * Send an invitation email to a new user
 */
export async function sendInviteEmail(toEmail, inviteLink, role = 'USER') {
    const roleLabels = { ADMIN: 'Administrator', AGENT: 'IT Department', USER: 'User' };
    const roleLabel = roleLabels[role] || role;

    const body = `Hi,

You've been invited to join Excellent IT as a ${roleLabel}.

Click the link below to set up your account:
${inviteLink}

This invitation expires in 24 hours.
If you didn't expect this invitation, you can safely ignore this email.`;

    const mailOptions = {
        from: `"Excellent IT" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `You've been invited to Excellent IT`,
        text: buildSignedText(body),
        html: renderTextEmail(body, "You've been invited"),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Invitation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send invitation email:', error);
        throw error;
    }
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(toEmail, resetLink) {
    const body = `Hi,

We received a request to reset the password for this account.

Click the link below to set a new password:
${resetLink}

This link expires in 1 hour.
If you didn't request this, please ignore this email — your password won't change.`;

    const mailOptions = {
        from: `"Excellent IT" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `Reset your password — Excellent IT`,
        text: buildSignedText(body),
        html: renderTextEmail(body, 'Reset your password'),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send password reset email:', error);
        throw error;
    }
}

/**
 * Send notification to agents about a new ticket.
 *
 * Pass `baseUrl` (recommended) so the email's "View Ticket" link uses the
 * domain the user actually hit. Computed from the request headers via
 * `getBaseUrl(request)` — see lib/get-base-url.js. Falls back to
 * NEXT_PUBLIC_APP_URL, then localhost, if omitted.
 */
export async function sendNewTicketNotification(toEmail, ticketData, baseUrl, replyTo) {
    const { id, title, description, priority, userEmail, userName } = ticketData;
    const origin = (
        baseUrl ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        'http://localhost:3000'
    ).replace(/\/+$/, '');
    const ticketLink = `${origin}/dashboard/${id}`;

    const body = `A new support ticket has been submitted.

Ticket ID:  ${id}
Subject:    ${title}
Priority:   ${priority}
Reporter:   ${userName} (${userEmail})

Description:
${description}

View ticket: ${ticketLink}`;

    const mailOptions = {
        from: `"Excellent IT" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `New Ticket: ${title} [${priority}] — #${id}`,
        text: buildSignedText(body),
        html: renderTextEmail(body, 'New Ticket'),
        headers: {
            'X-Ticket-Id': String(id),
            'Auto-Submitted': 'auto-generated',
        },
    };
    if (replyTo) mailOptions.replyTo = replyTo;

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`❌ Failed to notify agent ${toEmail}:`, error);
    }
}

/**
 * Send a confirmation to the person who reported the issue (the device's
 * assigned user). Sets Reply-To to the IT inbox so any reply continues
 * the conversation with IT directly via email.
 */
export async function sendTicketConfirmationToReporter(toEmail, ticketData, itReplyTo) {
    const { id, title, description, priority, trackUrl } = ticketData;

    const trackLine = trackUrl
        ? `\nTrack your ticket: ${trackUrl}\n(Open this link any time to see live status. Log in for full details.)\n`
        : '';

    const body = `Hi,

Thanks — your ticket has been logged with the IT team. We'll get back to you on this email thread shortly.

To continue the conversation, simply reply to this email. IT will see your reply and respond here.

Ticket ID:  ${id}
Subject:    ${title}
Priority:   ${priority}
${trackLine}
What you reported:
${description}`;

    const mailOptions = {
        from: `"Excellent IT" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `[Ticket #${id}] ${title}`,
        text: buildSignedText(body),
        html: renderTextEmail(body, 'Your ticket has been logged'),
        headers: {
            'X-Ticket-Id': String(id),
            'Auto-Submitted': 'auto-generated',
        },
    };
    if (itReplyTo) mailOptions.replyTo = itReplyTo;

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`❌ Failed to send confirmation to reporter ${toEmail}:`, error);
    }
}

/**
 * Send a short-lived OTP code used by the QR-scan "Show my details" flow.
 */
export async function sendOtpEmail(toEmail, code, pid) {
    const body = `Hi,

Someone scanned the QR for device ${pid || ''} and asked to see your contact details.

If that was you, use this verification code:

${code}

This code expires in 10 minutes.
If this wasn't you, ignore this email — your details stay hidden.`;

    const mailOptions = {
        from: `"Excellent IT" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `Your verification code`,
        text: buildSignedText(body),
        html: renderTextEmail(body, 'Verification code'),
        headers: { 'Auto-Submitted': 'auto-generated' },
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`❌ Failed to send OTP to ${toEmail}:`, error);
        throw error;
    }
}

/**
 * Email a user the link to their email-signature page so they can open it on
 * their laptop (Gmail/Outlook signature settings live on desktop).
 */
export async function sendSignatureLinkEmail(toEmail, link) {
    const body = `Hi,

Here's the link to grab your Excellent Publicity email signature:

${link}

Open it on your laptop, search your name, then copy the signature into your Gmail or Outlook settings.`;

    const mailOptions = {
        from: `"Excellent IT" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `Your email signature link`,
        text: buildSignedText(body),
        html: renderTextEmail(body, 'Your email signature link'),
        headers: { 'Auto-Submitted': 'auto-generated' },
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`❌ Failed to send signature link to ${toEmail}:`, error);
        throw error;
    }
}
