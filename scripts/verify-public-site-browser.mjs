import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [playwrightModulePath, executablePath, origin = "http://localhost:3100", mode] = process.argv.slice(2);
const publicOnly = mode === "--public-only";
if (!playwrightModulePath || !executablePath) {
  throw new Error(
    "Usage: node scripts/verify-public-site-browser.mjs <playwright-core-index.mjs> <chromium-executable> [origin]"
  );
}

const { chromium } = await import(pathToFileURL(path.resolve(playwrightModulePath)).href);
const outputRoot = path.resolve("docs/design-references/lobbystack-local/public-site");
await mkdir(outputRoot, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const failures = [];
const consoleErrors = [];

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 768, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport });
  page.on("console", (message) => {
    if (message.type() === "error") {
      const location = message.location();
      consoleErrors.push(`${viewport.name}: ${message.text()}${location.url ? ` (${location.url}:${location.lineNumber})` : ""}`);
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(`${viewport.name}: ${error.message}`));

  const response = await page.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
  await page.locator("main").waitFor();
  if (!response?.ok()) failures.push(`${viewport.name}: homepage HTTP ${response?.status()}`);

  await page.screenshot({
    path: path.join(outputRoot, `home-${viewport.name}.png`),
    fullPage: true,
  });

  const state = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector("h1")?.textContent?.trim(),
    hasLogo: Boolean(document.querySelector('img[src="/brand/okjobs-logo.png"]')),
    loginHref: document.querySelector('a[href="/login"]')?.getAttribute("href"),
    signupHref: document.querySelector('a[href="/signup"]')?.getAttribute("href"),
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    language: document.documentElement.lang,
    main: Boolean(document.querySelector('main#main-content')),
  }));

  if (!state.title.includes("Okjobs")) failures.push(`${viewport.name}: title mismatch`);
  if (!state.h1) failures.push(`${viewport.name}: H1 missing`);
  if (!state.hasLogo) failures.push(`${viewport.name}: logo missing`);
  if (state.loginHref !== "/login") failures.push(`${viewport.name}: login CTA mismatch`);
  if (state.signupHref !== "/signup") failures.push(`${viewport.name}: signup CTA mismatch`);
  if (state.overflow > 1) failures.push(`${viewport.name}: horizontal overflow ${state.overflow}px`);
  if (state.language !== "fr") failures.push(`${viewport.name}: document language mismatch`);
  if (!state.main) failures.push(`${viewport.name}: main content missing`);

  await page.close();
}

const interactionPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const routes = ["/features/", "/pricing/", "/solutions/", "/blog/", "/fr/", "/solutions/evaluation-techniciens-cvc/"];
if (!publicOnly) routes.push("/login", "/signup", "/forgot-password");
for (const route of routes) {
  const response = await interactionPage.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
  if (!response?.ok()) failures.push(`${route}: browser HTTP ${response?.status()}`);
}

await interactionPage.goto(`${origin}/solutions/ai-receptionist-for-hvac`, { waitUntil: "domcontentloaded" });
if (new URL(interactionPage.url()).pathname !== "/solutions/evaluation-techniciens-cvc") {
  failures.push("legacy sector URL did not redirect to the Okjobs URL");
}
await interactionPage.locator("main").waitFor();
const sectorText = await interactionPage.locator("main").innerText();
if (/AI receptionist|phone answering|caller|appointment booking/i.test(sectorText)) {
  failures.push("sector page still contains receptionist copy");
}
await interactionPage.screenshot({
  path: path.join(outputRoot, "sector-cvc-desktop.png"),
  fullPage: true,
});

const sectorMobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await sectorMobile.goto(`${origin}/solutions/evaluation-techniciens-cvc/`, { waitUntil: "domcontentloaded" });
await sectorMobile.locator("main").waitFor();
const sectorOverflow = await sectorMobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
if (sectorOverflow > 1) failures.push(`sector mobile: horizontal overflow ${sectorOverflow}px`);
await sectorMobile.screenshot({
  path: path.join(outputRoot, "sector-cvc-mobile.png"),
  fullPage: true,
});
await sectorMobile.close();

