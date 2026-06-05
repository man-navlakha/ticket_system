import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT')) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) };
    }
    return { user };
}

/**
 * GET /api/admin/common-problems
 * Admin-only listing. Includes inactive items so they can be re-enabled
 * without losing the row.
 */
export async function GET() {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    const items = await prisma.commonProblem.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({ items });
}

/**
 * POST /api/admin/common-problems
 * Body: { label: string }
 */
export async function POST(request) {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    try {
        const { label } = await request.json();
        const clean = String(label || '').trim().slice(0, 120);
        if (!clean) {
            return NextResponse.json({ error: 'Label is required.' }, { status: 400 });
        }

        // Unique label — return the existing row if a duplicate is sent.
        const existing = await prisma.commonProblem.findUnique({ where: { label: clean } });
        if (existing) {
            if (!existing.active) {
                const reactivated = await prisma.commonProblem.update({
                    where: { id: existing.id },
                    data: { active: true },
                });
                return NextResponse.json({ item: reactivated });
            }
            return NextResponse.json({ error: 'That problem already exists.' }, { status: 409 });
        }

        const last = await prisma.commonProblem.findFirst({
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
        });
        const item = await prisma.commonProblem.create({
            data: {
                label: clean,
                sortOrder: (last?.sortOrder ?? 0) + 10,
            },
        });
        return NextResponse.json({ item });
    } catch (err) {
        console.error('common-problems create error:', err);
        return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
    }
}
