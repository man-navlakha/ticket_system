import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
    const user = await getCurrentUser();
    if (!user) redirect('/auth/login');

    const profile = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            inventory: true,
            tickets: {
                orderBy: { createdAt: 'desc' },
                take: 5
            }
        }
    });

    return <ProfileClient user={profile} />;
}
