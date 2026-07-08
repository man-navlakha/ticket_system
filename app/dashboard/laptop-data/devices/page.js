import LaptopDataShell from '../_components/LaptopDataShell';
import { getLaptopDataUser } from '../_components/auth';
import DevicesClient from './DevicesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Laptop Devices - Dashboard',
    description: 'View online and offline laptop agents.',
};

export default async function DevicesPage() {
    const user = await getLaptopDataUser();

    return (
        <LaptopDataShell
            active="devices"
            title="Laptop Devices"
            description="Monitor registered agent devices, online state, signed-in user, and last heartbeat."
            user={user}
        >
            <DevicesClient />
        </LaptopDataShell>
    );
}
