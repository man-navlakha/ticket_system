'use client';

import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="py-12 border-t border-border bg-background relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12 relative z-10">
                {/* Top Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground font-mono">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                        <span>© {new Date().getFullYear()} Excellent&apos;s Support Desk. | <span className='text-foreground font-bold'><a href="https://man-navlakha.netlify.app/">Man Navlakha</a></span></span>
                        <div className="flex gap-6">
                            <Link href="/policies" className="hover:text-foreground transition-colors">Policies</Link>
                            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <a href="#" className="p-2 rounded-lg border border-border hover:bg-muted hover:text-foreground transition-colors">
                            {/* LinkedIn Icon */}
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                        </a>
                        <a href="#" className="p-2 rounded-lg border border-border hover:bg-muted hover:text-foreground transition-colors">
                            {/* X / Twitter Icon */}
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </a>
                        <div className="h-4 w-px bg-border mx-2"></div>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:bg-muted hover:text-foreground transition-colors group"
                        >
                            <span>Top</span>
                            <svg className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        </button>
                    </div>
                </div>

                {/* Huge Footer Text */}
                <div className="w-full flex justify-center -z-10 pt-16 md:pt-16 pb-0 md:pb-0">
                    <h1 className="text-[13vw] leading-[0.8] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#ff4d4d] via-[#a259ff] to-[#7f00ff] text-center select-none -m-24 opacity-80">
                        EXCELLENT&apos;S SUPPORT
                    </h1>
                </div>
            </div>
        </footer>
    );
}
