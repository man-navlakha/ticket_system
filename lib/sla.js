/**
 * SLA (Service Level Agreement) Configuration and Utilities
 */

// Default SLA thresholds in hours
export const SLA_THRESHOLDS = {
    FIRST_RESPONSE: parseInt(process.env.SLA_FIRST_RESPONSE_HOURS || '4'),
    RESOLUTION: parseInt(process.env.SLA_RESOLUTION_HOURS || '24'),
};

/**
 * Calculate SLA status for a ticket
 * @param {Object} ticket - Ticket object
 * @returns {Object} SLA status information
 */
export function calculateSLAStatus(ticket) {
    const now = new Date();
    const createdAt = new Date(ticket.createdAt);
    const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);

    // Check if ticket is resolved
    const isResolved = ['RESOLVED', 'CLOSED'].includes(ticket.status);

    // Calculate first response SLA
    const firstResponseAt = ticket.firstResponseAt ? new Date(ticket.firstResponseAt) : null;
    const firstResponseHours = firstResponseAt
        ? (firstResponseAt - createdAt) / (1000 * 60 * 60)
        : null;

    const firstResponseBreached = !firstResponseAt && hoursElapsed > SLA_THRESHOLDS.FIRST_RESPONSE;

    // Calculate resolution SLA
    const resolvedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt) : null;
    const resolutionHours = resolvedAt
        ? (resolvedAt - createdAt) / (1000 * 60 * 60)
        : null;

    const resolutionBreached = !isResolved && hoursElapsed > SLA_THRESHOLDS.RESOLUTION;

    // Determine visual status
    let statusColor = 'green'; // < 4 hours
    let statusLabel = 'On Track';

    if (isResolved) {
        statusColor = resolutionHours <= SLA_THRESHOLDS.RESOLUTION ? 'green' : 'red';
        statusLabel = resolutionHours <= SLA_THRESHOLDS.RESOLUTION ? 'Resolved on Time' : 'Resolved Late';
    } else if (hoursElapsed > SLA_THRESHOLDS.RESOLUTION) {
        statusColor = 'red';
        statusLabel = 'SLA Breached';
    } else if (hoursElapsed > SLA_THRESHOLDS.FIRST_RESPONSE) {
        statusColor = 'amber';
        statusLabel = 'At Risk';
    }

    return {
        hoursElapsed: Math.round(hoursElapsed * 10) / 10,
        statusColor,
        statusLabel,
        firstResponseBreached,
        resolutionBreached,
        isResolved,
        firstResponseAt,
        resolvedAt,
        thresholds: SLA_THRESHOLDS,
    };
}

/**
 * Get SLA badge color class for Tailwind
 * @param {string} statusColor 
 * @returns {string}
 */
export function getSLABadgeClass(statusColor) {
    switch (statusColor) {
        case 'green':
            return 'bg-green-500/10 text-green-500 border-green-500/20';
        case 'amber':
            return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        case 'red':
            return 'bg-red-500/10 text-red-500 border-red-500/20';
        default:
            return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
}

/**
 * Format hours to human-readable string
 * @param {number} hours 
 * @returns {string}
 */
export function formatHours(hours) {
    if (hours < 1) {
        return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
        return `${Math.round(hours * 10) / 10}h`;
    } else {
        const days = Math.floor(hours / 24);
        const remainingHours = Math.round(hours % 24);
        return `${days}d ${remainingHours}h`;
    }
}
