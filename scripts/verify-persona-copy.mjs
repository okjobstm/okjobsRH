import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { parse } from "parse5";
import { applyPersonaCopy, rewritePersonaRuntime } from "./okjobs-persona-copy.mjs";
import { guides } from "./okjobs-guides.mjs";
import { applyDirectorHomeCopy } from "./okjobs-home-director-copy.mjs";
import { applyOkjobsImages } from "./okjobs-public-images.mjs";

const routes = ["", "features/", "solutions/", "pricing/", "about/", "blog/",
  "solutions/evaluation-plombiers/", "solutions/evaluation-techniciens-cvc/",
  "solutions/evaluation-electriciens/", "solutions/evaluation-techniciens-maintenance/",
  "solutions/evaluation-techniciens-reparation/", "solutions/evaluation-intervention-apres-sinistre/",
  "solutions/evaluation-metiers-securite/", "solutions/evaluation-metiers-btp/",
  "solutions/evaluation-gestion-immobiliere/", "solutions/ai-phone-answering/",
  "solutions/ai-appointment-scheduler/", "solutions/after-hours-answering-service/",
  "solutions/self-hosted-ai-receptionist/", "solutions/open-source-ai-receptionist/"];

function structure(document) {
  // Normalize only the explicit approved asset mapping. Classes, dimensions,
  // links, scripts and all other behavior attributes remain strictly compared.
  applyOkjobsImages(document);
  const elements = [];
  function visit(node) {
    if (node.tagName) {
      // Titles/descriptions are editorial. Everything defining layout/behavior is retained.
      const attributes = (node.attrs ?? []).filter((attr) => !(node.tagName === "meta" && attr.name === "content"))
        .map((attr) => ({ ...attr, value: attr.value.replace(/(\/_astro\/(?:PricingSection|LobbyStackWebVoiceWidget)\.[^?]+\.js)\?copy=[a-f0-9]+$/, "$1") }));
      elements.push([node.tagName, attributes]);
    }
    (node.childNodes ?? []).forEach(visit);
  }
  visit(document);
  return elements;
}

for (const route of routes) {
  const file = `public/_lobbystack/${route}index.html`;
  const old = execFileSync("git", ["show", `HEAD:${file}`], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  const current = await readFile(file, "utf8");
  assert.deepEqual(structure(parse(current)), structure(parse(old)), `${route || "/"}: layout or behavior attributes changed`);
  const document = parse(current);
  const before = JSON.stringify(document, (key, value) => key === "parentNode" ? undefined : value);
  applyPersonaCopy(document);
  if (route === "") applyDirectorHomeCopy(document);
  const after = JSON.stringify(document, (key, value) => key === "parentNode" ? undefined : value);
  assert.equal(after, before, `${route || "/"}: editorial pass is not idempotent`);
}

const runtime = 'const label=`Profil professionnel structuré`; const url="/signup"; const count=30;';
const home = await readFile("public/_lobbystack/index.html", "utf8");
assert.ok(home.includes("Choisissez vos prochains collaborateurs avec confiance."));
assert.equal((home.match(/Vous êtes candidat \? Rendez vos compétences visibles\./g) ?? []).length, 1);
assert.equal((home.match(/>Créer mon compte candidat</g) ?? []).length, 1);
assert.ok(home.includes("Créer mon espace entreprise"));
const rewritten = rewritePersonaRuntime(runtime);
assert.match(rewritten, /Un parcours plus facile à comprendre/);
assert.match(rewritten, /url="\/signup"; const count=30/);
assert.equal(rewritePersonaRuntime(rewritten), rewritten);
for (const [slug, guide] of Object.entries(guides)) {
  for (const locale of ["", "fr/", "es/", "sr/"]) {
    const html = await readFile(`public/_lobbystack/${locale}blog/${slug}/index.html`, "utf8");
    assert.ok(html.includes(guide.title), `${locale}${slug}: guide title missing`);
    assert.ok(html.includes(guide.lead.replaceAll("&", "&amp;")), `${locale}${slug}: guide introduction missing`);
    const doc = parse(html);
    let articleBody = "";
    function inspect(node) {
      if (node.attrs?.some((attr) => attr.name === "class" && attr.value.split(/\s+/).includes("blog-copy"))) {
        const getText = (item) => item.nodeName === "#text" ? item.value : (item.childNodes ?? []).map(getText).join("");
        articleBody = getText(node);
      }
      (node.childNodes ?? []).forEach(inspect);
    }
    inspect(doc);
    assert.ok(!/AI receptionist|voice minute|Upfirst|Convex|GPT-Live|PayPal/i.test(articleBody), `${locale}${slug}: obsolete product content`);
    assert.ok(articleBody.includes(guide.next), `${locale}${slug}: next action missing`);
  }
}
console.log(`PASS: ${routes.length} pages retain their elements and behavior attributes; copy is idempotent; runtime literals preserve routes and values.`);
console.log(`PASS: ${Object.keys(guides).length} guides and their locale variants contain their authored copy and next actions, without obsolete receptionist claims.`);
