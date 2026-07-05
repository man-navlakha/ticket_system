export const DEVICE_LIST_SELECT = {
    id: true,
    pid: true,
    type: true,
    status: true,
    condition: true,
    ownership: true,
    brand: true,
    model: true,
    serialNumber: true,
    os: true,
    ram: true,
    storage: true,
    processor: true,
    graphicsCard: true,
    hasCharger: true,
    hasMouse: true,
    department: true,
    location: true,
    assignedUser: true,
    assignedDate: true,
    returnDate: true,
    maintenanceDate: true,
    warrantyDate: true,
    warrantyType: true,
    createdAt: true,
    updatedAt: true,
    _count: {
        select: {
            tickets: true,
            maintenanceRecords: true,
        },
    },
};

export const DEVICE_DETAIL_SELECT = {
    id: true,
    pid: true,
    type: true,
    status: true,
    condition: true,
    ownership: true,
    brand: true,
    model: true,
    serialNumber: true,
    os: true,
    ram: true,
    storage: true,
    processor: true,
    graphicsCard: true,
    hasCharger: true,
    hasMouse: true,
    department: true,
    location: true,
    assignedUser: true,
    assignedDate: true,
    returnDate: true,
    maintenanceDate: true,
    purchasedDate: true,
    warrantyDate: true,
    warrantyType: true,
    systemSpecs: true,
    createdAt: true,
    updatedAt: true,
};

export const DEVICE_TICKET_SELECT = {
    id: true,
    title: true,
    status: true,
    priority: true,
    productName: true,
    componentName: true,
    createdAt: true,
    updatedAt: true,
};

export const DEVICE_MAINTENANCE_SELECT = {
    id: true,
    description: true,
    startDate: true,
    endDate: true,
    technician: true,
    createdAt: true,
    updatedAt: true,
};

function buildDisplayName(device) {
    const hardwareName = [device.brand, device.model].filter(Boolean).join(' ').trim();
    return hardwareName || device.pid || device.type || 'Device';
}

export function toDeviceSummary(device) {
    const { _count, ...fields } = device;

    return {
        ...fields,
        displayName: buildDisplayName(device),
        ticketCount: _count?.tickets ?? 0,
        maintenanceCount: _count?.maintenanceRecords ?? 0,
    };
}

export function toDeviceDetail(device) {
    return {
        ...device,
        displayName: buildDisplayName(device),
    };
}
