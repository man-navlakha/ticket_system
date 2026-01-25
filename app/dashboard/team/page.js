import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import TeamClient from "./TeamClient";

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

    return <TeamClient user={user} />;
}
