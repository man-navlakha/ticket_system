import Link from 'next/link';
import FloatingLines from '@/components/FloatingLines';
import { ThemeToggle } from '@/components/theme-toggle';
import ThemeLogo from '@/components/ThemeLogo';

export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/20 transition-colors duration-300 relative overflow-hidden">
            <FloatingLines />

            {/* Background Glow Orbs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ec4269]/10 dark:bg-[#D4AF37]/5 blur-[100px] rounded-full -z-10 pointer-events-none" />

            {/* Minimal top nav */}
            <header className="w-full px-6 py-5 flex items-center justify-between relative z-10">
                <Link href="/" className="flex items-center group hover:opacity-80 transition-opacity">
                    <div className="p-2 bg-background/80 backdrop-blur rounded-xl border border-border shadow-sm group-hover:border-[#ec4269]/40 dark:group-hover:border-[#D4AF37]/40 transition-colors">
                        <ThemeLogo />
                    </div>
                </Link>
                <ThemeToggle />
            </header>

            {/* Main centred card area */}
            <main className="flex-1 flex items-center justify-center px-4 py-10 relative z-10">
                <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Outer glow ring */}
                    <div className="relative group">
                        <div className="absolute -inset-[2px] rounded-[2.5rem] bg-gradient-to-br from-[#ec4269]/30 via-purple-500/10 to-blue-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        {/* Card */}
                        <div className="relative bg-card/80 backdrop-blur-xl p-6 sm:p-8 md:p-10 rounded-[2.2rem] border border-border shadow-2xl shadow-black/5">
                            {children}
                        </div>
                    </div>

                    {/* Footer links */}
                    <footer className="mt-8 text-center">
                        <div className="flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <Link href="/policies" className="hover:text-foreground transition-colors">Privacy</Link>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <Link href="/kb" className="hover:text-foreground transition-colors">Help</Link>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
