import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyOkjobsPublicText, rewriteVoiceDemoCopy } from "./apply-okjobs-public-text.mjs";
import { rewritePersonaRuntime } from "./okjobs-persona-copy.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(projectRoot, "public");
const destinationRoot = path.join(publicRoot, "_lobbystack");
const manifestPath = path.join(publicRoot, "_lobbystack-route-manifest.json");
const rebrandOnly = process.argv[2] === "--rebrand-only";
const sourceRoot = rebrandOnly ? destinationRoot : path.resolve(process.argv[2] ?? "");

if (!process.argv[2]) {
  throw new Error(
    "Usage: node scripts/import-lobbystack-static.mjs <astro-dist-directory|--rebrand-only>"
  );
}

if (!(await stat(sourceRoot).catch(() => null))?.isDirectory()) {
  throw new Error(`Astro output directory not found: ${sourceRoot}`);
}

const textExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".mjs", ".txt", ".xml"]);
const authReplacements = [
  [/https:\/\/app\.lobbystack\.com\/(?:en|fr|es|sr)\/login/g, "/login"],
  [/https:\/\/app\.lobbystack\.com\/(?:en|fr|es|sr)\/signup/g, "/signup"],
];
const publicLogo = "/brand/okjobs-logo.png";
const legacyWordmark =
  '<img src="/lobbystack-logo.svg" alt="LobbyStack" width="155" height="43" decoding="async" class="h-7 w-auto"/>';
const okjobsWordmark =
  `<img src="${publicLogo}" alt="" width="32" height="32" decoding="async" class="h-8 w-8 object-contain"/>` +
  '<span class="ml-2 text-lg font-bold tracking-tight text-foreground">Okjobs</span>';

function rebrandPublicContent(content) {
  const protectedUrls = [];
  let rewritten = content
    .replaceAll(legacyWordmark, okjobsWordmark)
    .replaceAll(
      '<link rel="icon" type="image/svg+xml" href="/favicon.svg">',
      `<link rel="icon" type="image/png" href="${publicLogo}">`
    )
    .replaceAll("https://lobbystack.com/lobbystack-logo-long.webp", publicLogo)
    .replaceAll("/lobbystack-logo-long.webp", publicLogo)
    .replaceAll("/lobbystack-logo.svg", publicLogo)
    .replaceAll(
      'class="ml-2.5 text-lg font-bold tracking-tight text-foreground"',
      'class="ml-2 text-lg font-bold tracking-tight text-foreground"'
    )
    .replaceAll(
      `"url":"${publicLogo}","width":1030,"height":286`,
      `"url":"${publicLogo}","width":305,"height":310`
    );

  rewritten = rewritten.replace(
    /(?:https?:\/\/[^\s"'<>\\)]+|\/_astro\/[^\s"'<>\\)]+|component-export="[^"]+")/g,
    (url) => {
    const token = `__OKJOBS_PROTECTED_URL_${protectedUrls.length}__`;
    protectedUrls.push(url);
    return token;
    }
  );

  rewritten = rewritten
    .replaceAll("LobbyStack", "Okjobs")
    .replaceAll("Lobbystack", "Okjobs")
    .replaceAll("Lobby Stack", "Okjobs");

  return protectedUrls.reduce(
    (result, url, index) => result.replaceAll(`__OKJOBS_PROTECTED_URL_${index}__`, url),
    rewritten
  );
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolutePath)));
    else files.push(absolutePath);
  }
  return files;
}

