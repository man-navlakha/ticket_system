import 'dotenv/config';

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const sourceDir = path.join(projectRoot, 'public', 'Email Signature');
const manifestFile = path.join(projectRoot, 'lib', 'email-signature-cloudinary.json');
const supportedImage = /\.(gif|jpe?g|png|webp)$/i;
const mode = process.argv[2] || 'upload';

function requiredCredentialsPresent() {
    if (process.env.CLOUDINARY_URL) return true;

    return Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET,
    );
}

function configureCloudinary() {
    if (!requiredCredentialsPresent()) {
        throw new Error(
            'Missing Cloudinary credentials. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env.',
        );
    }

    if (process.env.CLOUDINARY_URL) {
        cloudinary.config({ secure: true });
        return;
    }

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
}

function uploadFolder() {
    const folder = (process.env.CLOUDINARY_SIGNATURE_FOLDER || 'email-signatures')
        .trim()
        .replace(/^\/+|\/+$/g, '');

    if (!folder || !/^[a-zA-Z0-9/_-]+$/.test(folder)) {
        throw new Error(
            'CLOUDINARY_SIGNATURE_FOLDER may contain only letters, numbers, slash, underscore, and hyphen.',
        );
    }

    return folder;
}

function publicIdFor(fileName) {
    const stem = fileName.replace(supportedImage, '');
    const slug = stem
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 90) || 'signature-image';
    const suffix = createHash('sha256').update(fileName).digest('hex').slice(0, 10);
    return `${slug}-${suffix}`;
}

async function signatureFiles() {
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && supportedImage.test(entry.name))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));
}

async function describeDryRun(files, folder) {
    const sizes = await Promise.all(
        files.map(async (fileName) => (await fs.stat(path.join(sourceDir, fileName))).size),
    );
    const totalMb = sizes.reduce((sum, size) => sum + size, 0) / (1024 * 1024);

    console.log(`Dry run: ${files.length} images (${totalMb.toFixed(2)} MB)`);
    console.log(`Cloudinary folder/public ID prefix: ${folder}`);
    console.log(`Manifest: ${path.relative(projectRoot, manifestFile)}`);
}

async function verifyCredentials() {
    configureCloudinary();
    const result = await cloudinary.api.ping();

    if (result?.status !== 'ok') {
        throw new Error('Cloudinary did not return a successful credential check.');
    }

    console.log('Cloudinary credentials are valid.');
    console.log(`Cloud name: ${cloudinary.config().cloud_name}`);
}

async function uploadAll(files, folder) {
    configureCloudinary();
    await verifyCredentials();

    const concurrency = Math.min(
        6,
        Math.max(1, Number.parseInt(process.env.CLOUDINARY_UPLOAD_CONCURRENCY || '3', 10) || 3),
    );
    const uploaded = new Map();
    let nextIndex = 0;
    let completed = 0;

    async function worker() {
        while (nextIndex < files.length) {
            const index = nextIndex;
            nextIndex += 1;
            const fileName = files[index];
            const publicId = `${folder}/${publicIdFor(fileName)}`;
            const result = await cloudinary.uploader.upload(path.join(sourceDir, fileName), {
                public_id: publicId,
                resource_type: 'image',
                overwrite: true,
                invalidate: true,
                tags: ['email-signature'],
            });

            if (!result.secure_url) {
                throw new Error(`Cloudinary did not return a secure URL for ${fileName}.`);
            }

            uploaded.set(fileName, result.secure_url);
            completed += 1;
            console.log(`[${completed}/${files.length}] Uploaded ${fileName}`);
        }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    const assets = Object.fromEntries(
        [...uploaded.entries()].sort(([a], [b]) => a.localeCompare(b)),
    );
    const manifest = {
        version: 1,
        generatedAt: new Date().toISOString(),
        cloudName: cloudinary.config().cloud_name,
        folder,
        assets,
    };

    await fs.writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${path.relative(projectRoot, manifestFile)} with ${files.length} CDN URLs.`);
}

async function main() {
    const files = await signatureFiles();
    const folder = uploadFolder();

    if (files.length === 0) {
        throw new Error(`No signature images found in ${sourceDir}.`);
    }

    if (mode === '--dry-run') {
        await describeDryRun(files, folder);
        return;
    }

    if (mode === '--check') {
        await verifyCredentials();
        return;
    }

    if (mode !== 'upload') {
        throw new Error('Unknown option. Use --dry-run, --check, or no option to upload.');
    }

    await uploadAll(files, folder);
}

main().catch((error) => {
    const secret = process.env.CLOUDINARY_API_SECRET;
    const message = String(error?.message || error);
    console.error(secret ? message.replaceAll(secret, '[redacted]') : message);
    process.exitCode = 1;
});
