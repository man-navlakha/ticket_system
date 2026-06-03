/**
 * User display + parsing helpers.
 *
 * `User` has three legacy/optional name fields:
 *   - firstName  (new, structured)
 *   - lastName   (new, structured)
 *   - username   (legacy, often "First Last" stored as a single string)
 *
 * Use formatFullName() everywhere a name is shown, so existing rows with
 * only a `username` keep displaying correctly while new rows take advantage
 * of structured first/last.
 */

/**
 * Returns a human-friendly full name for a User row.
 * Preference order:
 *   1. firstName + lastName (joined)
 *   2. firstName or lastName alone
 *   3. username (back-compat)
 *   4. email local-part ("alex" from "alex@example.com")
 *   5. empty string
 */
export function formatFullName(user) {
    if (!user) return '';
    const first = (user.firstName || '').trim();
    const last = (user.lastName || '').trim();
    if (first && last) return `${first} ${last}`;
    if (first) return first;
    if (last) return last;
    if (user.username) return String(user.username).trim();
    if (user.email && typeof user.email === 'string') {
        const at = user.email.indexOf('@');
        return at > 0 ? user.email.slice(0, at) : user.email;
    }
    return '';
}

/**
 * Splits a single "First Middle Last" string into firstName + lastName.
 * Convention:
 *   - One word: firstName only
 *   - Two words: first + last
 *   - 3+ words: first = first word, last = the rest joined
 *
 * Used to migrate legacy `Name` / `Assigned User` single-column inputs
 * onto the new structured fields.
 */
export function parseFullName(input) {
    if (!input || typeof input !== 'string') return { firstName: null, lastName: null };
    const cleaned = input.trim().replace(/\s+/g, ' ');
    if (!cleaned) return { firstName: null, lastName: null };
    const parts = cleaned.split(' ');
    if (parts.length === 1) return { firstName: parts[0], lastName: null };
    const [first, ...rest] = parts;
    return { firstName: first, lastName: rest.join(' ') };
}

/**
 * Resolves firstName + lastName from a CSV row using either:
 *   1. explicit First Name + Last Name columns (preferred),
 *   2. fallback: splitting a single Name / Assigned User column.
 * Returns { firstName, lastName, derivedUsername }
 *   where derivedUsername = "First Last" — convenient for setting the
 *   legacy `username` field too so old display code keeps working.
 */
export function resolveNameFromRow({ firstName, lastName, singleName }) {
    const f = (firstName || '').trim();
    const l = (lastName || '').trim();
    if (f || l) {
        return {
            firstName: f || null,
            lastName: l || null,
            derivedUsername: [f, l].filter(Boolean).join(' ') || null,
        };
    }
    const parsed = parseFullName(singleName);
    return {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        derivedUsername:
            [parsed.firstName, parsed.lastName].filter(Boolean).join(' ') || null,
    };
}
