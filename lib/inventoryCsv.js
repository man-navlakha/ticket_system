export const INVENTORY_IMPORT_COLUMNS = [
    'PID',
    'Type',
    'Status',
    'Condition',
    'Ownership',
    'Brand',
    'Model',
    'Serial Number',
    'Department',
    'Location',
    'Assigned To User Email',
    'Assigned User',
    'Purchased Date',
    'Warranty Date',
    'Warranty Type',
    'Assigned Date',
    'Return Date',
    'Maintenance Date',
    'Price',
    'Vendor Invoice',
    'OS',
    'RAM',
    'Storage',
    'Processor',
    'Graphics Card',
    'Charger',
    'Mouse',
    'Old Tag',
    'Old User',
    'Password',
    'Note',
];

export const INVENTORY_FULL_EXPORT_COLUMNS = [
    'Record ID',
    ...INVENTORY_IMPORT_COLUMNS,
    'Linked User ID',
    'Created At',
    'Updated At',
];

export const INVENTORY_SAMPLE_ROW = {
    PID: 'EP-001',
    Type: 'LAPTOP',
    Status: 'ACTIVE',
    Condition: 'GOOD',
    Ownership: 'COMPANY',
    Brand: 'Dell',
    Model: 'Latitude 5440',
    'Serial Number': 'SN123456789',
    Department: 'IT',
    Location: 'HQ - Floor 2',
    'Assigned To User Email': 'agent@example.com',
    'Assigned User': 'Alex Carter',
    'Purchased Date': '2026-01-15',
    'Warranty Date': '2029-01-15',
    'Warranty Type': 'Warranty',
    'Assigned Date': '2026-01-20',
    'Return Date': '',
    'Maintenance Date': '',
    Price: '68500',
    'Vendor Invoice': 'INV-2026-001',
    OS: 'Windows 11 Pro',
    RAM: '16GB',
    Storage: '512GB SSD',
    Processor: 'Intel Core i7',
    'Graphics Card': 'Intel Iris Xe',
    Charger: 'Yes',
    Mouse: 'No',
    'Old Tag': '',
    'Old User': '',
    Password: '',
    Note: 'Example row - replace with your real asset values.',
};

export function buildInventorySampleCsv() {
    return serializeCsv(INVENTORY_IMPORT_COLUMNS, [INVENTORY_SAMPLE_ROW]);
}

export function buildInventoryExportCsv(items) {
    const rows = items.map((item) => ({
        'Record ID': item.id,
        PID: item.pid,
        Type: item.type,
        Status: item.status,
        Condition: item.condition,
        Ownership: item.ownership,
        Brand: item.brand,
        Model: item.model,
        'Serial Number': item.serialNumber,
        Department: item.department,
        Location: item.location,
        'Assigned To User Email': item.user?.email ?? '',
        'Assigned User': item.user?.username ?? item.assignedUser ?? '',
        'Purchased Date': formatDateForCsv(item.purchasedDate),
        'Warranty Date': formatDateForCsv(item.warrantyDate),
        'Warranty Type': item.warrantyType,
        'Assigned Date': formatDateForCsv(item.assignedDate),
        'Return Date': formatDateForCsv(item.returnDate),
        'Maintenance Date': formatDateForCsv(item.maintenanceDate),
        Price: item.price ?? '',
        'Vendor Invoice': item.vendorInvoice,
        OS: item.os,
        RAM: item.ram,
        Storage: item.storage,
        Processor: item.processor,
        'Graphics Card': item.graphicsCard,
        Charger: item.hasCharger ? 'Yes' : 'No',
        Mouse: item.hasMouse ? 'Yes' : 'No',
        'Old Tag': item.oldTag,
        'Old User': item.oldUser,
        Password: item.password,
        Note: item.note,
        'Linked User ID': item.userId,
        'Created At': formatTimestampForCsv(item.createdAt),
        'Updated At': formatTimestampForCsv(item.updatedAt),
    }));

    return serializeCsv(INVENTORY_FULL_EXPORT_COLUMNS, rows);
}

function serializeCsv(headers, rows) {
    const lines = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map((row) => headers.map((header) => escapeCsvValue(row?.[header])).join(',')),
    ];

    return `\uFEFF${lines.join('\n')}`;
}

function escapeCsvValue(value) {
    if (value === null || value === undefined) {
        return '';
    }

    const normalized = String(value)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

    if (/[",\n]/.test(normalized)) {
        return `"${normalized.replace(/"/g, '""')}"`;
    }

    return normalized;
}

function formatDateForCsv(value) {
    if (!value) {
        return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString().slice(0, 10);
}

function formatTimestampForCsv(value) {
    if (!value) {
        return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString();
}
