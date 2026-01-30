'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function KnowledgeBasePage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [aiMessage, setAiMessage] = useState('');
    const [isAiSearching, setIsAiSearching] = useState(false);

    // Fetch articles on load and category change
    useEffect(() => {
        fetchArticles();
    }, [categoryFilter]);

    const fetchArticles = async () => {
        setLoading(true);
        setAiMessage('');
        try {
            const params = new URLSearchParams();
            if (categoryFilter) params.append('category', categoryFilter);

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

    // AI-powered search
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
                if (data.aiMessage) {
                    setAiMessage(data.aiMessage);
                }
            } else {
                // Fallback to regular search on error
                fetchArticles();
            }
        } catch (error) {
            console.error('AI search failed:', error);
            fetchArticles();
        } finally {
            setIsAiSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setAiMessage('');
        fetchArticles();
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">📚 Knowledge Base</h1>
                    <p className="text-gray-400 text-lg">Browse solutions to common issues</p>
                </div>
                <Link
                    href="/dashboard/knowledge-base/create"
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors flex items-center gap-2"
                >
                    <span className="text-xl">+</span> Create Article
                </Link>
            </div>

            {/* Search & Filters */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-purple-400">✨</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Describe your issue or search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-purple-500 transition-all outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white transition-all outline-none appearance-none"
                    >
                        <option value="" className="bg-gray-900">All Categories</option>
                        <option value="Hardware" className="bg-gray-900">💻 Hardware</option>
                        <option value="Software" className="bg-gray-900">⚙️ Software</option>
                        <option value="Network" className="bg-gray-900">🌐 Network</option>
                        <option value="Access & Security" className="bg-gray-900">🔒 Access & Security</option>
                        <option value="Other" className="bg-gray-900">📋 Other</option>
                    </select>
                    <button
                        type="submit"
                        disabled={isAiSearching}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl px-6 py-3 font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isAiSearching ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Searching...
                            </>
                        ) : (
                            <>
                                <span>🔍</span> Search
                            </>
                        )}
                    </button>
                </form>
                <p className="text-gray-500 text-xs mt-3 flex items-center gap-1">
                    <span className="text-purple-400">✨</span> AI-powered search finds the best solutions for your issues
                </p>
            </div>

            {/* AI Message */}
            {aiMessage && (
                <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs shrink-0">
                            🤖
                        </div>
                        <p className="text-gray-300 text-sm">{aiMessage}</p>
                    </div>
                </div>
            )}

            {/* Articles Grid */}
            {loading || isAiSearching ? (
                <div className="text-center py-20">
                    <div className="inline-block w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4" />
                    <p className="text-gray-400">
                        {isAiSearching ? 'Finding best solutions...' : 'Loading articles...'}
                    </p>
                </div>
            ) : articles.length === 0 ? (
                <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center text-3xl">
                        🔍
                    </div>
                    <p className="text-gray-300 text-lg font-medium">
                        {searchQuery ? `No articles found for "${searchQuery}"` : 'No articles found'}
                    </p>
                    <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                        {searchQuery
                            ? "We don't have an article for this topic yet. Try browsing by category or create a support ticket."
                            : "Try adjusting your search or filters"}
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-6">
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                            >
                                Browse All
                            </button>
                        )}
                        <Link
                            href="/dashboard/create"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                        >
                            Create Ticket
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    {searchQuery && (
                        <div className="mb-4 text-sm text-gray-400">
                            Found <span className="text-white font-bold">{articles.length}</span> result{articles.length !== 1 ? 's' : ''}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {articles.map((article, index) => (
                            <Link
                                key={article.id}
                                href={`/dashboard/knowledge-base/${article.id}`}
                                className={`group bg-white/5 border rounded-2xl p-6 transition-all hover:scale-[1.02] ${searchQuery && index === 0
                                    ? 'border-purple-500/30 ring-1 ring-purple-500/20'
                                    : 'border-white/10 hover:border-white/20'
                                    }`}
                            >
                                {/* Best Match Badge */}
                                {searchQuery && index === 0 && (
                                    <div className="mb-3">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border border-purple-500/20">
                                            ⭐ Best Match
                                        </span>
                                    </div>
                                )}

                                {/* Category Badge */}
                                {article.category && (
                                    <div className={searchQuery && index === 0 ? '' : 'mb-3'}>
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                            {article.category.icon} {article.category.name}
                                        </span>
                                    </div>
                                )}

                                {/* Title */}
                                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2 mt-2">
                                    {article.title}
                                </h2>

                                {/* Summary */}
                                {article.summary && (
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                        {article.summary}
                                    </p>
                                )}

                                {/* Tags */}
                                {article.tags && article.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {article.tags.slice(0, 4).map((tag) => (
                                            <span
                                                key={tag.id}
                                                className="px-2 py-1 rounded-md text-xs bg-white/5 text-gray-400 border border-white/10"
                                            >
                                                #{tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-gray-500">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            👁️ {article.views || 0} views
                                        </span>
                                        {article.upvotes > 0 && (
                                            <span className="flex items-center gap-1">
                                                👍 {article.upvotes}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-blue-400 group-hover:text-white transition-colors">
                                        Read more →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
