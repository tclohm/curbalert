import { readdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { extname, basename, join } from 'path';
import { execSync } from 'child_process';

const PHOTOS_DIR = './scripts/seed-photos';

const MIME_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

const files = readdirSync(PHOTOS_DIR).filter(f => MIME_TYPES[extname(f).toLowerCase()]);

if (files.length === 0) {
  console.log(`No photos found in ${PHOTOS_DIR}`);
  process.exit(0);
}

const entries = files.map(file => {
  const name = basename(file, extname(file)).toUpperCase(); // e.g. "8ABC123_CA"
  const [plate, state] = name.split('_');

  if (!plate || !state) {
    console.warn(`Skipping "${file}" — expected filename format PLATE_STATE.ext (e.g. 8ABC123_CA.webp)`);
    return null;
  }

  const mime = MIME_TYPES[extname(file).toLowerCase()];
  const base64 = readFileSync(join(PHOTOS_DIR, file)).toString('base64');
  const dataUri = `data:${mime};base64,${base64}`;

  const statement = `UPDATE reports SET photo_base64 = '${dataUri}' WHERE license_plate = '${plate}' AND plate_state = '${state}' AND id = (SELECT id FROM reports WHERE license_plate = '${plate}' AND plate_state = '${state}' ORDER BY created_at DESC LIMIT 1);`;

  return { file, statement };
}).filter(Boolean);

entries.forEach(({ file, statement }, i) => {
  const tmpFile = `./scripts/tmp-photo-${i}.sql`;
  writeFileSync(tmpFile, statement);
  try {
    execSync(`npx wrangler d1 execute curbalert-la-db --local --file=${tmpFile}`, { stdio: 'inherit' });
    console.log(`✓ Applied photo for ${file}`);
  } catch (e) {
    console.error(`✗ Failed on ${file}`);
  } finally {
    unlinkSync(tmpFile);
  }
});
