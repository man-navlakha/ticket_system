import { prisma } from './prisma';

/**
 * Create an audit log entry
 * @param {Object} params
 * @param {string} params.entityType - Type of entity (Ticket, InventoryItem, User)
 * @param {string} params.entityId - ID of the entity
 * @param {string} params.action - Action performed (CREATE, UPDATE, DELETE, STATUS_CHANGE, etc.)
 * @param {Object} params.changes - Object with before/after values
 * @param {string} params.userId - ID of user who performed the action
 * @param {string} [params.ticketId] - Optional ticket ID for direct relation
 * @param {string} [params.inventoryItemId] - Optional inventory item ID for direct relation
 * @param {Object} [params.metadata] - Additional metadata
 */
export async function createAuditLog({
    entityType,
    entityId,
    action,
    changes = null,
    userId,
    ticketId = null,
    inventoryItemId = null,
    metadata = null,
}) {
    try {
        await prisma.auditLog.create({
            data: {
                entityType,
                entityId,
                action,
                changes,
                userId,
                ticketId,
                inventoryItemId,
                metadata,
            },
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit logging should not break the main operation
    }
}

/**
 * Get audit logs for an entity
 * @param {string} entityType
 * @param {string} entityId
 * @returns {Promise<Array>}
 */
export async function getAuditLogs(entityType, entityId) {
    return prisma.auditLog.findMany({
        where: {
            entityType,
            entityId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

/**
 * Get audit logs for a ticket
 * @param {string} ticketId
 * @returns {Promise<Array>}
 */
export async function getTicketAuditLogs(ticketId) {
    return prisma.auditLog.findMany({
        where: { ticketId },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

/**
 * Get audit logs for an inventory item
 * @param {string} inventoryItemId
 * @returns {Promise<Array>}
 */
export async function getInventoryAuditLogs(inventoryItemId) {
    return prisma.auditLog.findMany({
        where: { inventoryItemId },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}
