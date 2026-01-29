const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database with default categories and tags...');

    // Create default categories
    const categories = [
        {
            name: 'Hardware',
            description: 'Physical device issues (laptops, monitors, peripherals)',
            icon: '💻',
            color: '#3b82f6' // blue
        },
        {
            name: 'Software',
            description: 'Application errors, OS issues, software conflicts',
            icon: '⚙️',
            color: '#8b5cf6' // purple
        },
        {
            name: 'Network',
            description: 'WiFi, ethernet, connectivity problems',
            icon: '🌐',
            color: '#10b981' // green
        },
        {
            name: 'Access & Security',
            description: 'Login issues, password resets, permissions',
            icon: '🔒',
            color: '#f59e0b' // amber
        },
        {
            name: 'Other',
            description: 'General inquiries and miscellaneous issues',
            icon: '📋',
            color: '#6b7280' // gray
        }
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: cat
        });
        console.log(`✅ Created category: ${cat.name}`);
    }

    // Create common tags
    const tags = [
        { name: 'urgent', color: '#ef4444' }, // red
        { name: 'battery', color: '#facc15' }, // yellow
        { name: 'screen', color: '#06b6d4' }, // cyan
        { name: 'keyboard', color: '#a78bfa' },
        { name: 'mouse', color: '#fb923c' },
        { name: 'wifi', color: '#10b981' },
        { name: 'slow-performance', color: '#f97316' },
        { name: 'driver-issue', color: '#8b5cf6' },
        { name: 'virus-malware', color: '#dc2626' },
        { name: 'printer', color: '#4ade80' },
        { name: 'email', color: '#3b82f6' },
        { name: 'vpn', color: '#14b8a6' },
        { name: 'computer', color: '#6366f1' },
        { name: 'laptop', color: '#8b5cf6' },
        { name: 'power-issue', color: '#eab308' },
        { name: 'boot-issue', color: '#ef4444' },
        { name: 'system-crash', color: '#dc2626' },
        { name: 'display', color: '#0ea5e9' },
    ];

    for (const tag of tags) {
        await prisma.tag.upsert({
            where: { name: tag.name },
            update: {},
            create: tag
        });
        console.log(`✅ Created tag: ${tag.name}`);
    }

    console.log('✨ Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
