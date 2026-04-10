import { prisma } from '@/lib/prisma';
import { getKbArticlePath, getKbCategoryPath, getKbSearchPath, getKbTagPath } from '@/lib/kb-url';

export default async function sitemap() {
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://it.mechanicsetu.tech').replace(/\/$/, '');

    const staticUrls = [
        {
            url: `${baseUrl}/`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
            images: [`${baseUrl}/favicon.png`, `${baseUrl}/logo_my.png`],
        },
        {
            url: `${baseUrl}/kb`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
            images: [`${baseUrl}/EP_Logo.png`],
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/policies`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ];

    try {
        const articles = await prisma.knowledgeBaseArticle.findMany({
            where: { published: true },
            select: {
                id: true,
                title: true,
                updatedAt: true,
                createdAt: true,
            },
            orderBy: { updatedAt: 'desc' },
        });

        const categories = await prisma.category.findMany({
            where: {
                knowledgeBaseArticles: {
                    some: { published: true },
                },
            },
            select: {
                name: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });

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
                name: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });

        const kbUrls = articles.map((article) => ({
            url: `${baseUrl}${getKbArticlePath(article.id, article.title)}`,
            lastModified: article.updatedAt || article.createdAt,
            changeFrequency: 'weekly',
            priority: 0.8,
            images: [`${baseUrl}/EP_Logo_text.png`],
        }));

        const categoryUrls = categories.map((category) => ({
            url: `${baseUrl}${getKbCategoryPath(category.name)}`,
            lastModified: category.createdAt || new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }));

        const tagUrls = tags.map((tag) => ({
            url: `${baseUrl}${getKbTagPath(tag.name)}`,
            lastModified: tag.createdAt || new Date(),
            changeFrequency: 'weekly',
            priority: 0.65,
        }));

        const searchTopicUrls = tags.slice(0, 25).map((tag) => ({
            url: `${baseUrl}${getKbSearchPath(tag.name)}`,
            lastModified: tag.createdAt || new Date(),
            changeFrequency: 'weekly',
            priority: 0.55,
        }));

        return [...staticUrls, ...categoryUrls, ...tagUrls, ...searchTopicUrls, ...kbUrls];
    } catch {
        // Keep sitemap available even if database is temporarily unreachable.
        return staticUrls;
    }
}
