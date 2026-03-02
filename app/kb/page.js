import Link from 'next/link';
import { prisma } from '@/lib/prisma'; // Use Prisma directly for Server Component performance
import FloatingLines from '@/components/FloatingLines';
import KBSearch from '@/components/KBSearch';

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
        <div className="space-y-10 md:space-y-16 animate-in fade-in duration-500 relative px-4 sm:px-6 lg:px-0">
            <FloatingLines />
            {/* Background Gradient Spot */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-blue-500/10 dark:bg-blue-500/20 blur-[100px] rounded-full pointer-events-none -z-10" />

            {/* Hero Section */}
            <div className="text-center space-y-5 md:space-y-8 max-w-4xl mx-auto relative z-10 pt-2 md:pt-4">
                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/50 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    Knowledge Base by <span className="text-[#ec4269] dark:text-[#D4AF37] font-semibold">MAN NAVLAKHA</span>
                </div>

                <h1 className="text-3xl sm:text-5xl sm:leading-tight lg:text-7xl font-light tracking-tight text-foreground drop-shadow-sm pb-1 md:pb-2">
                    How can we help you?
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed px-2">
                    Search our knowledge base for answers to common questions and technical guides.
                </p>

                {/* Search */}
                <KBSearch defaultValue={currentSearch || ''} />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 relative z-10 pt-2 md:pt-4">
                <Link
                    href="/kb"
                    className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm ${!currentCategory ? 'bg-[#ec4269] dark:bg-[#D4AF37] text-white dark:text-zinc-900 hover:opacity-90' : 'bg-muted text-foreground hover:bg-muted/80 border border-border'}`}
                >
                    All
                </Link>
                {categories.map((cat) => (
                    <Link
                        key={cat.id}
                        href={`/kb?category=${cat.name}`}
                        className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 sm:gap-2 ${currentCategory === cat.name ? 'bg-[#ec4269] dark:bg-[#D4AF37] text-white dark:text-zinc-900 hover:opacity-90' : 'bg-muted text-foreground hover:bg-muted/80 border border-border'}`}
                    >
                        {cat.name} <span className="opacity-60 text-[10px] sm:text-xs font-normal">({cat._count.knowledgeBaseArticles})</span>
                    </Link>
                ))}
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 pt-4">
                {articles.length === 0 ? (
                    <div className="col-span-full py-24 text-center border border-dashed border-border rounded-2xl bg-muted/30">
                        <p className="text-muted-foreground text-lg">No articles found matching your criteria.</p>
                        <Link href="/kb" className="mt-4 inline-block text-[#ec4269] dark:text-[#D4AF37] hover:underline hover:opacity-80 font-medium">View all articles</Link>
                    </div>
                ) : (
                    articles.map((article) => (
                        <Link
                            key={article.id}
                            href={`/kb/${article.id}`}
                            className="group flex flex-col justify-between p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-border bg-card/50 backdrop-blur-sm hover:border-foreground/20 hover:bg-card transition-all hover:-translate-y-1 shadow-lg shadow-black/5 overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] rounded-full group-hover:bg-purple-500/10 transition-all duration-500 flex pointer-events-none" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4 sm:mb-6">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#ec4269]/10 text-[#ec4269] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] border border-[#ec4269]/20 dark:border-[#D4AF37]/20 max-w-[120px] sm:max-w-none truncate">
                                        {article.category?.name || 'General'}
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-muted-foreground font-mono shrink-0 ml-2">
                                        {new Date(article.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3 group-hover:text-[#ec4269] dark:group-hover:text-[#D4AF37] transition-colors line-clamp-2">
                                    {article.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-6">
                                    {article.summary || article.content?.substring(0, 150) + '...'}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border relative z-10">
                                {article.tags.slice(0, 3).map((t) => (
                                    <span key={t.tag.id} className="text-[10px] font-medium text-muted-foreground px-2 py-1 rounded bg-background border border-border shadow-sm">
                                        #{t.tag.name}
                                    </span>
                                ))}
                                {article.tags.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground font-medium">+ {article.tags.length - 3}</span>
                                )}
                                <span className="ml-auto text-xs text-[#ec4269] dark:text-[#D4AF37] font-semibold transition-colors flex items-center gap-1 opacity-80 group-hover:opacity-100 group-hover:gap-2">
                                    Read <svg className="w-3 h-3 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </span>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* CTA */}
            <div className="mt-24 p-8 md:p-16 rounded-3xl bg-card border border-border text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ec4269]/10 dark:bg-[#D4AF37]/10 blur-[100px] rounded-full group-hover:bg-[#ec4269]/20 dark:group-hover:bg-[#D4AF37]/20 transition-all duration-500 flex pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity flex pointer-events-none" />

                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.05] pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-foreground">Still need help?</h2>
                    <p className="text-muted-foreground mx-auto text-base sm:text-lg font-light max-w-2xl px-2">
                        If you couldn&apos;t find the answer you were looking for, our support team is ready to assist you.
                    </p>
                    <div className="flex justify-center gap-4 pt-6">
                        <Link href="/dashboard/tickets/create" className="px-8 py-3 rounded-full bg-[#ec4269] dark:bg-[#D4AF37] text-white dark:text-zinc-900 font-semibold text-sm hover:opacity-90 hover:scale-105 transition-all outline-none ring-2 ring-[#ec4269]/50 dark:ring-[#D4AF37]/50 ring-offset-2 ring-offset-background shadow-lg shadow-[#ec4269]/20 dark:shadow-[#D4AF37]/20">
                            Open a Ticket
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
