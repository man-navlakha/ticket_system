import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import SystemReportsClient from './SystemReportsClient';

export const metadata = {
    title: 'System Reports - Dashboard',
    description: 'View auto-generated system report configurations',
};

export default async function SystemReportsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/login');
    }

    return <SystemReportsClient user={user} />;
}
