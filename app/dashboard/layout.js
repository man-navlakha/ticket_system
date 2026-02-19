import ProfileCompletion from '@/components/ProfileCompletion';
import DashboardNav from '@/components/DashboardNav';
import Sidebar from '@/components/Sidebar';
import { getCurrentUser } from '@/lib/session';

export default async function DashboardLayout({ children }) {
    const user = await getCurrentUser();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-gray-800">
            <ProfileCompletion user={user} />
            <div className="flex">
                <Sidebar user={user} />
                <div className="flex-1 flex flex-col min-w-0">
                    <main className="container mx-auto px-6 py-8 pb-24 md:pb-8 max-w-7xl">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
