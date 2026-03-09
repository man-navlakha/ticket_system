import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import TeamClient from "./TeamClient";
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = { title: "Team Management" };

export default async function TeamPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/auth/login");
    }

    if (user.role === 'USER') {
        redirect("/dashboard");
    }

    // Server-side fetching to eliminate client waterfall
    const initialUsers = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            _count: {
                select: {
                    tickets: true,
                    inventory: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const initialRequests = await prisma.accessRequest.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return <TeamClient user={user} initialUsers={initialUsers} initialRequests={initialRequests} />;
}
