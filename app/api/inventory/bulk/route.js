import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import * as XLSX from 'xlsx';

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2;

            // Helper to get value case-insensitively
            const getVal = (key) => {
                const exact = row[key];
                if (exact !== undefined) return exact;
                const lowerKey = key.toLowerCase();
                const foundKey = Object.keys(row).find(k => k.toLowerCase() === lowerKey);
                return foundKey ? row[foundKey] : undefined;
            };

            try {
                // REQUIRED FIELDS
                const pidVal = getVal('PID');
                if (!pidVal) {
                    throw new Error('Missing PID');
                }

                const pid = String(pidVal).trim();

                // Check for duplicate PID (Removed to allow upsert/update)
                // const existing = await prisma.inventoryItem.findUnique({ where: { pid } });
                // if (existing) { ... }

                // MAPPING ENUMS
                let ownershipRaw = getVal('Ownership');
                if (ownershipRaw === 'C') ownershipRaw = 'COMPANY';
                if (ownershipRaw === 'E') ownershipRaw = 'EMPLOYEE';

                const type = mapEnum(getVal('Type'), ['COMPUTER', 'LAPTOP', 'DESKTOP', 'MOBILE', 'TABLET', 'PERIPHERAL', 'OTHER'], 'OTHER');
                const ownership = mapEnum(ownershipRaw, ['COMPANY', 'EMPLOYEE', 'RENTED'], 'COMPANY');
                const status = mapEnum(getVal('Status'), ['ACTIVE', 'MAINTENANCE', 'RETIRED', 'IN_STORAGE', 'SCRAP'], 'ACTIVE');
                const condition = mapEnum(getVal('Condition'), ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'], 'GOOD');

                // DATES
                const purchasedDate = parseExcelDate(getVal('Purchased Date') || getVal('Date of purchase'));
                const warrantyDate = parseExcelDate(getVal('Warranty Date'));
                const assignedDate = parseExcelDate(getVal('Assigned Date'));
                const returnDate = parseExcelDate(getVal('Return Date'));
                const maintenanceDate = parseExcelDate(getVal('Maintenance Date'));

                // USER ASSIGNMENT
                let userId = undefined;
                const userIdentifier = getVal('Assigned To User Email') || getVal('Assigned User') || getVal('Email');

                if (userIdentifier && String(userIdentifier).trim() !== '-' && String(userIdentifier).trim().length > 1) {
                    const identifier = String(userIdentifier).trim();
                    const assignedUser = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { email: { equals: identifier, mode: 'insensitive' } },
                                { username: { equals: identifier, mode: 'insensitive' } }
                            ]
                        }
                    });
                    if (assignedUser) {
                        userId = assignedUser.id;
                    }
                }

                let assignedUserString = null;
                const rawUserStr = String(userIdentifier || '').trim();
                if (!userId && rawUserStr.length > 0 && rawUserStr !== '-') {
                    assignedUserString = rawUserStr;
                }

                // HARDWARE SPECS (Top-level fields)
                const ram = getVal('RAM');
                const processor = getVal('Processor');
                const os = getVal('OS');
                const storage = getVal('Storage');
                const graphicsCard = getVal('Graphics') || getVal('GPU') || getVal('Graphics Card');
                const password = getVal('password ') || getVal('password');
                const vendorInvoice = getVal('Vendor Invoice') || getVal('Invoice');
                const note = getVal('Note') || getVal('Notes');
                const department = getVal('Department') || getVal('Dept');
                const location = getVal('Location');
                const hasCharger = getTruthy(getVal('CHARGER')) || getTruthy(getVal('Charger'));
                const hasMouse = getTruthy(getVal('MOUSE')) || getTruthy(getVal('Mouse'));

                // Additional metadata
                const serial = getVal('serial number ') || getVal('Serial Number');
                const oldTag = getVal('OLD TAG') || getVal('Old Tag');
                const oldUserForField = getVal('Old User') || getVal('OLD USER');
                const modelVal = getVal('Model');
                const brandVal = getVal('Brand');
                const priceVal = getVal('PRICE') || getVal('Price');

                // UPSERT ITEM
                const itemData = {
                    type,
                    status,
                    condition,
                    ownership,
                    department: department ? String(department) : null,
                    location: location ? String(location) : null,
                    brand: brandVal ? String(brandVal) : null,
                    model: modelVal ? String(modelVal) : null,
                    serialNumber: serial ? String(serial) : null,
                    password: password ? String(password) : null,
                    os: os ? String(os) : null,
                    ram: ram ? String(ram) : null,
                    storage: storage ? String(storage) : null,
                    processor: processor ? String(processor) : null,
                    graphicsCard: graphicsCard ? String(graphicsCard) : null,
                    hasCharger,
                    hasMouse,
                    oldTag: oldTag ? String(oldTag) : null,
                    oldUser: oldUserForField ? String(oldUserForField) : null,
                    price: priceVal ? parseFloat(priceVal) : null,
                    vendorInvoice: vendorInvoice ? String(vendorInvoice) : null,
                    note: note ? String(note) : null,
                    userId,
                    assignedDate,
                    returnDate,
                    maintenanceDate,
                    purchasedDate,
                    warrantyDate,
                    assignedUser: assignedUserString,
                };

                await prisma.inventoryItem.upsert({
                    where: { pid },
                    update: itemData,
                    create: {
                        pid,
                        ...itemData
                    }
                });

                results.success++;

            } catch (err) {
                results.failed++;
                results.errors.push(`Row ${rowNumber}: ${err.message}`);
            }
        }

        return NextResponse.json(results);

    } catch (error) {
        console.error('Bulk upload error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function getTruthy(val) {
    if (!val) return false;
    const s = String(val).toLowerCase().trim();
    return s === '1' || s === 'yes' || s === 'true' || s === 'y';
}

function mapEnum(value, allowedValues, defaultValue) {
    if (!value) return defaultValue;
    const upper = String(value).toUpperCase().trim().replace(/\s+/g, '_');
    if (allowedValues.includes(upper)) {
        return upper;
    }
    return defaultValue;
}

function parseExcelDate(value) {
    if (!value) return null;
    if (String(value).trim() === '-') return null; // Handle '-'
    if (value instanceof Date) return value;
    if (typeof value === 'number') {
        const date = new Date(Math.round((value - 25569) * 86400 * 1000));
        return date;
    }
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;
    return null;
}
