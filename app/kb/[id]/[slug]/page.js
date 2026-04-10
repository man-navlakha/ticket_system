import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ArticleViewer from '../ArticleViewer';
import { getKbArticlePath, toKbSlug } from '@/lib/kb-url';

function getBaseUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || 'https://it.mechanicsetu.tech').replace(/\/$/, '');
}

export async function generateMetadata({ params }) {
    const { id } = await params;

    const article = await prisma.knowledgeBaseArticle.findUnique({
        where: { id },
        include: {
            createdBy: {
                select: {
                    username: true,
                },
            },
            tags: {
                include: {
                    tag: true,
                },
            },
        },
    });

    if (!article || !article.published) {
        return {
            title: 'Article Not Found',
        };
    }

    const baseUrl = getBaseUrl();
    const canonicalPath = getKbArticlePath(article.id, article.title);
    const canonicalUrl = `${baseUrl}${canonicalPath}`;
    const description = article.summary || article.content?.slice(0, 160) || 'Knowledge Base article.';

    return {
        title: article.title,
        description,
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            title: article.title,
            description,
            url: canonicalUrl,
            type: 'article',
            publishedTime: article.createdAt,
            modifiedTime: article.updatedAt,
            authors: [article.createdBy?.username || "Man's Support Desk"],
            tags: article.tags?.map((t) => t.tag.name),
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description,
        },
    };
}

export default async function ArticleSlugPage({ params }) {
    const { id, slug } = await params;

    const article = await prisma.knowledgeBaseArticle.findUnique({
        where: { id },
        include: {
            category: true,
            tags: { include: { tag: true } },
            createdBy: {
                select: {
                    username: true,
                },
            },
        },
    });

    if (!article || !article.published) {
        notFound();
    }

    const expectedSlug = toKbSlug(article.title);

    if (slug !== expectedSlug) {
        notFound();
    }

    await prisma.knowledgeBaseArticle.update({
        where: { id },
        data: { views: { increment: 1 } },
    });

    const baseUrl = getBaseUrl();
    const canonicalPath = getKbArticlePath(article.id, article.title);
    const canonicalUrl = `${baseUrl}${canonicalPath}`;

    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.summary || article.content?.slice(0, 160) || 'Knowledge Base article.',
            datePublished: article.createdAt,
            dateModified: article.updatedAt,
            author: {
                '@type': 'Person',
                name: article.createdBy?.username || "Man's Support Desk",
            },
            publisher: {
                '@type': 'Organization',
                name: "Man's Support Desk",
                url: baseUrl,
            },
            mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': canonicalUrl,
            },
            articleSection: article.category?.name || 'Knowledge Base',
            keywords: article.tags?.map((t) => t.tag.name),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: baseUrl,
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Knowledge Base',
                    item: `${baseUrl}/kb`,
                },
                {
                    '@type': 'ListItem',
                    position: 3,
                    name: article.title,
                    item: canonicalUrl,
                },
            ],
        },
    ];

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ArticleViewer article={article} />
        </>
    );
}
