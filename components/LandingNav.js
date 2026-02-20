'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function LandingNav() {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
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
                        <div className="text-xl font-bold tracking-tight">Man&apos;s <span className="text-gray-500">Support Desk</span></div>
                    </Link>

                    {/* Auth Button */}
                    <div className="flex items-center gap-6">
                        <Link href="/kb" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                            Knowledge Base
                        </Link>
                        <Link
                            href="/auth/login"
                            className="rounded-full bg-white/10 px-6 py-2 text-sm font-medium text-white transition-all hover:bg-white hover:text-black border border-white/10"
                        >
                            Log In
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
