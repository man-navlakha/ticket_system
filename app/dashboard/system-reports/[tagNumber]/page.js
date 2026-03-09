import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import SystemReportDetailClient from './SystemReportDetailClient';

export async function generateMetadata({ params }) {
    const { tagNumber } = await params;
    return {
        title: `${tagNumber} - System Report Details`,
        description: `Detailed system report for ${tagNumber}`,
    };
}

export default async function SystemReportDetailPage({ params }) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/login');
    }

    const { tagNumber } = await params;

    return <SystemReportDetailClient user={user} tagNumber={tagNumber} />;
}
