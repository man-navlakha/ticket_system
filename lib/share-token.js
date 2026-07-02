import crypto from 'crypto';

/**
 * Generate a URL-safe random token used as Ticket.shareToken.
 * 16 bytes → ~22 chars of base64url, unguessable.
 */
export function newShareToken() {
    return crypto.randomBytes(16).toString('base64url');
}
