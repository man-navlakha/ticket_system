import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getKbArticlePath, getKbCategoryPath, getKbSearchPath, getKbTagPath } from '@/lib/kb-url';

function toHumanTopic(topic) {
    return decodeURIComponent(topic)
        .replace(/-/g, ' ')
        .trim();
}

async function getSearchArticles(topicText) {
    return prisma.knowledgeBaseArticle.findMany({
        where: {
            published: true,
            OR: [
                { title: { contains: topicText, mode: 'insensitive' } },
                { summary: { contains: topicText, mode: 'insensitive' } },
                { content: { contains: topicText, mode: 'insensitive' } },
                {
                    category: {
                        name: { contains: topicText, mode: 'insensitive' },
                    },
                },
                {
                    tags: {
                        some: {
                            tag: {
                                name: { contains: topicText, mode: 'insensitive' },
                            },
                        },
                    },
                },
            ],
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
    const { topic } = await params;
    const topicText = toHumanTopic(topic);

    return {
        title: `KB Search: ${topicText}`,
        description: `Search the knowledge base for ${topicText} and discover guides, tutorials, and troubleshooting resources for this topic.`,
        alternates: {
            canonical: getKbSearchPath(topic),
        },
    };
}

export default async function KBSearchTopicPage({ params }) {
    const { topic } = await params;
    const topicText = toHumanTopic(topic);
    const articles = await getSearchArticles(topicText);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 space-y-8 md:space-y-12">
            <header className="space-y-4 text-center">
                <Link href="/kb" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Back to Knowledge Base
                </Link>
                <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground">
                    Search Topic: {topicText}
                </h1>
                <p className="text-muted-foreground max-w-3xl mx-auto">
                    This topic page is an indexable landing page for long-tail searches around {topicText}. Use it to find related help articles quickly.
                </p>
                <p className="text-sm text-muted-foreground">
                    Found {articles.length} matching article{articles.length === 1 ? '' : 's'}.
                </p>
            </header>

            {articles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground space-y-3">
                    <p>No published KB article matched this topic yet.</p>
                    <p className="text-sm">Try another keyword from category names or tags.</p>
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

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {article.category && (
                                    <Link
                                        href={getKbCategoryPath(article.category.name)}
                                        className="hover:text-foreground transition-colors"
                                    >
                                        {article.category.name}
                                    </Link>
                                )}
                                {article.tags.slice(0, 3).map((entry) => (
                                    <Link
                                        key={entry.tag.id}
                                        href={getKbTagPath(entry.tag.name)}
                                        className="px-2 py-1 rounded-full border border-border hover:text-foreground transition-colors"
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
        </div>
    );
}
