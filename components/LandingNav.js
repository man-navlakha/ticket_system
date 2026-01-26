'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
            <div className="container mx-auto px-6">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <Image
                            src="/logo_my.png"
                            alt="Man's Support Desk Logo"
                            width={32}
                            height={32}
                            className="rounded-lg"
                        />
                        <div className="text-xl font-bold tracking-tight">Man&apos;s <span className="text-gray-500">Support Desk</span></div>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                        <Link href="#workflow" className="hover:text-white transition-colors">How It Works</Link>
                        <Link href="#tech" className="hover:text-white transition-colors">Tech Stack</Link>
                    </nav>

                    {/* Desktop Auth Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/auth/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                            Log In
                        </Link>
                        <Link
                            href="/auth/register"
                            className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-gray-200"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-gray-400 hover:text-white"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Nav */}
            {isOpen && (
                <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl h-screen">
                    <nav className="flex flex-col p-6 space-y-6 text-center">
                        <Link href="#features" onClick={() => setIsOpen(false)} className="text-lg font-medium text-gray-400 hover:text-white transition-colors">Features</Link>
                        <Link href="#workflow" onClick={() => setIsOpen(false)} className="text-lg font-medium text-gray-400 hover:text-white transition-colors">How It Works</Link>
                        <Link href="#tech" onClick={() => setIsOpen(false)} className="text-lg font-medium text-gray-400 hover:text-white transition-colors">Tech Stack</Link>

                        <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
                            <Link href="/auth/login" onClick={() => setIsOpen(false)} className="text-lg font-medium text-gray-400 hover:text-white transition-colors">
                                Log In
                            </Link>
                            <Link
                                href="/auth/register"
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg bg-white px-5 py-3 text-base font-semibold text-black transition-colors hover:bg-gray-200"
                            >
                                Get Started
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
