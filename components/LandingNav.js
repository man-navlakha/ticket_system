'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ThemeToggle } from './theme-toggle';
import { Menu, X } from 'lucide-react';

export default function LandingNav() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <header className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-xl transition-colors duration-300">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity">
                        <Image
                            src="/logo_my.png"
                            alt="Man's Support Desk Logo"
                            width={32}
                            height={32}
                            className="rounded-lg"
                        />
                        <div className="text-lg md:text-xl font-bold tracking-tight text-foreground">
                            Man&apos;s <span className="text-muted-foreground hidden sm:inline">Support Desk</span>
                        </div>
                    </Link>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-6">
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

                    {/* Mobile Menu Toggle button */}
                    <div className="flex md:hidden items-center gap-2 sm:gap-4">
                        <ThemeToggle />
                        <button
                            onClick={toggleMobileMenu}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                            aria-label="Toggle Menu"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Actions Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-border bg-background px-4 py-4 shadow-lg transition-all animate-in fade-in slide-in-from-top-3">
                    <div className="flex flex-col gap-4">
                        <Link
                            href="/kb"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-base font-medium text-foreground hover:text-primary transition-colors px-2 py-1"
                        >
                            Knowledge Base
                        </Link>
                        <Link
                            href="/auth/login"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-center text-sm font-medium transition-all hover:opacity-90 border border-border shadow-sm w-full mt-2"
                        >
                            Log In
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
