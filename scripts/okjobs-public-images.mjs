import { guides } from './okjobs-guides.mjs';

// Editorial images generated for Okjobs. Keep every original asset recoverable.
export const imageAssets = new Map([
  ['/illustrations/missed-calls-booked-work.webp', ['recrutement', 'Illustration : compétences identifiées et entretien à préparer']],
  ['/illustrations/call-routing-team.webp', ['selection', 'Illustration : dirigeant et responsable RH comparant des candidatures']],
  ['/illustrations/capabilities-receptionist.webp', ['competences', 'Illustration : savoir-faire, expérience et entretien']],
  ['/illustrations/business-knowledge.webp', ['criteres', 'Illustration : définition des critères utiles au poste']],
  ['/illustrations/call-capture.webp', ['profil', 'Illustration : dossier professionnel et exemples de compétences']],
  ['/illustrations/booking-flow.webp', ['parcours', 'Illustration : préparation du poste, évaluation et entretien']],
  ['/illustrations/human-handoff.webp', ['guide-entretien', 'Illustration : préparation des points à approfondir en entretien']],
  ['/screenshots/dashboard.webp', ['decision', 'Illustration : décision de recrutement appuyée sur des éléments concrets']],
  ['/illustrations/industry-bookings.webp', ['selection', 'Illustration : comparaison de profils pour un recrutement']],
  ['/illustrations/trust-controls.webp', ['decision', 'Illustration : analyse humaine des éléments de candidature']],
]);

function guideTheme(slug, guide) {
  if (guide.audience === 'formation') return 'guide-formation';
  if (guide.audience === 'candidat') return 'candidat';
  if (/entretien/i.test(guide.title)) return 'guide-entretien';
  if (/critères|fiche de poste/i.test(guide.title)) return 'criteres';
  if (/compétence|évaluation|résultat|note/i.test(guide.title)) return 'competences';
  if (/shortlist|Comparez|PME|Assessment/i.test(guide.title)) return 'selection';
  return 'decision';
}

for (const [slug, guide] of Object.entries(guides)) {
  const source = slug === 'ai-receptionist-affiliate-program' ? 'open-source-ai-receptionist-affiliate-program' : slug;
  imageAssets.set(`/illustrations/${source}-hero.webp`, [guideTheme(slug, guide), `Illustration du guide : ${guide.title}`]);
}
for (const name of ['furnace', 'service-area', 'spam', 'no-heat', 'running-toilet', 'invoice']) {
  imageAssets.set(`/illustrations/after-hours/${name}.webp`, ['criteres', 'Illustration : critères et préparation d’une évaluation professionnelle']);
}
for (const name of ['cracked-tooth', 'insurance', 'new-patient', 'reschedule', 'after-extraction', 'billing']) {
  imageAssets.set(`/illustrations/dental/${name}.webp`, ['guide-formation', 'Illustration : échange autour d’un exercice professionnel']);
}

export function assetUrl(theme, width, height) {
  // A separate encoded rendition preserves each existing slot's exact ratio.
  return `/images/okjobs/${theme}-${width}x${height}-v1.webp`;
}

export function applyOkjobsImages(document) {
  const ids = new Set();
  function collectIds(node) {
    for (const attr of node.attrs || []) if (attr.name === 'id') ids.add(attr.value);
    for (const child of node.childNodes || []) collectIds(child);
  }
  collectIds(document);
  const isHome = ids.has('pricing-preview') && ids.has('by-trade');
  function visit(node) {
    if (node.tagName === 'img') {
      const attrs = Object.fromEntries(node.attrs.map(attr => [attr.name, attr]));
      let asset = imageAssets.get(attrs.src?.value);
      let parent = node.parentNode;
      let inCandidateSection = false;
      while (parent) {
        if (parent.attrs?.some(attr => attr.name === 'id' && attr.value === 'how-it-works')) inCandidateSection = true;
        parent = parent.parentNode;
      }
      if (isHome && inCandidateSection && attrs.src?.value !== '/brand/okjobs-logo.png') {
        asset = ['candidat', 'Illustration : candidate préparant son profil professionnel'];
      }
      if (isHome && attrs.src?.value.startsWith('/images/okjobs/candidat-2048x2048')) {
        asset = ['guide-entretien', 'Illustration : préparation des points à approfondir en entretien'];
      }
      if (!asset && attrs.src?.value.startsWith('/images/okjobs/') && attrs.alt?.value.startsWith('Illustration du guide : ')) {
        const entry = Object.entries(guides).find(([, guide]) => attrs.alt.value === `Illustration du guide : ${guide.title}`);
        if (entry) asset = [guideTheme(...entry), attrs.alt.value];
      }
      if (asset) {
        const [theme, alt] = asset;
        attrs.src.value = assetUrl(theme, Number(attrs.width?.value || 1200), Number(attrs.height?.value || 800));
        if (attrs.alt) attrs.alt.value = alt;
      }
    }
    if (node.tagName === 'meta') {
      const attrs = Object.fromEntries(node.attrs.map(attr => [attr.name, attr]));
      const name = attrs.property?.value || attrs.name?.value;
      if (['og:image', 'twitter:image'].includes(name) && attrs.content) {
        const old = attrs.content.value;
        attrs.content.value = /^https?:/.test(old)
          ? new URL(assetUrl('recrutement', 1200, 630), old).href
          : assetUrl('recrutement', 1200, 630);
      }
      if (['og:image:alt', 'twitter:image:alt'].includes(name) && attrs.content) {
        attrs.content.value = 'Okjobs : éclairer vos décisions de recrutement';
      }
    }
    // Structured article image references must not retain competitor covers.
    if (node.tagName === 'script' && node.attrs?.some(attr => attr.name === 'type' && attr.value === 'application/ld+json')) {
      for (const child of node.childNodes || []) {
        if (child.nodeName !== '#text') continue;
        child.value = child.value.replace(/(?:https?:\/\/[^"\s]+)?\/illustrations\/[^"\s]+-hero\.webp/g,
          assetUrl('recrutement', 1200, 630));
        child.value = child.value.replace(/(?:https?:\/\/[^"\s]+)?\/og\/[^"\s]+\.(?:jpg|png|webp)/g,
          assetUrl('recrutement', 1200, 630));
      }
    }
    for (const child of node.childNodes || []) visit(child);
  }
  visit(document);
}
