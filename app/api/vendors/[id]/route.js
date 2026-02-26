import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request, { params }) {
    const user = await getCurrentUser();
    if (!user || user.role === 'USER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const vendor = await prisma.vendor.findUnique({
            where: { id: params.id }
        });

        if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

        return NextResponse.json(vendor);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch vendor' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const json = await request.json();
        const { name, category, contactName, email, phone, website, address, gstin, note, status } = json;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const vendor = await prisma.vendor.update({
            where: { id: params.id },
            data: {
                name,
                category,
                contactName,
                email,
                phone,
                website,
                address,
                gstin,
                note,
                status
            }
        });

        return NextResponse.json(vendor);
    } catch (error) {
        if (error.code === 'P2002') return NextResponse.json({ error: 'Vendor name already exists' }, { status: 400 });
        return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized. Only admins can delete vendors.' }, { status: 401 });
    }

    try {
        await prisma.vendor.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });
    }
}
