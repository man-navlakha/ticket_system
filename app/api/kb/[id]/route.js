import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function GET(request, { params }) {
    try {
        // Allow public access
        // const user = await getCurrentUser(); // Not strictly needed for public read


        const { id } = await params;

        const article = await prisma.knowledgeBaseArticle.findUnique({
            where: { id },
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
        });

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Security: Check if article is published or if user has access
        const isPublic = article.published;
        const hasAccess = user && (user.role === 'ADMIN' || user.role === 'AGENT');

        if (!isPublic && !hasAccess) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Increment view count
        await prisma.knowledgeBaseArticle.update({
            where: { id },
            data: { views: { increment: 1 } },
        });

        return NextResponse.json({ article });
    } catch (error) {
        console.error('KB article fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch article' },
            { status: 500 }
        );
    }
}

export async function PATCH(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only ADMIN and AGENT can update articles
        if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const { published, title, content, summary } = await request.json();

        const article = await prisma.knowledgeBaseArticle.findUnique({
            where: { id },
        });

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        const updateData = {};
        if (typeof published === 'boolean') updateData.published = published;
        if (title) updateData.title = title;
        if (content) updateData.content = content;
        if (summary !== undefined) updateData.summary = summary;

        const updated = await prisma.knowledgeBaseArticle.update({
            where: { id },
            data: updateData,
        });

        // Create audit log
        await createAuditLog({
            entityType: 'KnowledgeBaseArticle',
            entityId: id,
            action: 'UPDATE',
            userId: user.id,
            changes: {
                published: published !== undefined ? { from: article.published, to: published } : undefined,
            },
        });

        return NextResponse.json({ article: updated });
    } catch (error) {
        console.error('KB article update error:', error);
        return NextResponse.json(
            { error: 'Failed to update article' },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only ADMIN can delete articles
        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        const article = await prisma.knowledgeBaseArticle.findUnique({
            where: { id },
            select: { id: true, title: true },
        });

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Create audit log before deletion
        await createAuditLog({
            entityType: 'KnowledgeBaseArticle',
            entityId: id,
            action: 'DELETE',
            userId: user.id,
            metadata: {
                title: article.title,
            },
        });

        await prisma.knowledgeBaseArticle.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('KB article delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete article' },
            { status: 500 }
        );
    }
}
