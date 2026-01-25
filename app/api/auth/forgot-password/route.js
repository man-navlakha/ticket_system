import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                email: { equals: email, mode: 'insensitive' }
            }
        });
        if (!user) {
            // Avoid revealing user existence
            return NextResponse.json({ message: 'If user exists, an email has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        // Construct reset link
        const origin = req.nextUrl.origin;
        const resetLink = `${origin}/auth/new-password?token=${resetToken}`;

        // Send the email
        await sendPasswordResetEmail(email, resetLink);

        console.log(`✅ Reset email sent to ${email}`);

        return NextResponse.json({ message: 'If user exists, an email has been sent.' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
