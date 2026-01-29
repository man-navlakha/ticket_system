import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { triageTicket } from '@/lib/ai';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, description } = await request.json();

        if (!title || !description) {
            return NextResponse.json(
                { error: 'Title and description are required' },
                { status: 400 }
            );
        }

        // Use AI to analyze the ticket
        const suggestions = await triageTicket(title, description);

        // Get category ID if category was suggested
        let categoryId = null;
        if (suggestions.category) {
            const category = await prisma.category.findUnique({
                where: { name: suggestions.category },
            });
            categoryId = category?.id || null;
        }

        // Get tag IDs for suggested tags
        // Defined colors to ensure consistency when auto-creating tags (mirrors seed.js)
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

        // Get tag IDs for suggested tags (create them if they don't exist)
        const tagIds = [];
        if (suggestions.tags && suggestions.tags.length > 0) {
            for (const tagName of suggestions.tags) {
                try {
                    const tag = await prisma.tag.upsert({
                        where: { name: tagName },
                        update: {}, // No updates if exists
                        create: {
                            name: tagName,
                            color: TAG_COLORS[tagName] || '#6b7280' // Use known color or default gray
                        }
                    });
                    tagIds.push(tag.id);
                } catch (e) {
                    console.warn(`Failed to auto-seed tag ${tagName}:`, e);
                }
            }
        }

        return NextResponse.json({
            priority: suggestions.priority,
            categoryId,
            categoryName: suggestions.category,
            tagIds,
            tagNames: suggestions.tags,
        });
    } catch (error) {
        console.error('AI triage error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze ticket', details: error.message },
            { status: 500 }
        );
    }
}
