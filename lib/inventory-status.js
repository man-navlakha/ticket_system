export const INVENTORY_STATUS_OPTIONS = [
    'ACTIVE',
    'DEACTIVE',
    'DONATED',
    'IN_STORAGE',
    'MAINTENANCE',
    'MISSING',
    'ON_SALE',
    'REPARING',
    'SCRAP',
];

const LEGACY_STATUS_ALIASES = {
    RETIRED: 'DEACTIVE',
    LOST: 'MISSING',
    INACTIVE: 'DEACTIVE',
    DEACTIVATED: 'DEACTIVE',
    ONSALE: 'ON_SALE',
    REPAIRING: 'REPARING',
};

const INVENTORY_STATUS_BADGE_CLASSES = {
    ACTIVE: 'border-green-500/20 bg-green-500/10 text-green-500',
    DEACTIVE: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-500',
    DONATED: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-500',
    IN_STORAGE: 'border-blue-500/20 bg-blue-500/10 text-blue-500',
    MAINTENANCE: 'border-amber-500/20 bg-amber-500/10 text-amber-500',
    MISSING: 'border-red-500/20 bg-red-500/10 text-red-500',
    ON_SALE: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-500',
    REPARING: 'border-orange-500/20 bg-orange-500/10 text-orange-500',
    SCRAP: 'border-stone-500/20 bg-stone-500/10 text-stone-500',
};

export const INVENTORY_STATUS_CHART_COLORS = {
    ACTIVE: '#22c55e',
    DEACTIVE: '#71717a',
    DONATED: '#06b6d4',
    IN_STORAGE: '#3b82f6',
    MAINTENANCE: '#f59e0b',
    MISSING: '#ef4444',
    ON_SALE: '#d946ef',
    REPARING: '#f97316',
    SCRAP: '#78716c',
};

export function normalizeInventoryStatus(value, fallback = 'ACTIVE') {
    if (!value) {
        return fallback;
    }

    const normalized = String(value)
        .toUpperCase()
        .trim()
        .replace(/[-\s]+/g, '_');

    const canonical = LEGACY_STATUS_ALIASES[normalized] || normalized;
    return INVENTORY_STATUS_OPTIONS.includes(canonical) ? canonical : fallback;
}

export function getInventoryStatusLabel(value) {
    return normalizeInventoryStatus(value).replace(/_/g, ' ');
}

export function getInventoryStatusBadgeClass(value) {
    return INVENTORY_STATUS_BADGE_CLASSES[normalizeInventoryStatus(value)] || 'border-border bg-background text-muted-foreground';
}
