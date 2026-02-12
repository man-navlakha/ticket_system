import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
    try {
        // 1. Ticket Stats
        const ticketsByStatus = await prisma.ticket.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });

        const ticketsByPriority = await prisma.ticket.groupBy({
            by: ['priority'],
            _count: {
                id: true
            }
        });

        // 2. Inventory Stats
        // Count just laptops or all? User asked for "inventory, laptop/dell, brands"
        // Let's get total inventory count
        const totalInventory = await prisma.inventoryItem.count();

        // Group by Type
        const inventoryByType = await prisma.inventoryItem.groupBy({
            by: ['type'],
            _count: {
                id: true
            }
        });

        // Group by Brand (we might need to fetch all brands and process in JS or use groupBy if brand is clean)
        // Schema has `brand String?`.
        const inventoryByBrand = await prisma.inventoryItem.groupBy({
            by: ['brand'],
            _count: {
                id: true
            }
        });

        // Specifically Laptop/Dell
        const dellLaptops = await prisma.inventoryItem.count({
            where: {
                type: 'LAPTOP',
                brand: {
                    contains: 'Dell',
                    mode: 'insensitive'
                }
            }
        });

        const allBrands = await prisma.inventoryItem.findMany({
            select: { brand: true }
        });

        // 3. Knowledge Base Stats
        const totalKBArticles = await prisma.knowledgeBaseArticle.count();
        const publishedKBArticles = await prisma.knowledgeBaseArticle.count({
            where: { published: true }
        });
        // Maybe group by category if possible
        const kbByCategoryRaw = await prisma.knowledgeBaseArticle.groupBy({
            by: ['categoryId'],
            _count: {
                id: true
            }
        });

        // Fetch category names
        const categories = await prisma.category.findMany();
        const kbByCategory = kbByCategoryRaw.map(item => {
            const cat = categories.find(c => c.id === item.categoryId);
            return {
                name: cat ? cat.name : 'Uncategorized',
                count: item._count.id
            };
        });


        // 4. Team Size
        // Assuming team means Agents + Admins
        const teamSize = await prisma.user.count({
            where: {
                role: {
                    in: ['ADMIN', 'AGENT']
                }
            }
        });


        const usersByRole = await prisma.user.groupBy({
            by: ['role'],
            _count: {
                id: true
            }
        });

        // Fetch actual team members for the list/table
        const teamMembers = await prisma.user.findMany({
            where: {
                role: { in: ['ADMIN', 'AGENT'] }
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                status: true,
            }
        });

        return {
            tickets: {
                byStatus: ticketsByStatus.map(t => ({ name: t.status, value: t._count.id })),
                byPriority: ticketsByPriority.map(t => ({ name: t.priority, value: t._count.id }))
            },
            inventory: {
                total: totalInventory,
                byType: inventoryByType.map(t => ({ name: t.type, value: t._count.id })),
                byBrand: inventoryByBrand.filter(b => b.brand).map(b => ({ name: b.brand, value: b._count.id })),
                dellLaptops: dellLaptops
            },
            kb: {
                total: totalKBArticles,
                published: publishedKBArticles,
                byCategory: kbByCategory
            },
            team: {
                size: teamSize,
                byRole: usersByRole.map(r => ({ name: r.role, value: r._count.id })),
                members: teamMembers // Return the list of members
            }
        };

    } catch (error) {
        console.error("[STATS_GET]", error);
        return null;
    }
}
