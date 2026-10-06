import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { parse, serialize } from 'parse5';
import { applyOkjobsImages, assetUrl, imageAssets } from './okjobs-public-images.mjs';

const root = path.resolve('public/_lobbystack');
const jobs = new Map([['recrutement-1200x630', ['recrutement', 1200, 630]]]);
let pages = 0, replaced = 0;
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { await walk(file); continue; }
    if (!file.endsWith('.html')) continue;
    const before = await readFile(file, 'utf8');
    const doc = parse(before);
    function inventory(node) {
      if (node.tagName === 'img') {
        const attrs = Object.fromEntries(node.attrs.map(a => [a.name, a.value]));
        const source = imageAssets.get(attrs.src);
        const existing = attrs.src?.match(/^\/images\/okjobs\/(.+)-(\d+)x(\d+)-v1\.webp$/);
        if (source || existing) {
          const theme = source?.[0] || existing[1];
          const width = Number(attrs.width || 1200), height = Number(attrs.height || 800);
          jobs.set(`${theme}-${width}x${height}`, [theme, width, height]);
          if (source) replaced++;
        }
      }
      for (const child of node.childNodes || []) inventory(child);
    }
    applyOkjobsImages(doc);
    inventory(doc);
    const after = serialize(doc);
    if (before !== after) { await writeFile(file, after); pages++; }
  }
}
await walk(root);
for (const [theme, width, height] of jobs.values()) {
  const destination = path.resolve('public' + assetUrl(theme, width, height));
  await sharp(`public/images/okjobs/${theme}-v1.png`)
    .resize(width, height, { fit: 'contain', background: '#faf9f6' })
    .webp({ quality: 82, effort: 5 }).toFile(destination);
}
console.log(`Updated ${pages} pages and ${replaced} image slots; encoded ${jobs.size} WebP renditions. Original images retained.`);
