import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
    try {
        // 1. Ticket Stats
        const ticketsByStatus = await prisma.ticket.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        const ticketsByPriority = await prisma.ticket.groupBy({
            by: ['priority'],
            _count: { id: true }
        });

        // 2. Inventory Stats
        const totalInventory = await prisma.inventoryItem.count();

        const inventoryByType = await prisma.inventoryItem.groupBy({
            by: ['type'],
            _count: { id: true }
        });

        const inventoryByBrand = await prisma.inventoryItem.groupBy({
            by: ['brand'],
            _count: { id: true }
        });

        const inventoryByOwnership = await prisma.inventoryItem.groupBy({
            by: ['ownership'],
            _count: { id: true }
        });

        // 3. Knowledge Base Stats
        const totalKBArticles = await prisma.knowledgeBaseArticle.count();
        const publishedKBArticles = await prisma.knowledgeBaseArticle.count({
            where: { published: true }
        });

        const kbByCategoryRaw = await prisma.knowledgeBaseArticle.groupBy({
            by: ['categoryId'],
            _count: { id: true }
        });

        const categories = await prisma.category.findMany();
        const kbByCategory = kbByCategoryRaw.map(item => {
            const cat = categories.find(c => c.id === item.categoryId);
            return {
                name: cat ? cat.name : 'Uncategorized',
                count: item._count.id
            };
        });

        // 4. Team Size & Roles
        const totalUsers = await prisma.user.count();
        const teamSize = await prisma.user.count({
            where: { role: { in: ['ADMIN', 'AGENT'] } }
        });

        const usersByRole = await prisma.user.groupBy({
            by: ['role'],
            _count: { id: true }
        });

        // 5. Proposals Stats
        const totalProposals = await prisma.proposal.count();
        const proposalsByStatus = await prisma.proposal.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        return {
            tickets: {
                total: ticketsByStatus.reduce((acc, curr) => acc + curr._count.id, 0),
                byStatus: ticketsByStatus.map(t => ({ name: t.status, value: t._count.id })),
                byPriority: ticketsByPriority.map(t => ({ name: t.priority, value: t._count.id }))
            },
            inventory: {
                total: totalInventory,
                byType: inventoryByType.map(t => ({ name: t.type, value: t._count.id })),
                byBrand: inventoryByBrand.filter(b => b.brand).map(b => ({ name: b.brand, value: b._count.id })),
                byOwnership: inventoryByOwnership.map(o => ({ name: o.ownership, value: o._count.id }))
            },
            kb: {
                total: totalKBArticles,
                published: publishedKBArticles,
                byCategory: kbByCategory
            },
            team: {
                total: totalUsers,
                size: teamSize,
                byRole: usersByRole.map(r => ({ name: r.role, value: r._count.id }))
            },
            proposals: {
                total: totalProposals,
                byStatus: proposalsByStatus.map(s => ({ name: s.status, value: s._count.id }))
            }
        };

    } catch (error) {
        console.error("[STATS_GET]", error);
        return null;
    }
}
