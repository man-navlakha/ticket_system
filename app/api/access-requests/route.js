import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request) {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const requests = await prisma.accessRequest.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(requests);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const json = await request.json();
        const { name, email, department } = json;

        if (!name || !email || !department) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if pending request already exists
        const existingRequest = await prisma.accessRequest.findUnique({
            where: { email }
        });

        if (existingRequest) {
            if (existingRequest.status === 'PENDING') {
                return NextResponse.json({ error: 'A pending request already exists for this email.' }, { status: 409 });
            } else if (existingRequest.status === 'APPROVED') {
                return NextResponse.json({ error: 'User already has access.' }, { status: 409 });
            }
        }

        const accessRequest = await prisma.accessRequest.create({
            data: {
                name,
                email,
                department,
            }
        });

        return NextResponse.json(accessRequest);
    } catch (error) {
        console.error("Access request creation error:", error);
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }
}
