import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!JWT_SECRET) {
    throw new Error(
        '❌ FATAL: JWT_SECRET environment variable is not set. ' +
        'The app cannot start without it. Add it to your .env file.'
    );
}

if (!REFRESH_TOKEN_SECRET) {
    throw new Error(
        '❌ FATAL: REFRESH_TOKEN_SECRET environment variable is not set. ' +
        'The app cannot start without it. Add it to your .env file.'
    );
}

export async function hashPassword(password) {
    return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

export function generateAccessToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '15m' }
    );
}

export function generateRefreshToken(user) {
    return jwt.sign(
        { userId: user.id },
        REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
}

export function verifyRefreshTokenToken(token) {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    } catch (error) {
        return null;
    }
}

export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

export async function setRefreshTokenCookie(token) {
    const cookieStore = await cookies();
    cookieStore.set('refresh_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 // 7 days
    });
}

export async function removeRefreshTokenCookie() {
    const cookieStore = await cookies();
    cookieStore.delete('refresh_token');
}

export async function getRefreshTokenFromCookie() {
    const cookieStore = await cookies();
    const token = cookieStore.get('refresh_token');
    return token?.value;
}
