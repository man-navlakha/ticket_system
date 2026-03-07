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
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        img[alt="Excellent Publicity"] { display: block; border: 0; outline: none; text-decoration: none; }

        /* Light mode (default) */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            background-color: #f4f4f5;
            color: #09090b;
            margin: 0;
            padding: 0;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            body, .table-bg { background-color: #000000 !important; }
            td.container-bg { background-color: #0f0f0f !important; border-color: #27272a !important; }
            td.header-bg, td.footer-bg { background-color: #0a0a0a !important; border-color: #27272a !important; }
            h2, strong, td.content-cell { color: #fafafa !important; }
            td.content-cell p { color: #a1a1aa !important; }
            td.button-bg a { background-color: #fafafa !important; color: #09090b !important; border-color: #fafafa !important; }
            td.button-bg { background-color: #fafafa !important; }
            td.link-box-bg { background-color: #18181b !important; border-color: #27272a !important; color: #d4d4d8 !important; }
            span.badge-bg { background-color: #27272a !important; color: #a1a1aa !important; border-color: #3f3f46 !important; }
            td.footer-bg { color: #71717a !important; }
            span.meta-text { color: #71717a !important; }
            td.ticket-box-bg { background-color: #18181b !important; border-color: #27272a !important; }
            td.ticket-box-bg p, td.ticket-box-bg span { color: #a1a1aa !important; }
            td.ticket-box-bg strong { color: #fafafa !important; }
        }
    `;
}

function renderWrapper(innerHtml, footerHtml, title) {
    return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <!--[if mso]>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <title>${title}</title>
    <style>${baseStyles()}</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="table-bg" style="background-color: #f4f4f5; padding: 40px 0;">
        <tr>
            <td align="center">
                <!--[if (gte mso 9)|(IE)]>
                <table align="center" border="0" cellspacing="0" cellpadding="0" width="580">
                <tr>
                <td align="center" valign="top" width="580">
                <![endif]-->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; width: 100%; border-collapse: separate; border-spacing: 0; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; margin: 0 auto; overflow: hidden;" class="container-bg">
                    <tr>
                        <td class="header-bg" style="padding: 28px 32px; border-bottom: 1px solid #e4e4e7; background-color: #fafafa;">
                            <img src="https://man-support.vercel.app/_next/image?url=%2FEP_Logo_fav.png&w=64&q=75" alt="Excellent Publicity" height="24" style="display: block; height: 24px; width: auto; border: 0; outline: none; text-decoration: none;" />
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell" style="padding: 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.65; color: #52525b; text-align: left;">
                            ${innerHtml}
                        </td>
                    </tr>
                    <tr>
                        <td class="footer-bg" style="padding: 20px 32px; border-top: 1px solid #e4e4e7; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #71717a; text-align: left;">
                            ${footerHtml}
                        </td>
                    </tr>
                </table>
                <!--[if (gte mso 9)|(IE)]>
                </td>
                </tr>
                </table>
                <![endif]-->
            </td>
        </tr>
    </table>
</body>
</html>`.trim();
}

/**
 * Send an invitation email to a new user
 */
export async function sendInviteEmail(toEmail, inviteLink, role = 'USER') {
    const roleLabels = { ADMIN: 'Administrator', AGENT: 'IT Department', USER: 'User' };
    const roleLabel = roleLabels[role] || role;

    const innerHtml = `
        <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #09090b; letter-spacing: -0.5px;">You've been invited</h2>
        <p style="margin: 0 0 16px 0;">You've been invited to join <strong>MAN&apos;S SUPPORT DESK</strong> as a <span class="badge-bg" style="display: inline-block; background-color: #f4f4f5; color: #3f3f46; border: 1px solid #e4e4e7; padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${roleLabel}</span>.</p>
        <p style="margin: 0 0 16px 0;">Click the button below to set up your account and get started:</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 8px 0 24px 0;">
            <tr>
                <td align="center" class="button-bg" style="border-radius: 8px; background-color: #09090b;">
                    <a href="${inviteLink}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; padding: 13px 28px; border: 1px solid #09090b; display: inline-block; letter-spacing: 0.1px;">Complete Account Setup &rarr;</a>
                </td>
            </tr>
        </table>

        <p class="meta-text" style="margin: 20px 0 0 0; font-size: 13px; color: #71717a;">
            Or copy and paste this link into your browser:<br>
        </p>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 8px; margin-bottom: 20px;">
            <tr>
                <td class="link-box-bg" style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 12px 16px; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px; color: #3f3f46; word-break: break-all;">
                    ${inviteLink}
                </td>
            </tr>
        </table>
        <p class="meta-text" style="margin: 0; font-size: 13px; color: #71717a;">This invitation expires in <strong>24 hours</strong>.</p>
    `;

    const footerHtml = `You received this because you were invited to Man's Support Desk. If you didn't expect this, you can safely ignore it.`;

    const emailHtml = renderWrapper(innerHtml, footerHtml, "You've been invited");

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
    const innerHtml = `
        <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #09090b; letter-spacing: -0.5px;">Reset your password</h2>
        <p style="margin: 0 0 16px 0;">We received a request to reset the password for this account. If you made this request, click the button below.</p>
        <p style="margin: 0 0 16px 0;">If you didn't request a password reset, you can safely ignore this email &mdash; your password won't change.</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 8px 0 24px 0;">
            <tr>
                <td align="center" class="button-bg" style="border-radius: 8px; background-color: #09090b;">
                    <a href="${resetLink}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; padding: 13px 28px; border: 1px solid #09090b; display: inline-block; letter-spacing: 0.1px;">Reset Password &rarr;</a>
                </td>
            </tr>
        </table>
        
        <p class="meta-text" style="margin: 20px 0 0 0; font-size: 13px; color: #71717a;">
            Or copy and paste this link into your browser:<br>
        </p>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 8px; margin-bottom: 20px;">
            <tr>
                <td class="link-box-bg" style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 12px 16px; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px; color: #3f3f46; word-break: break-all;">
                    ${resetLink}
                </td>
            </tr>
        </table>
        <p class="meta-text" style="margin: 0; font-size: 13px; color: #71717a;">This link expires in <strong>1 hour</strong>.</p>
    `;

    const footerHtml = `You received this because a password reset was requested for your Man's Support Desk account. If this wasn't you, no action is needed.`;

    const emailHtml = renderWrapper(innerHtml, footerHtml, "Reset your password");

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

    const innerHtml = `
        <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #09090b; letter-spacing: -0.5px;">New Ticket Reported</h2>
        <p style="margin: 0 0 16px 0;">A new support ticket has been submitted and requires attention.</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
            <tr>
                <td class="ticket-box-bg" style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #52525b;">
                    <p style="margin: 0 0 10px 0;"><strong style="color: #09090b;">Subject:</strong> ${title}</p>
                    <p style="margin: 0 0 10px 0;"><strong style="color: #09090b;">Priority:</strong> 
                        <span style="display: inline-block; background-color: ${pc.bg}; color: ${pc.color}; border: 1px solid ${pc.border}; padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${priority}</span>
                    </p>
                    <p style="margin: 0 0 10px 0;"><strong style="color: #09090b;">Submitted by:</strong> ${userName} (${userEmail})</p>
                    <p style="margin: 0;"><strong style="color: #09090b;">Description:</strong><br>${description}</p>
                </td>
            </tr>
        </table>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 8px 0 24px 0;">
            <tr>
                <td align="center" class="button-bg" style="border-radius: 8px; background-color: #09090b;">
                    <a href="${ticketLink}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; padding: 13px 28px; border: 1px solid #09090b; display: inline-block; letter-spacing: 0.1px;">View Ticket &rarr;</a>
                </td>
            </tr>
        </table>
        
        <p class="meta-text" style="font-size: 13px; color: #71717a; margin: 0;">Ticket ID: 
            <span style="font-family: 'SFMono-Regular', Consolas, monospace; background: #f4f4f5; padding: 2px 4px; border-radius: 4px; border: 1px solid #e4e4e7; display: inline-block;">${id}</span>
        </p>
    `;

    const footerHtml = `Automated notification from Man's Support Desk. Do not reply to this email.`;

    const emailHtml = renderWrapper(innerHtml, footerHtml, "New Ticket");

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
