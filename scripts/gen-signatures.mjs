// Regenerates lib/email-signatures.js from the images in public/Email Signature/.
//
// Run it after adding or removing a signature image:
//     npm run gen:signatures
//
// It also runs automatically before every build (see the "prebuild" script),
// so on deploy the list is always in sync with the folder.
//
// Naming: the person's name is taken from the part AFTER the last "_", or the
// whole filename if there is no "_". So all of these work:
//     Email Signature Revised 002 (June 2026)_John Doe.jpg   -> "John Doe"
//     Signature_John Doe.jpg                                 -> "John Doe"
//     John Doe.jpg                                           -> "John Doe"
// Files starting with "Copy of" or ending in " copy" are ignored as duplicates.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'public', 'Email Signature');
const outFile = path.join(root, 'lib', 'email-signatures.js');

function slugify(name) {
    return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f));
const seen = new Set();
const out = [];

for (const f of files) {
    if (/^Copy of /i.test(f)) continue; // skip "Copy of …" duplicates
    const base = f.replace(/\.(jpe?g|png)$/i, '');
    let name = base.includes('_') ? base.slice(base.lastIndexOf('_') + 1) : base;
    name = name.trim();
    if (/ copy$/i.test(name)) continue; // skip "… copy" duplicates
    const slug = slugify(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ name, slug, file: f });
}

out.sort((a, b) => a.name.localeCompare(b.name));

const body = `// AUTO-GENERATED from public/Email Signature/. Do not edit by hand.
// Run \`npm run gen:signatures\` after adding/removing a signature image.

export const SIGNATURE_DIR = "Email Signature";
export const ATLAS_GIF = "Atlas latest.gif";
// Atlas banner native size 1734x142; signature cards native 1901x448.
export const RENDER_WIDTH = 600;
export const ATLAS_HEIGHT = 49;   // 600 * 142/1734
export const SIGN_HEIGHT = 141;   // 600 * 448/1901

export const SIGNATURES = ${JSON.stringify(out, null, 2)};
`;

fs.writeFileSync(outFile, body);
console.log(`✔ Wrote ${path.relative(root, outFile)} with ${out.length} people`);
