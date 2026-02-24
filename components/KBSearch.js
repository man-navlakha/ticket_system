'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';

export default function KBSearch({ defaultValue = '' }) {
    const [query, setQuery] = useState(defaultValue);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);
    const router = useRouter();

    // Keyboard shortcut: Cmd/Ctrl+K to focus
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === 'Escape' && document.activeElement === inputRef.current) {
                inputRef.current?.blur();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        const params = new URLSearchParams();
        if (query.trim()) params.set('search', query.trim());
        router.push(`/kb?${params.toString()}`);
        setTimeout(() => setIsLoading(false), 600);
    };

    const handleClear = () => {
        setQuery('');
        inputRef.current?.focus();
        router.push('/kb');
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-10">
            <form onSubmit={handleSubmit} className="relative group">
                {/* Glowing border effect */}
                <div
                    className={`absolute -inset-[2px] rounded-2xl blur-sm transition-all duration-500 ${isFocused
                        ? 'bg-gradient-to-r from-[#C5A059] via-purple-500 to-blue-500 opacity-60'
                        : 'bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-20'
                        }`}
                />

                {/* Input container */}
                <div
                    className={`relative flex items-center bg-background rounded-2xl border transition-all duration-300 shadow-lg `}
                >
                    {/* Search icon */}
                    <div className="pl-4 pr-3 flex-shrink-0">
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 text-[#C5A059] dark:text-[#D4AF37] animate-spin" />
                        ) : (
                            <Search
                                className={`w-5 h-5 transition-colors duration-200 ${isFocused ? 'text-[#C5A059] dark:text-[#D4AF37]' : 'text-muted-foreground'
                                    }`}
                            />
                        )}
                    </div>

                    {/* Input */}
                    <input
                        ref={inputRef}
                        type="text"
                        name="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Search articles, guides, troubleshooting..."
                        className="flex-1 bg-transparent py-4 text-foreground placeholder:text-muted-foreground text-base"
                        style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                        autoComplete="off"
                    />

                    {/* Right side: clear button or keyboard shortcut */}
                    <div className="pr-3 flex items-center gap-2 flex-shrink-0">
                        {query ? (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        ) : (
                            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-muted text-[10px] text-muted-foreground font-mono select-none">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-5 py-2.5 bg-[#C5A059] dark:bg-[#D4AF37] text-white dark:text-zinc-900 rounded-xl text-sm font-semibold hover:opacity-90 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 shadow-sm shadow-[#C5A059]/30 dark:shadow-[#D4AF37]/30"
                        >
                            Search
                        </button>
                    </div>
                </div>
            </form>

            {/* Active search indicator */}
            {defaultValue && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2">
                    <span>Showing results for</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#C5A059]/10 dark:bg-[#D4AF37]/10 text-[#C5A059] dark:text-[#D4AF37] border border-[#C5A059]/20 dark:border-[#D4AF37]/20 font-medium text-xs">
                        &quot;{defaultValue}&quot;
                    </span>
                    <button
                        onClick={handleClear}
                        className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 text-xs"
                    >
                        Clear
                    </button>
                </div>
            )}
        </div>
    );
}
