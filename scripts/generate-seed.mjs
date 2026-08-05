import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { extname, basename, join } from 'path';

const PHOTOS_DIR = './scripts/seed-photos';
const OUTPUT_FILE = './scripts/seed-photos-generated.sql';

const MIME_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

const files = readdirSync(PHOTOS_DIR).filter(f => MIME_TYPES[extname(f).toLowerCase()]);

if (files.length === 0) {
  console.log(`No photos found in ${PHOTOS_DIR}`);
  process.exit(0);
}

const statements = files.map(file => {
  const plate = basename(file, extname(file)).toUpperCase(); // filename = plate, e.g. "8ABC123.jpg"
  const mime = MIME_TYPES[extname(file).toLowerCase()];
  const base64 = readFileSync(join(PHOTOS_DIR, file)).toString('base64');
  const dataUri = `data:${mime};base64,${base64}`;

  // updates the most recent report for that plate — adjust if you want all matching rows updated instead
  return `UPDATE reports SET photo_base64 = '${dataUri}' WHERE license_plate = '${plate}' AND id = (SELECT id FROM reports WHERE license_plate = '${plate}' ORDER BY created_at DESC LIMIT 1);`;
});

writeFileSync(OUTPUT_FILE, statements.join('\n'));
console.log(`Wrote ${statements.length} photo update(s) to ${OUTPUT_FILE}`);
