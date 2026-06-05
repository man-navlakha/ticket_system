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
 * DELETE /api/admin/common-problems/[id]
 * Hard-delete a common problem. Use PATCH to soft-disable instead.
 */
export async function DELETE(_request, { params }) {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;
    const { id } = await params;
    try {
        await prisma.commonProblem.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('common-problems delete error:', err);
        return NextResponse.json({ error: 'Could not delete.' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/common-problems/[id]
 * Body: { label?: string, active?: boolean, sortOrder?: number }
 */
export async function PATCH(request, { params }) {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;
    const { id } = await params;
    try {
        const body = await request.json();
        const data = {};
        if (typeof body.label === 'string') {
            const clean = body.label.trim().slice(0, 120);
            if (!clean) return NextResponse.json({ error: 'Label is required.' }, { status: 400 });
            data.label = clean;
        }
        if (typeof body.active === 'boolean') data.active = body.active;
        if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;

        const item = await prisma.commonProblem.update({ where: { id }, data });
        return NextResponse.json({ item });
    } catch (err) {
        console.error('common-problems update error:', err);
        return NextResponse.json({ error: 'Could not update.' }, { status: 500 });
    }
}
