import KBSidebar from "./KBSidebar";

export default function KBLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-background">
            <KBSidebar />
            <main className="flex-1 max-w-5xl mx-auto px-6 py-8 md:px-12 md:py-12 no-scrollbar overflow-y-auto h-[calc(100vh-64px)]">
                {children}
            </main>
        </div>
    );
}
