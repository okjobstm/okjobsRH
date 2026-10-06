import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const landingRoot = path.resolve(process.argv[2] ?? "");
if (!process.argv[2]) {
  throw new Error("Usage: node scripts/prepare-lobbystack-build.mjs <copied-landing-directory>");
}

const configPath = path.join(landingRoot, "astro.config.mjs");
const original = await readFile(configPath, "utf8");
const marker = "    plugins: [tailwindcss()],\n";
if (!original.includes(marker)) {
  throw new Error(`Expected Vite plugin marker not found in ${configPath}`);
}

const replacement = `${marker}    optimizeDeps: {\n      include: [\"react\", \"react-dom\", \"react/jsx-runtime\", \"react-dom/server\"],\n    },\n    ssr: {\n      external: [\"picomatch\", \"react\", \"react-dom\"],\n    },\n`;
if (!original.includes("    optimizeDeps: {")) {
  await writeFile(configPath, original.replace(marker, replacement), "utf8");
}

const sitemapPath = path.join(landingRoot, "src", "lib", "sitemap.ts");
const sitemap = await readFile(sitemapPath, "utf8");
await writeFile(
  sitemapPath,
  sitemap.replace('from "@/i18n/config"', 'from "../i18n/config"'),
  "utf8"
);
console.log(`Prepared temporary Astro build config: ${configPath}`);
