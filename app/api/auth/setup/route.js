import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(req) {
    try {
        const { token, username, phoneNumber, password } = await req.json();

        if (!token || !password || !username) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Find User by Token
        const user = await prisma.user.findUnique({
            where: { inviteToken: token }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired invitation token.' }, { status: 400 });
        }

        // 2. Check Expiration
        if (user.inviteExpires && new Date() > user.inviteExpires) {
            return NextResponse.json({ error: 'Invitation has expired.' }, { status: 400 });
        }

        // 3. Update User
        const hashedPassword = await hashPassword(password);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                username,
                phoneNumber, // Add phone number
                password: hashedPassword,
                inviteToken: null,
                inviteExpires: null,
                status: 'ACTIVE'
            }
        });

        return NextResponse.json({ message: 'Account set up successfully. Please log in.' });

    } catch (error) {
        console.error('Account Setup Error:', error);
        if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
            return NextResponse.json({ error: 'This username is already taken. Please choose another one.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
