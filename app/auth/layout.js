import Image from 'next/image';

export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6 selection:bg-primary/10 no-scrollbar relative overflow-hidden transition-colors duration-300">
            {/* Background Orbs / Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/5 blur-[100px] rounded-full -z-10" />

            <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="flex justify-center mb-10">
                    <div className="p-4 bg-background/50 backdrop-blur-xl rounded-[24px] border border-border shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Image
                            src="/logo_my.png"
                            alt="Logo"
                            width={44}
                            height={44}
                            className="relative z-10"
                            priority
                        />
                    </div>
                </div>

                <div className="p-1 rounded-[2.5rem] bg-muted/20 border border-border/50 backdrop-blur-sm shadow-xl">
                    <div className="bg-card/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.2rem] border border-border">
                        {children}
                    </div>
                </div>

                <footer className="mt-12 text-center">
                    <div className="flex items-center justify-center space-x-6 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <a href="#" className="hover:text-foreground transition-colors">Security</a>
                    </div>
                </footer>
            </div>
        </div>
    );
}
