require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- INVENTORY DATABASE ---");
    try {
        const items = await prisma.inventoryItem.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                        email: true
                    }
                }
            }
        });

        if (items.length === 0) {
            console.log("No inventory items found.");
        } else {
            console.table(items.map(item => ({
                ID: item.pid,
                Type: item.type,
                Brand: item.brand,
                Model: item.model,
                Status: item.status,
                Assignee: item.user ? item.user.username || item.user.email : 'Unassigned',
                Price: item.price ? `$${item.price}` : 'N/A'
            })));
        }
    } catch (error) {
        console.error("Error fetching inventory:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