await interactionPage.goto(`${origin}/pricing/`, { waitUntil: "domcontentloaded" });
await interactionPage.locator("main").waitFor();
if (!(await interactionPage.getByText("Sur devis", { exact: true }).count())) {
  const pricingPreview = (await interactionPage.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 700);
  failures.push(`/pricing/: enterprise quote labels missing (${pricingPreview})`);
}

if (!publicOnly) {
  await interactionPage.goto(`${origin}/signup`, { waitUntil: "domcontentloaded" });
  if (!(await interactionPage.getByRole("heading", { name: "Commencez votre parcours Okjobs" }).count())) {
    failures.push("/signup: Okjobs signup heading missing");
  }
  const signupButton = interactionPage.getByRole("button", { name: "Créer le compte" });
  if (!(await signupButton.isDisabled())) failures.push("/signup: submit should start disabled");
  await interactionPage.getByLabel("Courriel").fill("admin@example.com");
  await interactionPage.getByLabel("Mot de passe").fill("Password!1");
  await interactionPage.getByText("Candidat", { exact: true }).click();
  await interactionPage.waitForTimeout(250);
  if (await signupButton.isDisabled()) {
    const signupState = await interactionPage.evaluate(() => ({
      email: document.querySelector('#auth-email')?.value,
      passwordLength: document.querySelector('#auth-password')?.value.length,
      role: document.querySelector('input[name="role"]:checked')?.value,
    }));
    failures.push(`/signup: valid credentials did not enable submit (${JSON.stringify(signupState)})`);
  }

  await interactionPage.goto(`${origin}/login`, { waitUntil: "domcontentloaded" });
  if (!(await interactionPage.getByRole("heading", { name: "Bon retour" }).count())) {
    failures.push("/login: Okjobs login heading missing");
  }
  if ((await interactionPage.getByLabel("Courriel").count()) !== 1) failures.push("/login: email field missing");
  if ((await interactionPage.getByLabel("Mot de passe").count()) !== 1) failures.push("/login: password field missing");
}
await interactionPage.close();

if (consoleErrors.length) {
  const noJsContext = await browser.newContext({ javaScriptEnabled: false });
  const noJsPage = await noJsContext.newPage();
  await noJsPage.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
  const ssrIslands = await noJsPage.locator("astro-island").evaluateAll((nodes) => nodes.map((node) => ({
    component: node.getAttribute("component-url"),
    text: node.textContent?.replace(/\s+/g, " ").trim(),
  })));
  await noJsContext.close();
  const jsPage = await browser.newPage();
  await jsPage.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
  await jsPage.waitForTimeout(1000);
  const hydratedIslands = await jsPage.locator("astro-island").evaluateAll((nodes) => nodes.map((node) => ({
    component: node.getAttribute("component-url"),
    text: node.textContent?.replace(/\s+/g, " ").trim(),
  })));
  await jsPage.close();
  for (let index = 0; index < Math.max(ssrIslands.length, hydratedIslands.length); index += 1) {
    if (ssrIslands[index]?.text !== hydratedIslands[index]?.text) {
      failures.push(`hydration text mismatch ${ssrIslands[index]?.component}: SSR=${JSON.stringify(ssrIslands[index]?.text?.slice(0, 300))} hydrated=${JSON.stringify(hydratedIslands[index]?.text?.slice(0, 300))}`);
    }
  }
}

await browser.close();

if (consoleErrors.length) failures.push(...consoleErrors.map((error) => `console: ${error}`));
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    publicOnly
      ? "Browser QA passed at 1440px, 768px and 390px; Okjobs public copy and navigation passed."
      : "Browser QA passed at 1440px, 768px and 390px; Okjobs public copy, navigation and auth routes passed."
  );
}
