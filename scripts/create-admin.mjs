import { webcrypto as crypto } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password>');
  process.exit(1);
}

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const PBKDF2_ITERATIONS = 100_000;

async function hashPassword(pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', // format
    new TextEncoder().encode(pw), // bytes
    'PBKDF2', // algo
    false, // export out?
    ['deriveBits'] // allowed to do
  );
  // salting and grind through 100,000 rounds
  // give back 256 bits
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(new Uint8Array(bits))}`;
}

const id = crypto.randomUUID();
const hash  = await hashPassword(password);
const normalizedEmail = email.trim().toLowerCase();
const now = Math.floor(Date.now() / 1000);

const sql = `INSERT INTO admins (id, email, password_hash, created_at) VALUES ('${id}', '${normalizedEmail}', '${hash}', ${now});`;

const outFile = 'scripts/.create-admin.sql';
writeFileSync(outFile, sql);

console.log(`\nWrote SQL to ${outFile}\n`);
console.log(`Local: npx wrangler d1 execute curbalert-la-db --local --file=${outFile}`);
// console.log(`Remote: npx wrangler d1 execute curbalert-la-db --remote --file=${outFile}\n`);
