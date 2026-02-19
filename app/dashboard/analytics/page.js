import { getCurrentUser } from "@/lib/session";
import { getDashboardStats } from "@/lib/stats";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = 'force-dynamic';
export const metadata = {
    title: "Analytics & System Health",
    description: "View real-time system metrics, asset distribution charts, and team performance analytics for your IT workspace.",
    openGraph: {
        title: "Analytics & System Health | Man's Support Desk",
        description: "Visualize your entire IT infrastructure performance in one place.",
    }
};

export default async function AnalyticsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    // Restrict analytics to Admin/Agent if preferred, but for now we'll allow visibility
    // If you want to restrict: if (user.role === 'USER') redirect("/dashboard");

    const stats = await getDashboardStats();

    return (
        <div className="min-h-screen bg-black text-white px-6 md:px-12 py-12">
            <div className="max-w-7xl mx-auto">
                <AnalyticsClient stats={stats} />
            </div>
        </div>
    );
}
