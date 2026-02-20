import Link from 'next/link';

export const metadata = {
    title: 'Knowledge Base | Man\'s Support Desk',
    description: 'Guides, troubleshooting tips, and references to help you resolve issues and manage your assets effectively.',
};

export default function KBLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-blue-500/30 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2 font-bold text-xl tracking-tighter">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">
                            MAN&apos;S SUPPORT
                        </span>
                        <span className="text-white/40 text-sm font-normal ml-2 hidden sm:inline-block">
                            / Knowledge Base
                        </span>
                    </Link>

                    <nav className="flex items-center gap-6 text-sm font-medium">
                        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                            Home
                        </Link>
                        <Link href="/kb" className="text-white">
                            Docs
                        </Link>
                        <Link
                            href="/dashboard"
                            className="hidden sm:inline-flex bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-colors text-xs font-semibold uppercase tracking-wider"
                        >
                            Dashboard
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-12 md:py-20 max-w-5xl">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-black py-12">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-500 text-sm">
                        &copy; {new Date().getFullYear()} Man&apos;s Support Desk. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
