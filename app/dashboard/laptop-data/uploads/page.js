import LaptopDataShell from '../_components/LaptopDataShell';
import { getLaptopDataUser } from '../_components/auth';
import UploadsClient from './UploadsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Laptop Upload Control - Dashboard',
    description: 'Manage the automatic file upload policy and monitor upload records.',
};

export default async function UploadsPage() {
    const user = await getLaptopDataUser();

    return (
        <LaptopDataShell
            active="uploads"
            title="Upload Control"
            description="Configure the automatic file upload policy and monitor the latest upload activity across managed laptops."
            user={user}
        >
            <UploadsClient />
        </LaptopDataShell>
    );
}
