import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import UserDetailClient from "./UserDetailClient";
import { prisma } from '@/lib/prisma';

export const metadata = { title: "User Details" };

export default async function UserDetailPage({ params }) {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect("/auth/login");
    }

    if (currentUser.role === 'USER') {
        redirect("/dashboard");
    }

    const targetUser = await prisma.user.findUnique({
        where: { id },
        include: {
            tickets: { orderBy: { createdAt: 'desc' }, take: 20 },
            comments: { include: { ticket: { select: { title: true } } }, orderBy: { createdAt: 'desc' }, take: 20 },
            inventory: { orderBy: { createdAt: 'desc' }, take: 20 },
            knowledgeBaseArticles: { orderBy: { createdAt: 'desc' }, take: 20 },
            createdProposals: { orderBy: { createdAt: 'desc' }, take: 20 },
            assignedProposals: { orderBy: { createdAt: 'desc' }, take: 20 }
        }
    });

    if (!targetUser) {
        redirect("/dashboard/team");
    }

    return <UserDetailClient currentUser={currentUser} targetUser={targetUser} />;
}
