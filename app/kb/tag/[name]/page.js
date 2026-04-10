import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getKbArticlePath, getKbCategoryPath, getKbTagPath, getKbSearchPath, toKbSlug } from '@/lib/kb-url';

async function getTagBySlug(nameSlug) {
    const tags = await prisma.tag.findMany({
        where: {
            knowledgeBaseArticles: {
                some: {
                    article: {
                        published: true,
                    },
                },
            },
        },
        select: {
            id: true,
            name: true,
            color: true,
        },
    });

    return tags.find((tag) => toKbSlug(tag.name) === nameSlug) || null;
}

async function getTagArticles(tagId) {
    return prisma.knowledgeBaseArticle.findMany({
        where: {
            published: true,
            tags: {
                some: {
                    tagId,
                },
            },
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
    const tag = await getTagBySlug(name);

    if (!tag) {
        return {
            title: 'KB Tag Not Found',
            description: 'The requested knowledge base tag could not be found.',
        };
    }

    return {
        title: `${tag.name} KB Tag Archives`,
        description: `Browse all Knowledge Base articles tagged ${tag.name} and find targeted fixes, guides, and support workflows.`,
        alternates: {
            canonical: getKbTagPath(tag.name),
        },
    };
}

export default async function KBTagPage({ params }) {
    const { name } = await params;
    const tag = await getTagBySlug(name);

    if (!tag) {
        notFound();
    }

    const articles = await getTagArticles(tag.id);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 space-y-8 md:space-y-12">
            <header className="space-y-4 text-center">
                <Link href="/kb" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Back to Knowledge Base
                </Link>
                <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground">
                    #{tag.name} Articles
                </h1>
                <p className="text-muted-foreground max-w-3xl mx-auto">
                    This tag clusters related support topics so users and crawlers can discover deeply related KB content quickly.
                </p>
                <p className="text-sm text-muted-foreground">
                    {articles.length} article{articles.length === 1 ? '' : 's'} tagged with #{tag.name}.
                </p>
            </header>

            {articles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                    No published articles are tagged with #{tag.name} yet.
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

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Category:</span>
                                {article.category ? (
                                    <Link
                                        href={getKbCategoryPath(article.category.name)}
                                        className="hover:text-foreground transition-colors"
                                    >
                                        {article.category.name}
                                    </Link>
                                ) : (
                                    <span>General</span>
                                )}
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
                <h2 className="text-xl font-semibold">Search Similar Terms</h2>
                <p className="text-muted-foreground text-sm">
                    Use this tag as a search topic to discover related guides and troubleshooting threads.
                </p>
                <Link
                    href={getKbSearchPath(tag.name)}
                    className="inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Search topic: {tag.name}
                </Link>
            </section>
        </div>
    );
}