async function patchOkjobsPricingRuntime(files) {
  const pricingAsset = files.find(
    (file) => path.basename(file).startsWith("PricingSection.") && path.extname(file) === ".js"
  );
  if (!pricingAsset) return;

  const original = await readFile(pricingAsset, "utf8");
  const plans = 'b={en:[{name:`Candidat`,price:{monthly:`Gratuit`,annual:`Gratuit`},period:``,description:{monthly:`Compte candidat individuel`,annual:`Compte candidat individuel`},cta:{monthly:`Créer un compte`,annual:`Créer un compte`},ctaVariant:`outline`,highlight:!1,highlights:[`Profil professionnel structuré`,`Compétences déclarées et vérifiées séparées`,`Résultats et pistes de développement`]},{name:`Assessment`,price:{monthly:`Sur devis`,annual:`Sur devis`},period:``,description:{monthly:`Offre adaptée au poste et au volume`,annual:`Offre adaptée au poste et au volume`},cta:{monthly:`Demander un devis`,annual:`Demander un devis`},ctaVariant:`outline`,highlight:!1,highlights:[`Évaluations adaptées au poste`,`Rapports contextualisés`,`Comparaison par critères`,`Accompagnement de votre équipe`]},{name:`Recruitment`,price:{monthly:`Sur devis`,annual:`Sur devis`},period:``,description:{monthly:`Accompagnement du cadrage à la shortlist`,annual:`Accompagnement du cadrage à la shortlist`},cta:{monthly:`Demander un devis`,annual:`Demander un devis`},ctaVariant:`default`,highlight:!0,highlights:[`Cadrage et présélection`,`Évaluations et entretiens`,`Shortlist documentée`,`Validation humaine à chaque étape`]},{name:`Sur mesure`,price:{monthly:`Sur devis`,annual:`Sur devis`},period:``,description:{monthly:`Pour un besoin spécifique`,annual:`Pour un besoin spécifique`},cta:{monthly:`Nous contacter`,annual:`Nous contacter`},ctaHref:y,ctaVariant:`outline`,highlight:!1,highlights:[`Volume de candidatures adapté`,`Batterie d’évaluation personnalisée`,`Accompagnement défini ensemble`]}],fr:';
  const comparison = 'x={en:[{category:`Accès et périmètre`,rows:[{feature:`Création du profil candidat`,free:!0,starter:!0,pro:!0,enterprise:!0},{feature:`Évaluations adaptées au poste`,free:!1,starter:!0,pro:!0,enterprise:!0},{feature:`Rapports contextualisés`,free:!1,starter:!0,pro:!0,enterprise:!0},{feature:`Volume de candidatures`,free:`Individuel`,starter:`Selon le devis`,pro:`Selon le devis`,enterprise:`Personnalisé`},{feature:`Espaces utilisateurs`,free:`1`,starter:`Selon le devis`,pro:`Selon le devis`,enterprise:`Personnalisé`}]},{category:`Profil et compétences`,rows:[{feature:`Profil professionnel structuré`,free:!0,pro:!0,enterprise:!0},{feature:`Compétences déclarées`,free:!0,pro:!0,enterprise:!0},{feature:`Compétences vérifiées séparées`,free:!0,pro:!0,enterprise:!0},{feature:`Référentiel métier`,free:!0,pro:!0,enterprise:!0},{feature:`Critères explicites`,free:!0,pro:!0,enterprise:!0},{feature:`Limites documentées`,free:!0,pro:!0,enterprise:!0},{feature:`Évaluations en groupe`,free:!1,pro:!0,enterprise:!0},{feature:`Contenus en français`,free:!0,pro:!0,enterprise:!0}]},{category:`Évaluation`,rows:[{feature:`Évaluations liées au poste`,free:!1,pro:!0,enterprise:!0},{feature:`Résultats et pistes de développement`,free:!0,pro:!0,enterprise:!0},{feature:`Historique des étapes`,free:!0,pro:!0,enterprise:!0}]},{category:`Décision et validation`,rows:[{feature:`Points de vigilance`,free:!1,pro:!0,enterprise:!0},{feature:`Validation humaine`,free:!1,pro:!0,enterprise:!0},{feature:`Entretiens structurés`,free:!1,pro:!0,enterprise:!0}]},{category:`Suivi et informations`,rows:[{feature:`Notifications utiles`,free:!0,pro:!0,enterprise:!0},{feature:`Accompagnement de l’équipe`,free:!1,pro:!0,enterprise:!0}]},{category:`Données et espace personnel`,rows:[{feature:`Synthèses et résultats`,free:!0,pro:!0,enterprise:!0},{feature:`Historique du profil`,free:!0,pro:!0,enterprise:!0},{feature:`Profils et notes`,free:!0,pro:!0,enterprise:!0},{feature:`Shortlist documentée`,free:!1,pro:!0,enterprise:!0},{feature:`Accès aux données utiles`,free:!0,pro:!0,enterprise:!0}]},{category:`Accompagnement et support`,rows:[{feature:`Hébergement sécurisé`,free:!0,pro:!0,enterprise:!0},{feature:`Périmètre défini au devis`,free:!1,pro:!0,enterprise:!0},{feature:`Support`,free:`Standard`,starter:`Équipe Okjobs`,pro:`Prioritaire`,enterprise:`Dédié`}]}],fr:';
  const labels = 'var C={en:{heading:`Des offres claires selon votre usage d’Okjobs`,intro:`Le profil candidat est gratuit. Les prestations d’évaluation et de recrutement sont établies sur devis après cadrage du besoin.`,monthly:`Candidats`,annual:`Entreprises`,save:`Sur devis`,compareHeading:`Comparer les niveaux de service`,compareIntro:`Le devis dépend du nombre de candidats, des évaluations nécessaires et du niveau d’accompagnement demandé.`,billingLabel:`Type d’offre`,tableLabel:`Comparaison des offres`,caption:`Comparaison des services Candidat, Assessment, Recruitment et Sur mesure.`,feature:`Fonctionnalité`,included:`Inclus`,notIncluded:`Non inclus`},fr:';

  const rewritten = original
    .replace(/b=\{en:\[.*?\],fr:/s, plans)
    .replace(/x=\{en:\[.*?\],fr:/s, comparison)
    .replace(/var C=\{en:\{.*?\},fr:/s, labels)
    .replace('children:`Free`', 'children:`Candidat`')
    .replace('children:`Starter`', 'children:`Assessment`')
    .replace('children:`Pro`', 'children:`Recruitment`')
    .replace('children:`Enterprise`', 'children:`Sur mesure`');

  const personaRuntime = rewritePersonaRuntime(rewritten);
  if (personaRuntime !== original) await writeFile(pricingAsset, personaRuntime, "utf8");
}

function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function routeForHtml(relativePath) {
  if (relativePath === "index.html") return "/";
  if (relativePath.endsWith("/index.html")) {
    return `/${relativePath.slice(0, -"index.html".length)}`;
  }
  return `/${relativePath.slice(0, -".html".length)}`;
}

await mkdir(publicRoot, { recursive: true });
if (!rebrandOnly) {
  await rm(destinationRoot, { recursive: true, force: true });
  await cp(sourceRoot, destinationRoot, { recursive: true, force: true });
}

const copiedFiles = await walk(destinationRoot);
for (const absolutePath of copiedFiles) {
  const extension = path.extname(absolutePath);
  if (!textExtensions.has(extension)) continue;
  const original = await readFile(absolutePath, "utf8");
  const authRewritten = authReplacements.reduce(
    (content, [pattern, replacement]) => content.replace(pattern, replacement),
    original
  );
  const rewritten = [".js", ".mjs", ".css"].includes(extension)
    ? authRewritten
    : rebrandPublicContent(authRewritten);
  if (rewritten !== original) await writeFile(absolutePath, rewritten, "utf8");
}

await applyOkjobsPublicText(destinationRoot);
await patchOkjobsPricingRuntime(copiedFiles);
for (const file of copiedFiles.filter((item) => path.basename(item).startsWith("LobbyStackWebVoiceWidget.") && item.endsWith(".js"))) {
  const original = await readFile(file, "utf8");
  const rewritten = rewriteVoiceDemoCopy(original);
  if (rewritten !== original) await writeFile(file, rewritten, "utf8");
}

const finalFiles = await walk(destinationRoot);
const relativeFiles = finalFiles.map((file) => toPosix(path.relative(destinationRoot, file)));
const pages = relativeFiles
  .filter((file) => file.endsWith(".html"))
  .map((file) => ({ route: routeForHtml(file), file }))
  .sort((a, b) => a.route.localeCompare(b.route));

const topLevelFiles = relativeFiles
  .filter((file) => !file.includes("/"))
  .filter((file) => !file.endsWith(".html"))
  .sort();

const assetPrefixes = ["_astro", "audio", "fonts", "illustrations", "og", "pagefind", "screenshots"]
  .filter((directory) => relativeFiles.some((file) => file.startsWith(`${directory}/`)))
  .sort();

const endpointPatterns = [
  /^\.well-known\//,
  /^api\/status(?:\.|\/)/,
  /^schema\//,
  /\.md$/,
  /^feed\.xml$/,
  /^openapi\.json$/,
  /^schemamap\.xml$/,
  /^sitemap(?:-|\.)/,
];
const endpoints = relativeFiles
  .filter((file) => endpointPatterns.some((pattern) => pattern.test(file)))
  .map((file) => ({ route: `/${file}`, file }))
  .sort((a, b) => a.route.localeCompare(b.route));

const manifest = {
  generatedAt: new Date().toISOString(),
  pages,
  endpoints,
  assetPrefixes,
  topLevelFiles,
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(
  `Imported ${relativeFiles.length} files, ${pages.length} HTML pages and ${endpoints.length} public endpoints.`
);
