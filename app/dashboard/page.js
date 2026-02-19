import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/stats";
import DashboardClient from "./DashboardClient";

export const dynamic = 'force-dynamic';
export const metadata = {
    title: "Workspace Overview | Dashboard",
    description: "Your personalized IT support dashboard. Track active tickets, view performance stats, and manage recent activity.",
    openGraph: {
        title: "Workspace Overview | Man's Support Desk",
        description: "Executive dashboard for enterprise IT management.",
    }
};

export default async function DashboardPage({ searchParams }) {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    const { search } = await searchParams || {};

    // Base where clause based on role
    let where = user.role === 'USER' ? { userId: user.id } : {};

    // Add search filter if present
    if (search) {
        where = {
            AND: [
                where,
                {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                        { id: { contains: search, mode: 'insensitive' } },
                    ]
                }
            ]
        };
    }

    const tickets = await prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { comments: true }
            }
        },
        take: 20 // Performance limit
    });

    let stats = {
        total: 0,
        inProgress: 0,
        resolved: 0
    };

    if (user.role === 'ADMIN' || user.role === 'AGENT') {
        const statsData = await getDashboardStats();
        if (statsData?.tickets?.byStatus) {
            stats.total = statsData.tickets.byStatus.reduce((acc, curr) => acc + curr.value, 0);
            stats.inProgress = statsData.tickets.byStatus.find(s => s.name === 'IN_PROGRESS')?.value || 0;
            stats.resolved = statsData.tickets.byStatus.find(s => s.name === 'RESOLVED' || s.name === 'CLOSED')?.value || 0;
        }
    } else {
        stats.total = tickets.length;
        stats.inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length;
        stats.resolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    }

    return <DashboardClient user={user} tickets={tickets} stats={stats} />;
}
