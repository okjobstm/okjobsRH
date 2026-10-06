import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, serialize } from 'parse5';

const legacy = /(?:lobbystack\.(?:com|org|io)|github\.com\/lobbystack|support@lobbystack)/i;
const urlPattern = /(?:https?:\/\/|\/\/)[^\s"'`<>\\)\]}]*?(?:lobbystack\.(?:com|org|io)|github\.com\/lobbystack)[^\s"'`<>\\)\]}]*|mailto:[^\s"'`<>\\)\]}]*lobbystack[^\s"'`<>\\)\]}]*|github\.com\/lobbystack\/[^\s"'`<>\\)\]}]*/gi;

export function removeLegacyLinks(source, html = false) {
  if (html) {
    const document = parse(source);
    function walk(node) {
      node.childNodes = (node.childNodes || []).filter(child => {
        const attrs = Object.fromEntries((child.attrs || []).map(a => [a.name, a.value]));
        if (child.tagName === 'a' && legacy.test(attrs.href || '') && /github\.com\/lobbystack/i.test(attrs.href)) return false;
        if (child.tagName === 'link' && legacy.test(attrs.href || '')) return false;
        if (child.tagName === 'a' && legacy.test(attrs.href || '')) {
          child.tagName = child.nodeName = 'span';
          child.attrs = child.attrs.filter(a => !['href', 'target', 'rel', 'download'].includes(a.name));
        }
        walk(child);
        return true;
      });
    }
    walk(document);
    source = serialize(document);
  }
  // Residual URLs in previews, feeds and compiled strings cannot target the old
  // provider. Local pricing remains the destination for enterprise CTA strings.
  return source.replace(urlPattern, url => /^mailto:/i.test(url) ? '/pricing/' : '/about/')
    .replace(/support@lobbystack\.com/gi, 'le contact Okjobs');
}

export async function removeLobbystackLinks(root = path.resolve('public/_lobbystack')) {
  let changed = 0;
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { await walk(file); continue; }
      if (!/\.(html|js|mjs|json|xml|txt|md|css|svg)$/i.test(file) && path.relative(root, file).replaceAll('\\', '/') !== 'api/status') continue;
      const before = await readFile(file, 'utf8');
      if (!legacy.test(before)) continue;
      const after = removeLegacyLinks(before, file.endsWith('.html'));
      if (before !== after) { await writeFile(file, after); changed++; }
    }
  }
  await walk(root);
  return changed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Removed legacy links from ${await removeLobbystackLinks()} files.`);
}
