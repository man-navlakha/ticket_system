import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import * as XLSX from 'xlsx';
import { normalizeInventoryStatus } from '@/lib/inventory-status';
import { resolveNameFromRow } from '@/lib/user';

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

        if (!file.name?.toLowerCase().endsWith('.csv')) {
            return NextResponse.json({ error: 'Only CSV files are supported. Please upload a .csv file.' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const csvText = buffer.toString('utf8').replace(/^\uFEFF/, '');
        const workbook = XLSX.read(csvText, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
        }

        const hasPidColumn = Object.keys(data[0] || {}).some((key) => normalizeColumnKey(key) === 'pid');
        if (!hasPidColumn) {
            return NextResponse.json({ error: 'CSV must include a PID column.' }, { status: 400 });
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
                const normalizedKey = normalizeColumnKey(key);
                const foundKey = Object.keys(row).find((k) => normalizeColumnKey(k) === normalizedKey);
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

                const type = mapEnum(getVal('Type'), ['COMPUTER', 'LAPTOP', 'DESKTOP', 'MOBILE', 'TABLET', 'PERIPHERAL', 'OTHER', 'PRINTER', 'MONITOR', 'MOUSE', 'KEYBOARD', 'HEADSET'], 'OTHER');
                const ownership = mapEnum(ownershipRaw, ['COMPANY', 'EMPLOYEE', 'RENTED'], 'COMPANY');
                const status = normalizeInventoryStatus(getVal('Status'));
                const condition = mapEnum(getVal('Condition'), ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'], 'GOOD');

                // DATES
                const purchasedDate = parseExcelDate(getVal('Purchased Date') || getVal('Date of purchase'));
                const warrantyDate = parseExcelDate(getVal('Warranty Date'));
                const assignedDate = parseExcelDate(getVal('Assigned Date'));
                const returnDate = parseExcelDate(getVal('Return Date'));
                const maintenanceDate = parseExcelDate(getVal('Maintenance Date'));

                // ============================================================
                // USER ASSIGNMENT
                //
                // Behavior:
                //   - If "Assigned To User Email" is provided and a User with
                //     that email doesn't exist yet, AUTO-CREATE a PENDING user
                //     using the supplied Phone / Department / Location / Role
                //     / Name. The user can complete signup later via invite.
                //   - If the user already exists, fill in any of those fields
                //     that are currently empty (we never overwrite values).
                //   - If only a name is supplied (no email), store as free-text
                //     in InventoryItem.assignedUser (the legacy path).
                // ============================================================
                const emailRaw = getVal('Assigned To User Email') || getVal('Email');
                const { firstName, lastName, derivedUsername } = resolveNameFromRow({
                    firstName: getVal('Assigned User First Name') || getVal('First Name'),
                    lastName: getVal('Assigned User Last Name') || getVal('Last Name'),
                    singleName:
                        getVal('Assigned User') ||
                        getVal('Assigned User Name') ||
                        getVal('Name'),
                });
                const nameRaw = derivedUsername;
                const phoneRaw = getVal('Assigned User Phone') || getVal('Phone') || getVal('Phone Number');
                const userDeptRaw = getVal('Assigned User Department');
                const userLocRaw = getVal('Assigned User Location');
                const userRoleRaw = getVal('Assigned User Role') || 'USER';

                const cleanedEmail = emailRaw ? String(emailRaw).trim().toLowerCase() : '';
                const cleanedName = nameRaw ? String(nameRaw).trim() : '';
                const cleanedPhone = phoneRaw ? String(phoneRaw).trim() : '';
                const cleanedUserDept = userDeptRaw ? String(userDeptRaw).trim() : '';
                const cleanedUserLoc = userLocRaw ? String(userLocRaw).trim() : '';
                const cleanedRole = mapEnum(userRoleRaw, ['USER', 'AGENT', 'ADMIN'], 'USER');

                let userId = undefined;
                let assignedUserString = null;

                const looksLikeEmail = cleanedEmail.includes('@') && cleanedEmail.length > 3;

                if (looksLikeEmail) {
                    // Try to find existing user (case-insensitive on email)
                    const assignedUser = await prisma.user.findFirst({
                        where: { email: { equals: cleanedEmail, mode: 'insensitive' } },
                    });

                    if (assignedUser) {
                        userId = assignedUser.id;
                        // Enrich missing fields without overwriting existing ones
                        const patch = {};
                        if (!assignedUser.firstName && firstName) patch.firstName = firstName;
                        if (!assignedUser.lastName && lastName) patch.lastName = lastName;
                        if (!assignedUser.username && cleanedName) patch.username = cleanedName;
                        if (!assignedUser.phoneNumber && cleanedPhone) patch.phoneNumber = cleanedPhone;
                        if (!assignedUser.department && cleanedUserDept) patch.department = cleanedUserDept;
                        if (!assignedUser.location && cleanedUserLoc) patch.location = cleanedUserLoc;
                        if (Object.keys(patch).length > 0) {
                            try {
                                await prisma.user.update({ where: { id: assignedUser.id }, data: patch });
                            } catch (enrichErr) {
                                // Likely a unique-constraint on username — non-fatal.
                                console.warn(`User enrich failed for ${cleanedEmail}:`, enrichErr.message);
                            }
                        }
                    } else {
                        // Auto-create a PENDING user
                        try {
                            const created = await prisma.user.create({
                                data: {
                                    email: cleanedEmail,
                                    username: cleanedName || null,
                                    firstName: firstName || null,
                                    lastName: lastName || null,
                                    password: null,
                                    role: cleanedRole,
                                    status: 'PENDING',
                                    phoneNumber: cleanedPhone || null,
                                    department: cleanedUserDept || null,
                                    location: cleanedUserLoc || null,
                                },
                            });
                            userId = created.id;
                        } catch (createErr) {
                            // Unique-conflict on username most likely — retry without it
                            if (createErr.code === 'P2002' && cleanedName) {
                                const created = await prisma.user.create({
                                    data: {
                                        email: cleanedEmail,
                                        username: null,
                                        firstName: firstName || null,
                                        lastName: lastName || null,
                                        password: null,
                                        role: cleanedRole,
                                        status: 'PENDING',
                                        phoneNumber: cleanedPhone || null,
                                        department: cleanedUserDept || null,
                                        location: cleanedUserLoc || null,
                                    },
                                });
                                userId = created.id;
                            } else {
                                console.warn(`Could not auto-create user ${cleanedEmail}:`, createErr.message);
                            }
                        }
                    }
                } else if (cleanedName) {
                    // No email → store as free-text on the inventory row
                    assignedUserString = cleanedName;
                }

                // HARDWARE SPECS (Top-level fields)
                const ram = getVal('RAM');
                const processor = getVal('Processor');
                const os = getVal('OS');
                const storage = getVal('Storage');
                const graphicsCard = getVal('Graphics') || getVal('GPU') || getVal('Graphics Card');
                const password = getVal('Password') || getVal('password ') || getVal('password');
                const vendorInvoice = getVal('Vendor Invoice') || getVal('Invoice');
                const note = getVal('Note') || getVal('Notes');
                const department = getVal('Department') || getVal('Dept');
                const location = getVal('Location');
                const warrantyType = getVal('Warranty Type');
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
                    warrantyType: warrantyType ? String(warrantyType) : null,
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

function normalizeColumnKey(value) {
    return String(value || '')
        .replace(/\uFEFF/g, '')
        .trim()
        .toLowerCase();
}
