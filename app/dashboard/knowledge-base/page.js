'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CATEGORIES = [
    { id: 'all', label: 'All Posts' },
    { id: 'Hardware', label: 'Hardware' },
    { id: 'Software', label: 'Software' },
    { id: 'Network', label: 'Network' },
    { id: 'Access & Security', label: 'Security' },
    { id: 'Other', label: 'Other' }
];

export default function KnowledgeBasePage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
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
        <div className="min-h-screen rounded-xl bg-[#0B0E14] text-white p-6 md:p-12 font-sans mb-20 md:mb-0">
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Hero Section */}
                <div className="relative py-16 md:py-24 px-6 md:px-12 bg-gradient-to-br from-[#1c222e] to-[#0B0E14] rounded-3xl border border-white/5 overflow-hidden text-center shadow-2xl">
                    <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <span>🚀 Knowledge Hub</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white leading-tight">
                            How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-normal">help</span> you today?
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Search our extensive knowledge base for guides, troubleshooting tips, and answers to common questions.
                        </p>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mt-10 group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                            <div className="relative flex items-center bg-[#0B0E14] border border-white/10 rounded-full p-2 shadow-2xl transition-all focus-within:border-blue-500/50">
                                <div className="pl-5 text-gray-400">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Describe your issue..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent border-none text-white placeholder:text-gray-500 focus:ring-0 px-4 py-3 text-lg"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || isAiSearching}
                                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 py-3 font-bold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-blue-600/20"
                                >
                                    {isAiSearching ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 sticky top-4 z-40 bg-[#0B0E14]/80 backdrop-blur-xl py-4 -mx-4 px-4 md:mx-0 md:px-0 md:static md:bg-transparent md:backdrop-blur-none">
                    {/* Category Pills */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto mask-linear-fade pr-4">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setCategoryFilter(cat.id)}
                                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${categoryFilter === cat.id
                                    ? 'bg-white text-black border-white shadow-lg scale-105'
                                    : 'bg-[#141820] text-gray-400 border-white/5 hover:bg-white/5 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <Link
                        href="/dashboard/knowledge-base/create"
                        className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-[#141820] hover:bg-white/5 border border-white/10 rounded-full text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 whitespace-nowrap group"
                    >
                        <span className="group-hover:rotate-12 transition-transform">✍️</span>
                        <span>Write Article</span>
                    </Link>
                </div>

                {/* AI Insight Message */}
                {aiMessage && (
                    <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-2xl p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="p-3 bg-purple-500/10 rounded-full text-purple-400 text-xl border border-purple-500/20 shrink-0">✨</div>
                        <div>
                            <h3 className="text-purple-300 font-bold text-sm uppercase tracking-wider mb-2">AI Insight</h3>
                            <p className="text-gray-300 leading-relaxed text-sm md:text-base">{aiMessage}</p>
                        </div>
                    </div>
                )}

                {/* Articles Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-[#141820] rounded-3xl h-96 animate-pulse" />
                        ))}
                    </div>
                ) : articles.length === 0 ? (
                    <div className="text-center py-24 bg-[#141820] rounded-3xl border border-white/5">
                        <div className="text-6xl mb-6 opacity-20 grayscale">🔍</div>
                        <h3 className="text-2xl font-bold text-white mb-2">No articles found</h3>
                        <p className="text-gray-400 max-w-md mx-auto">We couldn't find any articles matching your search. Try different keywords or browse by category.</p>
                        <button onClick={() => { setSearchQuery(''); setCategoryFilter('all'); fetchArticles(); }} className="mt-8 text-blue-400 font-bold hover:underline">Clear Search & Filters</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
                        {articles.map((article, idx) => {
                            // First article is featured if no search query
                            const isFeatured = idx === 0 && !searchQuery && categoryFilter === 'all';
                            const categoryName = article.category?.name || 'General';

                            return (
                                <Link
                                    key={article.id}
                                    href={`/dashboard/knowledge-base/${article.id}`}
                                    className={`group flex flex-col bg-[#141820] border border-white/5 hover:border-white/10 rounded-3xl overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 ${isFeatured ? 'md:col-span-2 lg:col-span-2 relative min-h-[400px]' : 'min-h-[320px]'
                                        }`}
                                >
                                    {/* Abstract Visual Cover */}
                                    <div className={`relative overflow-hidden bg-[#0F1218] ${isFeatured ? 'h-full md:absolute md:inset-y-0 md:right-0 md:w-1/2' : 'h-48 shrink-0'}`}>
                                        <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-700 ${categoryName === 'Hardware' ? 'from-blue-600/20 to-cyan-600/10' :
                                            categoryName === 'Software' ? 'from-purple-600/20 to-pink-600/10' :
                                                categoryName === 'Network' ? 'from-green-600/20 to-emerald-600/10' :
                                                    'from-gray-600/20 to-slate-600/10'
                                            }`} />

                                        {/* Stylized Category Icon/Text */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-10 font-black text-6xl md:text-8xl select-none text-white tracking-tighter uppercase overflow-hidden">
                                            {categoryName.substring(0, 2)}
                                        </div>

                                        {/* Gradient Overlay */}
                                        <div className={`absolute inset-0 bg-gradient-to-t from-[#141820] via-transparent to-transparent opacity-80 ${isFeatured ? 'md:bg-gradient-to-l' : ''}`} />
                                    </div>

                                    {/* Content Container */}
                                    <div className={`flex flex-col flex-1 p-8 relative z-10 ${isFeatured ? 'md:w-1/2 md:py-12 md:pr-12 justify-center' : ''}`}>
                                        {/* Meta Header */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${categoryName === 'Hardware' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                categoryName === 'Software' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                }`}>
                                                {categoryName}
                                            </span>
                                            <span className="text-xs text-gray-500 font-mono">
                                                {new Date(article.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>

                                        {/* Title & Description */}
                                        <h2 className={`font-bold text-white mb-4 leading-tight group-hover:text-blue-400 transition-colors ${isFeatured ? 'text-3xl md:text-4xl' : 'text-xl'
                                            }`}>
                                            {article.title}
                                        </h2>

                                        <p className="text-gray-400 leading-relaxed mb-6 line-clamp-3 text-sm md:text-base">
                                            {article.summary || article.content?.substring(0, 150) + '...'}
                                        </p>

                                        {/* Footer / Author */}
                                        <div className={`mt-auto flex items-center justify-between pt-6 border-t border-white/5 ${isFeatured ? 'md:border-none md:pt-2' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                                                    {article.author?.username?.[0] || 'A'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-white">
                                                        {article.author?.username || 'Admin'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">Author</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                                <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded">
                                                    👁️ {article.views || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Mobile Floating Action Button for Create */}
                <Link
                    href="/dashboard/knowledge-base/create"
                    className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center z-50 hover:scale-105 active:scale-95 transition-transform"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}
