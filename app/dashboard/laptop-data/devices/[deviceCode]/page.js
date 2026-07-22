import { formatFullName } from '@/lib/user';
import LaptopDataShell from '../../_components/LaptopDataShell';
import { getLaptopDataUser } from '../../_components/auth';
import DeviceDashboardClient from './DeviceDashboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Device Files - Dashboard',
    description: 'Browse indexed files for one laptop device.',
};

export default async function DeviceFilesPage({ params }) {
    const user = await getLaptopDataUser();
    const { deviceCode } = await params;
    const requestedBy = formatFullName(user) || user.email || user.username || 'Dashboard';

    return (
        <LaptopDataShell
            active="devices"
            title={`${deviceCode} Files`}
            description="Browse indexed files for this laptop, filter by name or extension, and request downloads from the agent."
            user={user}
        >
            <DeviceDashboardClient deviceCode={deviceCode} requestedByDefault={requestedBy} />
        </LaptopDataShell>
    );
}
