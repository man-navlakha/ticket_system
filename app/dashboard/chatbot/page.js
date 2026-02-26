import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import ChatbotClient from "./ChatbotClient";

export const metadata = {
    title: "AI Support Bot | Man's Support Desk",
    description: "Get instant answers to your IT problems with our AI Assistant powered by Gemini.",
};

export default async function ChatbotPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/auth/login");
    }

    return <ChatbotClient user={user} />;
}
