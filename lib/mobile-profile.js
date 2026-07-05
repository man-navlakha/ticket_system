import { formatFullName } from './user';

export const MOBILE_PROFILE_SELECT = {
    id: true,
    email: true,
    username: true,
    firstName: true,
    lastName: true,
    phoneNumber: true,
    department: true,
    location: true,
    role: true,
    status: true,
    createdAt: true,
    inventory: {
        orderBy: [
            { assignedDate: 'desc' },
            { createdAt: 'desc' },
        ],
        select: {
            id: true,
            pid: true,
            type: true,
            status: true,
            condition: true,
            brand: true,
            model: true,
        },
    },
    tickets: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
        },
    },
    _count: {
        select: {
            inventory: true,
            tickets: true,
        },
    },
};

function buildDeviceDisplayName(device) {
    const name = [device.brand, device.model].filter(Boolean).join(' ').trim();
    return name || device.pid || device.type || 'Device';
}

export function toMobileProfile(user) {
    const { _count, inventory, tickets, ...fields } = user;
    const displayName = formatFullName(user);

    return {
        ...fields,
        displayName,
        avatarInitial: displayName?.[0]?.toUpperCase() || 'U',
        counts: {
            devices: _count?.inventory ?? inventory?.length ?? 0,
            tickets: _count?.tickets ?? 0,
        },
        assignedDevices: (inventory || []).map((device) => ({
            ...device,
            displayName: buildDeviceDisplayName(device),
        })),
        recentTickets: tickets || [],
    };
}

export function normalizeProfileText(value) {
    if (value === null) return null;
    if (value === undefined) return undefined;

    const text = String(value).trim().replace(/\s+/g, ' ');
    return text || null;
}
