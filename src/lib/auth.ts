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
