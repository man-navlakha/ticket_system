import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');
        const categoryName = searchParams.get('category'); // Added to support name-based filtering
        const published = searchParams.get('published') !== 'false'; // default true
        const search = searchParams.get('search');

        const where = {
            ...(published && { published: true }),
            ...(categoryId && { categoryId }),
            ...(categoryName && { category: { name: categoryName } }), // Filter by name
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
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
            orderBy: [
                { views: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        return NextResponse.json({
            articles: articles.map(article => ({
                id: article.id,
                title: article.title,
                summary: article.summary,
                category: article.category,
                tags: article.tags.map(at => at.tag),
                views: article.views,
                upvotes: article.upvotes,
                published: article.published,
                createdBy: article.createdBy,
                createdAt: article.createdAt,
            })),
        });
    } catch (error) {
        console.error('KB list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch articles' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only ADMIN and AGENT can create articles
        if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { title, content, summary, categoryName, tags, published } = body;

        if (!title || !content || !categoryName) {
            return NextResponse.json(
                { error: 'Title, content, and category are required' },
                { status: 400 }
            );
        }

        // Find category by name
        const category = await prisma.category.findUnique({
            where: { name: categoryName }
        });

        if (!category) {
            return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
        }

        // Handle tags (create if not exists)
        // Defined colors to ensure consistent styling
        const TAG_COLORS = {
            'urgent': '#ef4444',
            'battery': '#facc15',
            'screen': '#06b6d4',
            'keyboard': '#a78bfa',
            'mouse': '#fb923c',
            'wifi': '#10b981',
            'slow-performance': '#f97316',
            'driver-issue': '#8b5cf6',
            'virus-malware': '#dc2626',
            'printer': '#4ade80',
            'email': '#3b82f6',
            'vpn': '#14b8a6',
            'computer': '#6366f1',
            'laptop': '#8b5cf6',
            'power-issue': '#eab308',
            'boot-issue': '#ef4444',
            'system-crash': '#dc2626',
            'display': '#0ea5e9'
        };

        const tagConnections = [];
        if (tags && Array.isArray(tags)) {
            for (const tagName of tags) {
                const tag = await prisma.tag.upsert({
                    where: { name: tagName },
                    update: {},
                    create: {
                        name: tagName,
                        color: TAG_COLORS[tagName] || '#6b7280'
                    }
                });
                tagConnections.push({ tagId: tag.id });
            }
        }

        const article = await prisma.knowledgeBaseArticle.create({
            data: {
                title,
                content,
                summary,
                categoryId: category.id,
                createdById: user.id,
                published: published !== false,
                tags: {
                    create: tagConnections
                }
            },
            include: {
                category: true,
                tags: { include: { tag: true } }
            }
        });

        return NextResponse.json({ article }, { status: 201 });

    } catch (error) {
        console.error('KB create error:', error);
        return NextResponse.json(
            { error: 'Failed to create article' },
            { status: 500 }
        );
    }
}
