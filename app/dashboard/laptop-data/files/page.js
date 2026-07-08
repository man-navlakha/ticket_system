import { formatFullName } from '@/lib/user';
import LaptopDataShell from '../_components/LaptopDataShell';
import { getLaptopDataUser } from '../_components/auth';
import FilesClient from './FilesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Laptop File Search - Dashboard',
    description: 'Search laptop files and create retrieval requests.',
};

export default async function FilesPage() {
    const user = await getLaptopDataUser();
    const requestedBy = formatFullName(user) || user.email || user.username || 'Dashboard';

    return (
        <LaptopDataShell
            active="files"
            title="File Search"
            description="Search indexed laptop files by extension, name, or keyword and request a copy from the owning device."
            user={user}
        >
            <FilesClient requestedByDefault={requestedBy} />
        </LaptopDataShell>
    );
}
