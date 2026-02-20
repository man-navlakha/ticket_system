'use client';

import LogoutButton from './LogoutButton';

import { ThemeToggle } from './theme-toggle';

export default function PageHeader({ title, children }) {
    return (
        <header className="sticky top-4 z-50 px-4 mb-8 transition-colors duration-300">
            <div className="mx-auto w-full max-w-6xl rounded-2xl border border-border bg-background/80 backdrop-blur-xl shadow-2xl">
                <div className="flex h-16 items-center justify-between px-6">
                    {/* Title / Left Content */}
                    <div className="flex items-center gap-4">
                        {title && (
                            <h1 className="text-lg font-bold tracking-tight text-foreground">{title}</h1>
                        )}
                        {children && (
                            <div className="flex items-center gap-4">
                                {children}
                            </div>
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <div className="h-6 w-[1px] bg-border hidden lg:block"></div>
                        <LogoutButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
