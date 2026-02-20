'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function KBContent() {
    const searchParams = useSearchParams();
    const categoryFilter = searchParams.get('category') || 'all';

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [aiMessage, setAiMessage] = useState('');
    const [isAiSearching, setIsAiSearching] = useState(false);

    useEffect(() => {
        fetchArticles();
    }, [categoryFilter]);

    const fetchArticles = async () => {
        setLoading(true);
        setAiMessage('');
        try {
            const params = new URLSearchParams();
            if (categoryFilter !== 'all') params.append('category', categoryFilter);

            const res = await fetch(`/api/kb?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setArticles(data.articles);
            }
        } catch (error) {
            console.error('Failed to fetch articles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            fetchArticles();
            return;
        }

        setIsAiSearching(true);
        setAiMessage('');

        try {
            const res = await fetch('/api/kb/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery }),
            });

            const data = await res.json();
            if (res.ok) {
                setArticles(data.articles || []);
                if (data.aiMessage) setAiMessage(data.aiMessage);
            } else {
                fetchArticles();
            }
        } catch (error) {
            console.error('AI search failed:', error);
            fetchArticles();
        } finally {
            setIsAiSearching(false);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Minimal Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
                    <span>/</span>
                    <span className="text-foreground">Knowledge Base</span>
                    {categoryFilter !== 'all' && (
                        <>
                            <span>/</span>
                            <span className="text-blue-500">{categoryFilter}</span>
                        </>
                    )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                    {categoryFilter === 'all' ? 'Documentation' : categoryFilter}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                    Guides, troubleshooting tips, and references to help you resolve issues and manage your assets effectively.
                </p>
            </div>

            {/* Tight Search */}
            <form onSubmit={handleSearch} className="relative group max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-input/50 border border-input rounded-xl py-3 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-0 transition-all font-medium"
                />
                {isAiSearching && (
                    <div className="absolute right-4 top-3.5">
                        <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
                    </div>
                )}
            </form>

            {/* AI Message */}
            {aiMessage && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 flex items-start gap-4">
                    <div className="text-blue-500 text-xl shrink-0">✨</div>
                    <div className="text-sm text-foreground leading-relaxed font-medium">
                        <span className="text-blue-500 block mb-1 uppercase text-[10px] font-bold tracking-tighter">AI Summary</span>
                        {aiMessage}
                    </div>
                </div>
            )}

            {/* Articles List (Dense) */}
            <div className="space-y-12">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-muted/20 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : articles.length === 0 ? (
                    <div className="text-center py-20 border border-border rounded-2xl bg-card">
                        <p className="text-muted-foreground font-medium">No results found for your query.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {articles.map((article) => (
                            <Link
                                key={article.id}
                                href={`/dashboard/knowledge-base/${article.id}`}
                                className="group p-5 rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-border/80 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                                        {article.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                                        {article.summary || article.content?.substring(0, 120) + '...'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 mt-auto">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                        {article.category?.name || 'General'}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        {new Date(article.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer / Create */}
            <div className="pt-12 border-t border-border">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
                    <div>
                        <h4 className="text-foreground font-bold text-lg mb-1">Didn't find what you need?</h4>
                        <p className="text-sm text-muted-foreground">Collaborate with our community or request a new article.</p>
                    </div>
                    <Link href="/dashboard/knowledge-base/create" className="px-6 py-2.5 bg-foreground text-background rounded-lg text-sm font-bold shadow-lg hover:bg-foreground/90 transition-colors whitespace-nowrap">
                        New Article
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Note: Metadata moved to a separate file or handled by layout since this is 'use client'
export default function KnowledgeBasePage() {
    return (
        <Suspense fallback={<div className="animate-pulse h-screen bg-black" />}>
            <KBContent />
        </Suspense>
    );
}
