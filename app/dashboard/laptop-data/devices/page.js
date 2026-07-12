import LaptopDataShell from '../_components/LaptopDataShell';
import { getLaptopDataUser } from '../_components/auth';
import DevicesClient from './DevicesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Laptop Devices - Dashboard',
    description: 'View laptop agents, online state, and agent version rollout.',
};

export default async function DevicesPage() {
    const user = await getLaptopDataUser();

    return (
        <LaptopDataShell
            active="devices"
            title="Laptop Devices"
            description="Monitor registered agent devices, online state, heartbeat, and agent version rollout."
            user={user}
        >
            <DevicesClient />
        </LaptopDataShell>
    );
}
