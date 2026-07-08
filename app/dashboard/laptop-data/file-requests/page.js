import LaptopDataShell from '../_components/LaptopDataShell';
import { getLaptopDataUser } from '../_components/auth';
import FileRequestsClient from './FileRequestsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Laptop File Requests - Dashboard',
    description: 'Track and download laptop file requests.',
};

export default async function FileRequestsPage() {
    const user = await getLaptopDataUser();

    return (
        <LaptopDataShell
            active="requests"
            title="File Requests"
            description="Review request progress, completion details, errors, and download completed files."
            user={user}
        >
            <FileRequestsClient />
        </LaptopDataShell>
    );
}
