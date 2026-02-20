import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ArticleViewer from './ArticleViewer';

// Force dynamic if needed, but for articles with caching, default is ISR/Prerendered if no searchParams
// Using generateMetadata allows us to fetch data for SEO.

export async function generateMetadata({ params }) {
    const { id } = await params;

    const article = await prisma.knowledgeBaseArticle.findUnique({
        where: { id },
        include: { category: true }
    });

    if (!article || !article.published) {
        return {
            title: 'Article Not Found',
        };
    }

    return {
        title: article.title,
        description: article.summary,
        openGraph: {
            title: article.title,
            description: article.summary,
            type: 'article',
            publishedTime: article.createdAt,
            authors: [article.createdBy?.username || 'Man\'s Support Desk'],
            tags: article.tags?.map(t => t.tag.name),
        },
    };
}

export default async function ArticlePage({ params }) {
    const { id } = await params;

    const article = await prisma.knowledgeBaseArticle.findUnique({
        where: { id },
        include: {
            category: true,
            tags: { include: { tag: true } },
            createdBy: {
                select: {
                    username: true,
                }
            }
        }
    });

    if (!article || !article.published) {
        notFound();
    }

    // Increment view count (fire and forget, or handle safely without blocking render too much)
    // Since this is a server component, we can do it here.
    // Note: For high traffic, this should be decoupled (queue/bg job), but for now strict increment is fine.
    await prisma.knowledgeBaseArticle.update({
        where: { id },
        data: { views: { increment: 1 } },
    });

    return <ArticleViewer article={article} />;
}
