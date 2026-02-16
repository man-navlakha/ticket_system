'use client';

import LogoutButton from './LogoutButton';

export default function PageHeader({ title, children }) {
    return (
        <header className="sticky top-4 z-50 px-4 mb-8">
            <div className="mx-auto w-full max-w-6xl rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl">
                <div className="flex h-16 items-center justify-between px-6">
                    {/* Title / Left Content */}
                    <div className="flex items-center gap-4">
                        {title && (
                            <h1 className="text-lg font-bold tracking-tight text-white">{title}</h1>
                        )}
                        {children && (
                            <div className="flex items-center gap-4">
                                {children}
                            </div>
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <div className="h-6 w-[1px] bg-white/10 hidden lg:block"></div>
                        <LogoutButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
