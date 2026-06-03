/**
 * Masking helpers for sensitive details shown on the public report page.
 *
 * Rules (per product spec):
 *   maskEmail("man@excellent.com")  -> "m**n@excellent.com"
 *     • show first + last character of the local part
 *     • domain shown in full
 *   maskPhone("9998887770")         -> "99****70"
 *     • show first 2 + last 2 digits, mask the middle
 *   maskName("Man Navlakha")        -> "M** N******"
 *     • show first char of each word, mask the rest with asterisks
 */

export function maskEmail(email) {
    if (!email || typeof email !== 'string') return '';
    const at = email.lastIndexOf('@');
    if (at <= 0) return email;
    const local = email.slice(0, at);
    const domain = email.slice(at);
    if (local.length <= 2) return `${local[0]}*${domain}`;
    const middle = '*'.repeat(Math.max(2, local.length - 2));
    return `${local[0]}${middle}${local[local.length - 1]}${domain}`;
}

export function maskPhone(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length <= 4) return '*'.repeat(digits.length);
    const middle = '*'.repeat(digits.length - 4);
    return `${digits.slice(0, 2)}${middle}${digits.slice(-2)}`;
}

export function maskName(name) {
    if (!name || typeof name !== 'string') return '';
    return name
        .trim()
        .split(/\s+/)
        .map((part) =>
            part.length <= 1 ? part : `${part[0]}${'*'.repeat(part.length - 1)}`,
        )
        .join(' ');
}
