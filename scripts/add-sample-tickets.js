const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No users found in the database. Please create a user first.");
        return;
    }

    const sampleTickets = [
        {
            title: 'Laptop won\'t connect to office WiFi',
            description: 'Since yesterday, my laptop is unable to connect to the office WiFi network. It says "No Internet".',
            status: 'OPEN',
            priority: 'HIGH',
            userId: user.id
        },
        {
            title: 'Request for secondary monitor',
            description: 'I need a secondary monitor for my workspace to improve productivity.',
            status: 'IN_PROGRESS',
            priority: 'LOW',
            userId: user.id
        },
        {
            title: 'VPN access issue',
            description: 'I cannot connect to the company VPN from home. I keep getting an authentication error.',
            status: 'OPEN',
            priority: 'MEDIUM',
            userId: user.id
        },
        {
            title: 'Software installation: Adobe Creative Cloud',
            description: 'Need Adobe Creative Cloud installed on my machine for the new design project.',
            status: 'RESOLVED',
            priority: 'MEDIUM',
            userId: user.id,
            resolvedAt: new Date()
        },
        {
            title: 'Keyboard is not working properly',
            description: 'Some keys on my laptop keyboard are sticky and not registering presses.',
            status: 'OPEN',
            priority: 'MEDIUM',
            userId: user.id
        }
    ];

    console.log("Seeding sample tickets...");
    for (const t of sampleTickets) {
        await prisma.ticket.create({ data: t });
    }
    console.log(`Successfully added ${sampleTickets.length} sample tickets.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
