import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import Footer from '@/components/Footer';

export const metadata = {
    title: 'Knowledge Base | Man\'s Support Desk',
    description: 'Guides, troubleshooting tips, and references to help you resolve issues and manage your assets effectively.',
};

export default function KBLayout({ children }) {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 transition-colors duration-300 flex flex-col relative">
            <LandingNav />

            {/* Main Content */}
            <main className="flex-1 w-full mx-auto pt-24 pb-12 md:pt-32 md:pb-20">
                {children}
            </main>

            <Footer />
        </div>
    );
}
