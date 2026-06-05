import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CommonProblemsClient from './CommonProblemsClient';

export const dynamic = 'force-dynamic';
export const metadata = {
    title: 'Common Problems | Dashboard',
    description: 'Manage the predefined problem list shown on the QR report page.',
};

export default async function CommonProblemsPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/auth/login');
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') redirect('/dashboard');

    const items = await prisma.commonProblem.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return <CommonProblemsClient initialItems={items} />;
}
