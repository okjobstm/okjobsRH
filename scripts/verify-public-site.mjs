import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const origin = process.argv[2] ?? "http://localhost:3100";
const manifest = JSON.parse(
  await readFile(new URL("../public/_lobbystack-route-manifest.json", import.meta.url), "utf8")
);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function headerSignature(html) {
  const header = html.match(/<header\b[^>]*>([\s\S]*?)<\/header>/i)?.[1] ?? "";
  return [...header.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: match[1].replace(/^\/(?:fr|es|sr)(?=\/)/, ""),
    text: match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  }));
}

async function check(pathname, options = {}) {
  const response = await fetch(new URL(pathname, origin), options);
  if (!response.ok) throw new Error(`${pathname}: HTTP ${response.status}`);
  return response;
}

const failures = [];
let cursor = 0;
const workers = Array.from({ length: 12 }, async () => {
  while (cursor < manifest.pages.length) {
    const page = manifest.pages[cursor++];
    try {
      const response = await check(page.route);
      const html = await response.text();
      if (!html.includes("Okjobs")) throw new Error("Okjobs marker missing");
    } catch (error) {
      failures.push(`${page.route}: ${error.message}`);
    }
  }
});
await Promise.all(workers);

for (const pathname of ["/login", "/signup", "/okjobs/privacy", "/okjobs/terms"]) {
  try {
    await check(pathname);
  } catch (error) {
    failures.push(`${pathname}: ${error.message}`);
  }
}

const homepage = await (await check("/")) .text();
if (!homepage.includes('href="/login"')) failures.push("/: local login CTA missing");
if (!homepage.includes('href="/signup"')) failures.push("/: local signup CTA missing");
if (!homepage.includes('href="/features/"')) failures.push("/: candidate entry missing");
if (!homepage.includes("Choisissez vos prochains collaborateurs avec confiance")) failures.push("/: Okjobs homepage copy missing");
if (/https:\/\/app\.lobbystack\.com\/(?:en|fr|es|sr)\/(?:login|signup)/.test(homepage)) {
  failures.push("/: external LobbyStack authentication URL remains");
}
const homepageMain = homepage.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? homepage;
const homepageVisibleText = homepageMain.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
if (/AI receptionist|missed calls|phone answering|book appointments/i.test(homepageVisibleText)) {
  failures.push("/: obsolete receptionist content remains visible");
}

const expectedHeader = JSON.stringify(headerSignature(homepage));
for (const page of manifest.pages) {
  const localHtml = await readFile(path.join(projectRoot, "public", "_lobbystack", page.file), "utf8");
  if (JSON.stringify(headerSignature(localHtml)) !== expectedHeader) {
    failures.push(`${page.route}: public menu differs from homepage`);
  }
}

const representativePages = [
  ["/features/", "Votre CV ne montre pas tout votre potentiel"],
  ["/solutions/", "Ne choisissez plus sur le CV seul"],
  ["/pricing/", "Sur devis"],
  ["/about/", "Au Congo"],
  ["/blog/", "Des conseils pour faire avancer votre prochaine étape"],
  ["/solutions/evaluation-techniciens-cvc/", "ONG : une sélection adaptée au terrain"],
  ["/solutions/evaluation-techniciens-maintenance/", "Métiers opérationnels : voyez ce que le candidat sait faire"],
];
for (const [pathname, marker] of representativePages) {
  const html = await (await check(pathname)).text();
  if (!html.includes(marker)) failures.push(`${pathname}: expected Okjobs copy missing`);
}

const legacySector = await fetch(new URL("/solutions/ai-receptionist-for-hvac", origin), { redirect: "manual" });
if (![301, 307, 308].includes(legacySector.status)) failures.push("legacy HVAC route does not redirect");
if (legacySector.headers.get("location") !== "/solutions/evaluation-techniciens-cvc") {
  failures.push("legacy HVAC route redirects to the wrong destination");
}

const assetPaths = new Set();
for (const match of homepage.matchAll(/(?:href|src)="(\/[^"?#]+)"/g)) {
  const pathname = match[1];
  if (/\.(?:css|js|mjs|svg|png|webp|woff2)$/i.test(pathname)) assetPaths.add(pathname);
}
for (const pathname of assetPaths) {
  try {
    await check(pathname);
  } catch (error) {
    failures.push(`${pathname}: ${error.message}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Verified ${manifest.pages.length} public pages, authentication entries and ${assetPaths.size} homepage assets.`
  );
}
