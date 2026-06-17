/**
 * Send a test email using the configured Gmail SMTP credentials.
 *
 * Usage:
 *   node scripts/test-email.js [to@example.com]
 *
 * If no recipient is passed, falls back to GMAIL_USER (sends to self).
 */
require('dotenv').config();
const nodemailer = require('nodemailer');

const to = process.argv[2] || process.env.GMAIL_USER;

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('❌ GMAIL_USER or GMAIL_APP_PASSWORD missing in .env');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

const LOGO_URL = 'https://man-support.vercel.app/_next/image?url=%2FEP_Logo_fav.png&w=64&q=75';
const SIGNATURE = 'Designed By Man Navlakha ( IT Support )';

const body = `Hi,

This is a test email from the Excellent IT ticket system.

If you can read this in your inbox (not spam), the new Gmail SMTP setup is working correctly.

Sent: ${new Date().toISOString()}
From: ${process.env.GMAIL_USER}
To:   ${to}`;

const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#111;background:#fff;">
<img src="${LOGO_URL}" alt="Excellent Publicity" height="28" style="display:block;height:28px;width:auto;border:0;margin-bottom:24px;">
<div>${body.replace(/\n/g, '<br>')}</div>
<p style="margin-top:32px;color:#666;font-size:13px;">${SIGNATURE}</p>
</body></html>`;

(async () => {
    try {
        console.log(`📤 Verifying SMTP connection to smtp.gmail.com:465 ...`);
        await transporter.verify();
        console.log('✅ SMTP connection OK');

        console.log(`📤 Sending test email to ${to} ...`);
        const info = await transporter.sendMail({
            from: `"Excellent IT" <${process.env.GMAIL_USER}>`,
            to,
            subject: 'Test email — Excellent IT',
            text: `${body}\n\n--\n${SIGNATURE}`,
            html,
        });
        console.log('✅ Sent. messageId:', info.messageId);
        console.log('   response:', info.response);
    } catch (err) {
        console.error('❌ Failed to send test email:', err.message);
        if (err.code) console.error('   code:', err.code);
        if (err.response) console.error('   response:', err.response);
        process.exit(1);
    }
})();
