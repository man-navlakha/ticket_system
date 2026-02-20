import Link from 'next/link';
import { prisma } from '@/lib/prisma'; // Use Prisma directly for Server Component performance

export const dynamic = 'force-dynamic'; // Ensure fresh content on each request if needed, or revalidate

async function getArticles(searchParams) {
    const { category, search } = await searchParams;

    const where = {
        published: true,
        ...(category && { category: { name: category } }),
        ...(search && {
            OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { summary: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ],
        }),
    };

    const articles = await prisma.knowledgeBaseArticle.findMany({
        where,
        include: {
            category: true,
            tags: {
                include: {
                    tag: true,
                },
            },
        },
        orderBy: [
            { views: 'desc' }, // Popular first
            { createdAt: 'desc' },
        ],
    });

    return articles;
}

async function getCategories() {
    // Get categories that have at least one published article
    const categories = await prisma.category.findMany({
        where: {
            knowledgeBaseArticles: {
                some: {
                    published: true
                }
            }
        },
        include: {
            _count: {
                select: { knowledgeBaseArticles: { where: { published: true } } }
            }
        }
    });
    return categories;
}

export default async function KnowledgeBasePage({ searchParams }) {
    const articles = await getArticles(searchParams);
    const categories = await getCategories();
    const { category: currentCategory, search: currentSearch } = await searchParams;

    return (
        <div className="space-y-16 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 pb-2">
                    How can we help you?
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed">
                    Search our knowledge base for answers to common questions and technical guides.
                </p>

                {/* Search Form */}
                <form action="/kb" className="relative max-w-xl mx-auto mt-8 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-white/30 focus-within:bg-black transition-all shadow-lg backdrop-blur-sm">
                        <input
                            type="text"
                            name="search"
                            placeholder="Search documentation..."
                            defaultValue={currentSearch || ''}
                            className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none text-lg"
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-colors shadow-lg shadow-white/5"
                        >
                            Search
                        </button>
                    </div>
                    {currentSearch && (
                        <div className="mt-2 text-sm text-gray-500">
                            Searching for &quot;<span className="text-white">{currentSearch}</span>&quot;
                            <Link href="/kb" className="ml-2 text-blue-400 hover:text-blue-300 underline">Clear</Link>
                        </div>
                    )}
                </form>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap justify-center gap-3">
                <Link
                    href="/kb"
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!currentCategory ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'}`}
                >
                    All
                </Link>
                {categories.map((cat) => (
                    <Link
                        key={cat.id}
                        href={`/kb?category=${cat.name}`}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${currentCategory === cat.name ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'}`}
                    >
                        {cat.name} <span className="ml-1 opacity-50 text-xs">({cat._count.knowledgeBaseArticles})</span>
                    </Link>
                ))}
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.length === 0 ? (
                    <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                        <p className="text-gray-500 text-lg">No articles found matching your criteria.</p>
                        <Link href="/kb" className="mt-4 inline-block text-blue-400 hover:text-blue-300 underline">View all articles</Link>
                    </div>
                ) : (
                    articles.map((article) => (
                        <Link
                            key={article.id}
                            href={`/kb/${article.id}`}
                            className="group flex flex-col justify-between p-6 rounded-2xl border border-white/10 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-white/20 transition-all hover:-translate-y-1 shadow-lg shadow-black/20"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        {article.category?.name || 'General'}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {new Date(article.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                                    {article.title}
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 mb-6">
                                    {article.summary || article.content?.substring(0, 150) + '...'}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
                                {article.tags.slice(0, 3).map((t) => (
                                    <span key={t.tag.id} className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                                        #{t.tag.name}
                                    </span>
                                ))}
                                {article.tags.length > 3 && (
                                    <span className="text-[10px] text-gray-500">+ {article.tags.length - 3}</span>
                                )}
                                <span className="ml-auto text-xs text-gray-500 group-hover:text-white transition-colors flex items-center gap-1">
                                    Read <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </span>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* CTA */}
            <div className="mt-20 p-8 md:p-12 rounded-3xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full poiner-events-none" />
                <div className="relative z-10 space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-white">Still need help?</h2>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        If you couldn't find the answer you were looking for, our support team is ready to assist you.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/dashboard/tickets/create" className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-lg shadow-white/5">
                            Open a Ticket
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
