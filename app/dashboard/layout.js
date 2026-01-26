import ProfileCompletion from '@/components/ProfileCompletion';
import DashboardNav from '@/components/DashboardNav';
import { getCurrentUser } from '@/lib/session';

export default async function DashboardLayout({ children }) {
    const user = await getCurrentUser();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-gray-800">
            <DashboardNav user={user} />
            <ProfileCompletion user={user} />
            <main className="container mx-auto px-6 py-8 pb-24 md:pb-8">
                {children}
            </main>
        </div>
    );
}
