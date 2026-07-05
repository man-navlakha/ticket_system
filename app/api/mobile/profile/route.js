import { NextResponse } from 'next/server';

import { generateAccessToken, setAccessTokenCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMobileApiUser } from '@/lib/mobile-auth';
import {
    MOBILE_PROFILE_SELECT,
    normalizeProfileText,
    toMobileProfile,
} from '@/lib/mobile-profile';

const EDITABLE_FIELDS = [
    'username',
    'firstName',
    'lastName',
    'phoneNumber',
    'department',
    'location',
];

const BLOCKED_FIELDS = [
    'id',
    'email',
    'role',
    'status',
    'password',
    'createdAt',
    'updatedAt',
];

function buildProfilePatch(body) {
    const patch = {};

    for (const field of EDITABLE_FIELDS) {
        if (Object.hasOwn(body, field)) {
            patch[field] = normalizeProfileText(body[field]);
        }
    }

    return patch;
}

function hasBlockedField(body) {
    return BLOCKED_FIELDS.some((field) => Object.hasOwn(body, field));
}

async function getProfileById(userId) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: MOBILE_PROFILE_SELECT,
    });
}

export async function GET(request) {
    const user = await getMobileApiUser(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const profile = await getProfileById(user.id);
        if (!profile || profile.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ profile: toMobileProfile(profile) });
    } catch (error) {
        console.error('Mobile profile fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PATCH(request) {
    const user = await getMobileApiUser(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (hasBlockedField(body)) {
        return NextResponse.json(
            { error: 'Email, role, status, password, and system fields cannot be updated from this API' },
            { status: 400 },
        );
    }

    const patch = buildProfilePatch(body);
    if (Object.keys(patch).length === 0) {
        return NextResponse.json({ error: 'No editable profile fields provided' }, { status: 400 });
    }

    try {
        if (patch.username) {
            const existingUsername = await prisma.user.findFirst({
                where: {
                    username: { equals: patch.username, mode: 'insensitive' },
                    id: { not: user.id },
                },
                select: { id: true },
            });

            if (existingUsername) {
                return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: patch,
            select: MOBILE_PROFILE_SELECT,
        });

        const accessToken = generateAccessToken(updatedUser);
        await setAccessTokenCookie(accessToken);

        return NextResponse.json({
            message: 'Profile updated successfully',
            profile: toMobileProfile(updatedUser),
            accessToken,
        });
    } catch (error) {
        console.error('Mobile profile update error:', error);

        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
        }

        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

export const PUT = PATCH;
