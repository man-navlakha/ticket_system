import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TicketsClient from "./TicketsClient";

export const dynamic = 'force-dynamic';
export const metadata = {
    title: "All Tickets | Dashboard",
    description: "Manage and track all support tickets across the platform.",
};

export default async function TicketsPage({ searchParams }) {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    const { search, status, priority, filter } = await searchParams || {};

    // Base where clause based on role
    let where = user.role === 'USER' ? { userId: user.id } : {};

    // apply filters from searchParams
    const filters = [];
    if (where.userId) filters.push({ userId: where.userId });

    if (filter === 'assigned') {
        filters.push({ userId: user.id });
    }

    if (search) {
        filters.push({
            OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { id: { contains: search, mode: 'insensitive' } },
            ]
        });
    }

    if (status && status !== 'ALL') {
        filters.push({ status });
    }

    if (priority && priority !== 'ALL') {
        filters.push({ priority });
    }

    const finalWhere = filters.length > 0 ? { AND: filters } : {};

    const tickets = await prisma.ticket.findMany({
        where: finalWhere,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { username: true, email: true } },
            category: true,
            _count: {
                select: { comments: true }
            }
        }
    });

    return <TicketsClient user={user} tickets={tickets} />;
}
