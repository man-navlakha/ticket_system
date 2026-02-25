import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 587,
    secure: false,
    auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_PASSWORD,
    },
    tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    }
});

/** Shared base styles used across all email templates */
function baseStyles() {
    return `
        /* Reset */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-spacing: 0; }
        img { border: 0; }

        /* Light mode (default) */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            background-color: #f4f4f5;
            color: #09090b;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 580px;
            margin: 40px auto;
            background: #ffffff;
            border: 1px solid #e4e4e7;
            border-radius: 12px;
            overflow: hidden;
        }
        .header {
            padding: 28px 32px;
            border-bottom: 1px solid #e4e4e7;
            background: #fafafa;
        }
        .logo-text {
            font-size: 18px;
            font-weight: 700;
            color: #09090b;
            letter-spacing: -0.5px;
        }
        .logo-sub {
            color: #71717a;
        }
        .content {
            padding: 32px;
        }
        .content h2 {
            margin: 0 0 12px 0;
            font-size: 22px;
            font-weight: 700;
            color: #09090b;
            letter-spacing: -0.5px;
        }
        .content p {
            margin: 0 0 16px 0;
            font-size: 15px;
            line-height: 1.65;
            color: #52525b;
        }
        .button {
            display: inline-block;
            background: #09090b;
            color: #ffffff !important;
            padding: 13px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            margin: 8px 0 24px 0;
            letter-spacing: 0.1px;
        }
        .link-box {
            background: #f4f4f5;
            border: 1px solid #e4e4e7;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 12px;
            font-family: 'SFMono-Regular', Consolas, monospace;
            color: #3f3f46;
            word-break: break-all;
            display: block;
            margin-top: 8px;
        }
        .meta {
            font-size: 13px;
            color: #71717a;
            margin-top: 20px;
        }
        .badge {
            display: inline-block;
            background: #f4f4f5;
            color: #3f3f46;
            border: 1px solid #e4e4e7;
            padding: 2px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .footer {
            padding: 20px 32px;
            border-top: 1px solid #e4e4e7;
            background: #fafafa;
            font-size: 13px;
            color: #71717a;
            line-height: 1.5;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            body { background-color: #000000 !important; color: #fafafa !important; }
            .container { background: #0f0f0f !important; border-color: #27272a !important; }
            .header { background: #0a0a0a !important; border-color: #27272a !important; }
            .logo-text { color: #fafafa !important; }
            .logo-sub { color: #71717a !important; }
            .content h2 { color: #fafafa !important; }
            .content p { color: #a1a1aa !important; }
            .button { background: #fafafa !important; color: #09090b !important; }
            .link-box { background: #18181b !important; border-color: #27272a !important; color: #d4d4d8 !important; }
            .badge { background: #27272a !important; color: #a1a1aa !important; border-color: #3f3f46 !important; }
            .footer { background: #0a0a0a !important; border-color: #27272a !important; color: #71717a !important; }
            .meta { color: #71717a !important; }
            .ticket-box { background: #18181b !important; border-color: #27272a !important; }
            .ticket-box strong { color: #fafafa !important; }
        }
    `;
}

/**
 * Send an invitation email to a new user
 */
