import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const vendors = await prisma.vendor.findMany({
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(vendors);
    } catch (error) {
        console.error('Failed to fetch vendors:', error);
        return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
    }
}

export async function POST(request) {
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

        const vendor = await prisma.vendor.create({
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
                status: status || 'ACTIVE'
            }
        });

        return NextResponse.json(vendor);
    } catch (error) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'A vendor with this name already exists' }, { status: 400 });
        }
        console.error('Failed to create vendor:', error);
        return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
    }
}
