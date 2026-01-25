import nodemailer from 'nodemailer';

// Create Zoho Mail transporter with alternative configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.in', // India region for .zohomail.in
    port: 587, // Use 587 with STARTTLS instead of 465
    secure: false, // false for port 587, true for 465
    auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_PASSWORD,
    },
    tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    }
});

/**
 * Send an invitation email to a new user
 * @param {string} toEmail - Recipient email address
 * @param {string} inviteLink - The setup link with token
 * @param {string} role - User's assigned role
 */
export async function sendInviteEmail(toEmail, inviteLink, role = 'USER') {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            background-color: #000000; 
            color: #ffffff; 
            margin: 0; 
            padding: 0; 
        }
        .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: #000000; 
            border: 1px solid #333333; 
            border-radius: 8px; 
        }
        .header { 
            padding: 32px; 
            border-bottom: 1px solid #333333; 
        }
        .content { 
            padding: 32px; 
        }
        .button { 
            display: inline-block; 
            background: #ffffff; 
            color: #000000; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600; 
            margin: 20px 0;
        }
        .footer { 
            padding: 24px 32px; 
            border-top: 1px solid #333333; 
            color: #666666; 
            font-size: 14px; 
        }
        .role-badge {
            display: inline-block;
            background: #1a1a1a;
            color: #888888;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Man's <span style="color: #666666;">Ticket System</span></h1>
        </div>
        <div class="content">
            <h2 style="margin: 0 0 16px 0; font-size: 20px;">You've been invited to join the team</h2>
            <p style="color: #cccccc; line-height: 1.6;">
                You've been invited to join Man's Ticket System as a <span class="role-badge">${role}</span>.
            </p>
            <p style="color: #cccccc; line-height: 1.6;">
                Click the button below to set up your account and get started:
            </p>
            <a href="${inviteLink}" class="button">Complete Account Setup</a>
            <p style="color: #888888; font-size: 14px; margin-top: 24px;">
                Or copy and paste this link into your browser:<br>
                <code style="background: #1a1a1a; padding: 8px 12px; display: inline-block; margin-top: 8px; border-radius: 4px; color: #ffffff; word-break: break-all;">${inviteLink}</code>
            </p>
            <p style="color: #888888; font-size: 14px; margin-top: 24px;">
                This invitation will expire in 24 hours.
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0;">
                This is an automated message. If you didn't expect this invitation, please ignore this email.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();

    const emailText = `
You've been invited to join Man's Ticket System

You've been invited to join as a ${role}.

Click the link below to set up your account:
${inviteLink}

This invitation will expire in 24 hours.

If you didn't expect this invitation, please ignore this email.
    `.trim();

    const mailOptions = {
        from: `"Man's Ticket System" <${process.env.ZOHO_EMAIL}>`,
        to: toEmail,
        subject: '🎟️ You\'ve been invited to Man\'s Ticket System',
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
 * @param {string} toEmail - Recipient email address
 * @param {string} resetLink - The reset link with token
 */
export async function sendPasswordResetEmail(toEmail, resetLink) {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            background-color: #000000; 
            color: #ffffff; 
            margin: 0; 
            padding: 0; 
        }
        .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: #000000; 
            border: 1px solid #333333; 
            border-radius: 8px; 
        }
        .header { 
            padding: 32px; 
            border-bottom: 1px solid #333333; 
        }
        .content { 
            padding: 32px; 
        }
        .button { 
            display: inline-block; 
            background: #ffffff; 
            color: #000000; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600; 
            margin: 20px 0;
        }
        .footer { 
            padding: 24px 32px; 
            border-top: 1px solid #333333; 
            color: #666666; 
            font-size: 14px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Man's <span style="color: #666666;">Ticket System</span></h1>
        </div>
        <div class="content">
            <h2 style="margin: 0 0 16px 0; font-size: 20px;">Reset your password</h2>
            <p style="color: #cccccc; line-height: 1.6;">
                We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
            </p>
            <p style="color: #cccccc; line-height: 1.6;">
                Click the button below to set a new password:
            </p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p style="color: #888888; font-size: 14px; margin-top: 24px;">
                Or copy and paste this link into your browser:<br>
                <code style="background: #1a1a1a; padding: 8px 12px; display: inline-block; margin-top: 8px; border-radius: 4px; color: #ffffff; word-break: break-all;">${resetLink}</code>
            </p>
            <p style="color: #888888; font-size: 14px; margin-top: 24px;">
                This link will expire in 1 hour.
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0;">
                This is an automated message. If you didn't request a password reset, please ignore this email.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();

    const emailText = `
Reset your password - Man's Ticket System

We received a request to reset your password.

Click the link below to set a new password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.
    `.trim();

    const mailOptions = {
        from: `"Man's Ticket System" <${process.env.ZOHO_EMAIL}>`,
        to: toEmail,
        subject: '🔐 Reset your password - Man\'s Ticket System',
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
 * @param {string} toEmail - Agent email address
 * @param {object} ticketData - Details of the created ticket
 */
export async function sendNewTicketNotification(toEmail, ticketData) {
    const { id, title, description, priority, userEmail, userName } = ticketData;
    const ticketLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/${id}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background-color: #000; color: #fff; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; border: 1px solid #333; border-radius: 12px; overflow: hidden; }
        .header { background: #111; padding: 20px; border-bottom: 1px solid #333; }
        .content { padding: 30px; line-height: 1.6; }
        .footer { padding: 20px; background: #080808; font-size: 12px; color: #555; border-top: 1px solid #333; }
        .priority { padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; }
        .priority-HIGH { background: #f003; color: #ff4d4d; border: 1px solid #f005; }
        .priority-MEDIUM { background: #00f3; color: #4d4dff; border: 1px solid #00f5; }
        .priority-LOW { background: #5553; color: #888; border: 1px solid #5555; }
        .button { display: inline-block; background: #fff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin:0">New Ticket Reported</h2>
        </div>
        <div class="content">
            <p>A new support ticket has been created and requires attention.</p>
            <div style="background: #ffffff08; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin-top:0"><strong>Subject:</strong> ${title}</p>
                <p><strong>Priority:</strong> <span class="priority priority-${priority}">${priority}</span></p>
                <p><strong>User:</strong> ${userName} (${userEmail})</p>
                <p style="margin-bottom:0"><strong>Description:</strong><br>${description}</p>
            </div>
            <a href="${ticketLink}" class="button">View Ticket Details</a>
        </div>
        <div class="footer">
            Track ID: ${id} • Automated notification from Man's Ticket System
        </div>
    </div>
</body>
</html>
    `.trim();

    const mailOptions = {
        from: `"Ticket System Notifications" <${process.env.ZOHO_EMAIL}>`,
        to: toEmail,
        subject: `🚨 New Ticket: ${title} (${priority})`,
        html: emailHtml,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`❌ Failed to notify agent ${toEmail}:`, error);
    }
}
