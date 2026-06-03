import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

const ALLOWED = ['PENDING', 'ACTIVE', 'SUSPENDED'];

/**
 * PATCH /api/admin/users/[id]/status
 * Body: { status: "ACTIVE" | "SUSPENDED" | "PENDING" }
 *
 * Admin only. AGENT is intentionally NOT allowed to suspend or activate —
 * that's a permission decision (only admins should gate access).
 */
export async function PATCH(request, { params }) {
    const me = await getCurrentUser();
    if (!me || me.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only admins can change user status.' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const next = String(body?.status || '').toUpperCase();
    if (!ALLOWED.includes(next)) {
        return NextResponse.json(
            { error: `Status must be one of: ${ALLOWED.join(', ')}` },
            { status: 400 },
        );
    }

    if (id === me.id && next !== 'ACTIVE') {
        return NextResponse.json(
            { error: 'You cannot suspend or unverify your own account.' },
            { status: 400 },
        );
    }

    const target = await prisma.user.findUnique({
        where: { id },
        select: { id: true, status: true, role: true, email: true },
    });
    if (!target) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (target.role === 'ADMIN' && next === 'SUSPENDED' && target.id !== me.id) {
        // Soft safety — refuse to suspend another admin without explicit override
        // (catches the case where one admin accidentally suspends another).
        return NextResponse.json(
            { error: 'Suspending another ADMIN is not allowed from the team page.' },
            { status: 403 },
        );
    }

    const updated = await prisma.user.update({
        where: { id },
        data: { status: next },
        select: { id: true, status: true, email: true, role: true },
    });

    return NextResponse.json({ ok: true, user: updated });
}
