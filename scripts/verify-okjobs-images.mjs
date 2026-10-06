import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { parse, serialize } from 'parse5';
import { applyOkjobsImages } from './okjobs-public-images.mjs';

let pages = 0, slots = 0;
const files = new Map();
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { await walk(file); continue; }
    if (!file.endsWith('.html')) continue;
    pages++;
    const html = await readFile(file, 'utf8');
    const doc = parse(html);
    function visit(node) {
      const attrs = Object.fromEntries((node.attrs || []).map(a => [a.name, a.value]));
      if (node.tagName === 'img') {
        assert.ok(!/^\/(illustrations|screenshots)\//.test(attrs.src), `${file}: legacy image ${attrs.src}`);
        if (attrs.src?.startsWith('/images/okjobs/')) {
          slots++;
          assert.ok(attrs.alt?.startsWith('Illustration'), `${file}: missing editorial description`);
          files.set(attrs.src, [Number(attrs.width), Number(attrs.height)]);
        }
      }
      if (node.tagName === 'meta' && ['og:image', 'twitter:image'].includes(attrs.property || attrs.name)) {
        assert.ok(attrs.content.includes('/images/okjobs/'), `${file}: old social cover`);
      }
      for (const child of node.childNodes || []) visit(child);
    }
    visit(doc);
    const before = serialize(doc);
    applyOkjobsImages(doc);
    assert.equal(serialize(doc), before, `${file}: image adaptation is not idempotent`);
  }
}
await walk('public/_lobbystack');
for (const [url, size] of files) {
  const file = path.resolve('public' + url);
  await access(file);
  const metadata = await sharp(file).metadata();
  assert.deepEqual([metadata.width, metadata.height], size, `${url}: image dimensions changed`);
}
await access('public/images/okjobs/recrutement-1200x630-v1.webp');
console.log(`PASS: ${pages} pages, ${slots} editorial image slots, ${files.size} exact-size renditions; no legacy visible images, current social previews, all assets present, idempotent adaptation.`);
