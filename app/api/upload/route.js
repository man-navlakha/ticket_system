import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        const identifier = user ? user.id : (request.headers.get('x-forwarded-for') || 'anonymous');

        // --- Rate Limiting (20 uploads per 10 minutes) ---
        const ratelimit = await rateLimit(`upload:${identifier}`, 20, 10 * 60000);
        if (!ratelimit.success) {
            return NextResponse.json(
                { error: 'Upload limit reached. Please wait a few minutes.' },
                { status: 429 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'ticket_system_uploads' },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            ).end(buffer);
        });

        return NextResponse.json({ url: result.secure_url });
    } catch (error) {
        console.error('Upload failed:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
