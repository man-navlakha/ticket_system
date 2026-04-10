import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getKbArticlePath, getKbCategoryPath, getKbTagPath, toKbSlug } from '@/lib/kb-url';

function formatName(name) {
    return name
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

async function getCategoryBySlug(nameSlug) {
    const categories = await prisma.category.findMany({
        where: {
            knowledgeBaseArticles: {
                some: {
                    published: true,
                },
            },
        },
        select: {
            id: true,
            name: true,
            description: true,
        },
    });

    return categories.find((category) => toKbSlug(category.name) === nameSlug) || null;
}

async function getCategoryArticles(categoryId) {
    return prisma.knowledgeBaseArticle.findMany({
        where: {
            published: true,
            categoryId,
        },
        include: {
            category: true,
            tags: {
                include: {
                    tag: true,
                },
            },
        },
        orderBy: [{ views: 'desc' }, { updatedAt: 'desc' }],
    });
}

export async function generateMetadata({ params }) {
    const { name } = await params;
    const category = await getCategoryBySlug(name);

    if (!category) {
        return {
            title: 'KB Category Not Found',
            description: 'The requested knowledge base category could not be found.',
        };
    }

    return {
        title: `${category.name} Knowledge Base Articles`,
        description:
            category.description ||
            `Browse ${category.name} troubleshooting guides, step-by-step fixes, and support documentation in our knowledge base.`,
        alternates: {
            canonical: getKbCategoryPath(category.name),
        },
    };
}

export default async function KBCategoryPage({ params }) {
    const { name } = await params;
    const category = await getCategoryBySlug(name);

    if (!category) {
        notFound();
    }

    const articles = await getCategoryArticles(category.id);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 space-y-8 md:space-y-12">
            <header className="space-y-4 text-center">
                <Link href="/kb" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Back to Knowledge Base
                </Link>
                <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground">
                    {category.name} Knowledge Base
                </h1>
                <p className="text-muted-foreground max-w-3xl mx-auto">
                    {category.description ||
                        `Explore fixes, operational guides, and frequently used workflows for ${category.name}. Each article below links to detailed implementation steps.`}
                </p>
                <p className="text-sm text-muted-foreground">
                    This category currently has {articles.length} published article{articles.length === 1 ? '' : 's'}.
                </p>
            </header>

            {articles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                    No published articles in this category yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {articles.map((article) => (
                        <article key={article.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold leading-snug">
                                    <Link
                                        href={getKbArticlePath(article.id, article.title)}
                                        className="hover:text-[#ec4269] dark:hover:text-[#D4AF37] transition-colors"
                                    >
                                        {article.title}
                                    </Link>
                                </h2>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {article.summary || article.content.slice(0, 150)}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {article.tags.slice(0, 4).map((entry) => (
                                    <Link
                                        key={entry.tag.id}
                                        href={getKbTagPath(entry.tag.name)}
                                        className="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                                    >
                                        #{entry.tag.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="mt-auto pt-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                                <span>{new Date(article.updatedAt).toLocaleDateString()}</span>
                                <Link
                                    href={getKbArticlePath(article.id, article.title)}
                                    className="font-semibold hover:text-foreground transition-colors"
                                >
                                    Read article
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <section className="rounded-2xl border border-border bg-muted/20 p-6 text-center space-y-2">
                <h2 className="text-xl font-semibold">Find Another Topic</h2>
                <p className="text-muted-foreground text-sm">
                    Looking for something else? Try another category or search the full KB.
                </p>
                <div className="flex items-center justify-center gap-3 text-sm">
                    <Link href="/kb" className="hover:text-foreground text-muted-foreground transition-colors">
                        View all articles
                    </Link>
                    <span className="text-border">|</span>
                    <Link href={`/kb/search/${name}`} className="hover:text-foreground text-muted-foreground transition-colors">
                        Search for {formatName(name)}
                    </Link>
                </div>
            </section>
        </div>
    );
}
