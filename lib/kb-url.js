export function toKbSlug(input = '') {
    return String(input)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'article';
}

export function getKbArticlePath(id, title) {
    return `/kb/${id}/${toKbSlug(title)}`;
}

export function getKbCategoryPath(name) {
    return `/kb/category/${toKbSlug(name)}`;
}

export function getKbTagPath(name) {
    return `/kb/tag/${toKbSlug(name)}`;
}

export function getKbSearchPath(topic) {
    return `/kb/search/${toKbSlug(topic)}`;
}
