import { prisma } from '@/lib/prisma';
import { notFound, permanentRedirect } from 'next/navigation';
import { getKbArticlePath } from '@/lib/kb-url';

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
        robots: {
            index: false,
            follow: true,
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

    permanentRedirect(getKbArticlePath(article.id, article.title));
}
