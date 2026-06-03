/**
 * Recovery script — create (or reset password on) an ADMIN user.
 *
 * Run with:
 *   node scripts/create-admin.js admin@example.com YourPassword123 "Admin Name"
 *
 * Or set defaults via env vars:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 *
 * Idempotent: if the email already exists, the password is reset and the
 * role is bumped to ADMIN + status ACTIVE.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const [emailArg, passwordArg, nameArg] = process.argv.slice(2);

    const email = (emailArg || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = passwordArg || process.env.ADMIN_PASSWORD || '';
    const name = nameArg || process.env.ADMIN_NAME || 'Admin';

    if (!email || !email.includes('@')) {
        console.error(
            '❌ Missing or invalid email.\n' +
                'Usage: node scripts/create-admin.js <email> <password> "<name>"',
        );
        process.exit(1);
    }
    if (!password || password.length < 8) {
        console.error('❌ Password must be at least 8 characters.');
        process.exit(1);
    }

    const [firstName, ...rest] = name.trim().split(/\s+/);
    const lastName = rest.join(' ') || null;
    const hashed = await bcrypt.hash(password, 12);

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
        const updated = await prisma.user.update({
            where: { email },
            data: {
                password: hashed,
                role: 'ADMIN',
                status: 'ACTIVE',
                firstName: existing.firstName || firstName,
                lastName: existing.lastName || lastName,
                username: existing.username || name,
            },
        });
        console.log(`✅ Reset password + admin role for: ${updated.email}`);
    } else {
        const created = await prisma.user.create({
            data: {
                email,
                password: hashed,
                username: name,
                firstName,
                lastName,
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        });
        console.log(`✅ Created new ADMIN user: ${created.email}`);
    }

    console.log(`\nLog in at  /auth/login  with:\n   ${email}\n   ${password}`);
}

main()
    .catch((err) => {
        console.error('❌ Script failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
