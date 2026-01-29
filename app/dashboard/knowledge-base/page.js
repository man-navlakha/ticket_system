'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function KnowledgeBasePage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchArticles();
    }, [categoryFilter, searchQuery]);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (categoryFilter) params.append('category', categoryFilter);
            if (searchQuery) params.append('search', searchQuery);

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

    const handleSearch = (e) => {
        e.preventDefault();
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
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="md:col-span-2 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-white transition-all outline-none"
                    />
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
                </form>
            </div>

            {/* Articles Grid */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-white/80 rounded-full animate-spin mb-4" />
                    <p className="text-gray-400">Loading articles...</p>
                </div>
            ) : articles.length === 0 ? (
                <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-gray-400 text-lg">No articles found</p>
                    <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {articles.map((article) => (
                        <Link
                            key={article.id}
                            href={`/dashboard/knowledge-base/${article.id}`}
                            className="group bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all hover:scale-[1.02]"
                        >
                            {/* Category Badge */}
                            {article.category && (
                                <div className="mb-3">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                        {article.category.icon} {article.category.name}
                                    </span>
                                </div>
                            )}

                            {/* Title */}
                            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
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
                                    {article.tags.slice(0, 4).map(({ tag }) => (
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
            )}
        </div>
    );
}
