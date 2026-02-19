import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import HelpClient from "./HelpClient";

export const metadata = {
    title: "Help & Support Center",
    description: "Get assistance with your IT issues. Browse frequently asked questions, contact support staff, and find quick links for your workspace.",
    openGraph: {
        title: "Support Center | Man's Support Desk",
        description: "Professional IT support and assistance hub.",
    }
};

export default async function HelpPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    // Fetch Agents and Admins
    const supportStaff = await prisma.user.findMany({
        where: {
            role: { in: ['ADMIN', 'AGENT'] }
        },
        select: {
            username: true,
            email: true,
            phoneNumber: true,
            role: true
        }
    });

    return <HelpClient supportStaff={supportStaff} />;
}
