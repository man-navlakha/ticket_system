import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { generateAccessToken, setAccessTokenCookie } from '@/lib/auth';

export async function PUT(req) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { phoneNumber } = await req.json();

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { phoneNumber }
        });

        // Reissue access token so the new phoneNumber is immediately reflected
        // without waiting for the 15-min token to expire
        const newAccessToken = generateAccessToken(updatedUser);
        await setAccessTokenCookie(newAccessToken);

        return NextResponse.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update Profile Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
