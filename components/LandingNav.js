'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

export default function LandingNav() {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-xl transition-colors duration-300">
            <div className="container mx-auto px-6">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Image
                            src="/logo_my.png"
                            alt="Man's Support Desk Logo"
                            width={32}
                            height={32}
                            className="rounded-lg"
                        />
                        <div className="text-xl font-bold tracking-tight text-foreground">Man&apos;s <span className="text-muted-foreground">Support Desk</span></div>
                    </Link>

                    {/* Auth Button */}
                    <div className="flex items-center gap-6">
                        <ThemeToggle />
                        <Link href="/kb" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Knowledge Base
                        </Link>
                        <Link
                            href="/auth/login"
                            className="rounded-full bg-primary text-primary-foreground px-6 py-2 text-sm font-medium transition-all hover:opacity-90 border border-border shadow-sm"
                        >
                            Log In
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
