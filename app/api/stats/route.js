import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user || user.role === "USER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

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

        // 3. Knowledge Base Stats
        const totalKBArticles = await prisma.knowledgeBaseArticle.count();
        const publishedKBArticles = await prisma.knowledgeBaseArticle.count({
            where: { published: true }
        });
        // Maybe group by category if possible
        const kbByCategory = await prisma.knowledgeBaseArticle.groupBy({
            by: ['categoryId'],
            _count: {
                id: true
            }
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

        return NextResponse.json({
            tickets: {
                byStatus: ticketsByStatus,
                byPriority: ticketsByPriority
            },
            inventory: {
                total: totalInventory,
                byType: inventoryByType,
                byBrand: inventoryByBrand,
                dellLaptops: dellLaptops
            },
            kb: {
                total: totalKBArticles,
                published: publishedKBArticles,
                byCategory: kbByCategory
            },
            team: {
                size: teamSize,
                byRole: usersByRole
            }
        });

    } catch (error) {
        console.error("[STATS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