export async function sendInviteEmail(toEmail, inviteLink, role = 'USER') {
    const roleLabels = { ADMIN: 'Administrator', AGENT: 'IT Department', USER: 'User' };
    const roleLabel = roleLabels[role] || role;

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>You've been invited</title>
    <style>${baseStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="logo-text">MAN&apos;S <span class="logo-sub">SUPPORT DESK</span></span>
        </div>
        <div class="content">
            <h2>You've been invited</h2>
            <p>You've been invited to join <strong>MAN&apos;S SUPPORT DESK</strong> as a <span class="badge">${roleLabel}</span>.</p>
            <p>Click the button below to set up your account and get started:</p>
            <a href="${inviteLink}" class="button">Complete Account Setup →</a>
            <p class="meta">
                Or copy and paste this link into your browser:<br>
                <span class="link-box">${inviteLink}</span>
            </p>
            <p class="meta">This invitation expires in <strong>24 hours</strong>.</p>
        </div>
        <div class="footer">
            You received this because you were invited to Man's Support Desk. If you didn't expect this, you can safely ignore it.
        </div>
    </div>
</body>
</html>`.trim();

    const emailText = `
You've been invited to join Man's Support Desk as a ${roleLabel}.

Click the link below to set up your account:
${inviteLink}

This invitation expires in 24 hours.
If you didn't expect this invitation, please ignore this email.
    `.trim();

    const mailOptions = {
        from: `"Man's Support Desk" <${process.env.ZOHO_EMAIL}>`,
        to: toEmail,
        subject: `You've been invited to Man's Support Desk`,
        text: emailText,
        html: emailHtml,
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
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Reset your password</title>
    <style>${baseStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="logo-text">Man's <span class="logo-sub">Support Desk</span></span>
        </div>
        <div class="content">
            <h2>Reset your password</h2>
            <p>We received a request to reset the password for this account. If you made this request, click the button below.</p>
            <p>If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
            <a href="${resetLink}" class="button">Reset Password →</a>
            <p class="meta">
                Or copy and paste this link into your browser:<br>
                <span class="link-box">${resetLink}</span>
            </p>
            <p class="meta">This link expires in <strong>1 hour</strong>.</p>
        </div>
        <div class="footer">
            You received this because a password reset was requested for your Man's Support Desk account. If this wasn't you, no action is needed.
        </div>
    </div>
</body>
</html>`.trim();

    const emailText = `
Reset your password — Man's Support Desk

We received a request to reset your password.

Click the link below to set a new password:
${resetLink}

This link expires in 1 hour.
If you didn't request this, please ignore this email.
    `.trim();

    const mailOptions = {
        from: `"Man's Support Desk" <${process.env.ZOHO_EMAIL}>`,
        to: toEmail,
        subject: `Reset your password — Man's Support Desk`,
        text: emailText,
        html: emailHtml,
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
 * Send notification to agents about a new ticket
 */
export async function sendNewTicketNotification(toEmail, ticketData) {
    const { id, title, description, priority, userEmail, userName } = ticketData;
    const ticketLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/${id}`;

    const priorityColors = {
        HIGH: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
        MEDIUM: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
        LOW: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    };
    const pc = priorityColors[priority] || priorityColors.MEDIUM;

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>New Ticket</title>
    <style>
        ${baseStyles()}
        .ticket-box {
            background: #f4f4f5;
            border: 1px solid #e4e4e7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .ticket-box p { margin: 0 0 10px 0; font-size: 14px; color: #52525b; }
        .ticket-box p:last-child { margin-bottom: 0; }
        .ticket-box strong { color: #09090b; }
        .priority-badge {
            display: inline-block;
            background: ${pc.bg};
            color: ${pc.color};
            border: 1px solid ${pc.border};
            padding: 2px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="logo-text">Man's <span class="logo-sub">Support Desk</span></span>
        </div>
        <div class="content">
            <h2>New Ticket Reported</h2>
            <p>A new support ticket has been submitted and requires attention.</p>
            <div class="ticket-box">
                <p><strong>Subject:</strong> ${title}</p>
                <p><strong>Priority:</strong> <span class="priority-badge">${priority}</span></p>
                <p><strong>Submitted by:</strong> ${userName} (${userEmail})</p>
                <p><strong>Description:</strong><br>${description}</p>
            </div>
            <a href="${ticketLink}" class="button">View Ticket →</a>
            <p class="meta">Ticket ID: <code>${id}</code></p>
        </div>
        <div class="footer">
            Automated notification from Man's Support Desk. Do not reply to this email.
        </div>
    </div>
</body>
</html>`.trim();

    const mailOptions = {
        from: `"Man's Support Desk" <${process.env.ZOHO_EMAIL}>`,
        to: toEmail,
        subject: `New Ticket: ${title} [${priority}]`,
        html: emailHtml,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`❌ Failed to notify agent ${toEmail}:`, error);
    }
}
