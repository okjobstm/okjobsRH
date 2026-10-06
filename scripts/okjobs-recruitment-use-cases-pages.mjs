import { parseFragment } from "parse5";

const pages = {
  "/solutions/evaluation-plombiers/": {
    audience: "PME",
    title: "Recrutez sans alourdir votre organisation.",
    lead: "Okjobs accompagne les PME qui doivent structurer un recrutement sans mobiliser une équipe RH importante. Nous clarifions le besoin, comparons les candidatures et préparons une shortlist expliquée.",
    exampleRole: "Responsable administratif polyvalent",
    proof: ["Périmètre défini avant la mission", "Critères adaptés au poste", "Décision finale conservée"],
    useCases: [
      ["Premier recrutement structuré", "Vous recrutez pour la première fois sur un poste clé et souhaitez éviter que les critères changent au fil des entretiens."],
      ["Poste polyvalent difficile à cadrer", "Le poste réunit plusieurs responsabilités et votre équipe doit distinguer les compétences indispensables de celles qui peuvent s’apprendre."],
      ["Peu de ressources RH disponibles", "Le dirigeant ou le manager manque de temps pour organiser la présélection, les évaluations et la préparation des entretiens."],
    ],
    results: [
      ["Un besoin partagé", "Les responsabilités, priorités et critères du poste sont compris par les personnes qui participeront à la décision."],
      ["Des profils comparables", "Les candidatures sont présentées selon les mêmes repères, avec leurs correspondances et leurs écarts."],
      ["Une shortlist prête à discuter", "Les profils retenus, les points de vigilance et les questions d’entretien sont réunis dans un livrable lisible."],
    ],
    closing: "Parlons du prochain recrutement de votre PME",
  },
  "/solutions/evaluation-techniciens-cvc/": {
    audience: "ONG",
    title: "Recrutez pour vos missions, votre terrain et vos contraintes.",
    lead: "Okjobs aide les ONG à traduire leurs besoins opérationnels en critères de recrutement clairs, à prendre en compte le contexte des missions et à documenter les raisons de leur sélection.",
    exampleRole: "Coordinateur de programme terrain",
    proof: ["Mission et contexte pris en compte", "Lecture commune des candidatures", "Sélection documentée"],
    useCases: [
      ["Lancement d’un programme", "Une nouvelle activité nécessite de recruter rapidement tout en alignant le poste sur les objectifs, les responsabilités et les conditions réelles de la mission."],
      ["Recrutement de profils terrain", "Le poste demande de l’adaptation, de la coordination et une compréhension du contexte que le CV seul permet difficilement d’apprécier."],
      ["Fonction support ou coordination", "Plusieurs équipes participent au choix et ont besoin de critères communs pour comparer les candidatures sans perdre les priorités de la mission."],
    ],
    results: [
      ["La mission traduite en critères", "Les attentes opérationnelles, relationnelles et organisationnelles sont formulées avant l’évaluation des profils."],
      ["Le contexte rendu visible", "Les capacités d’adaptation et de coordination sont rapprochées des situations réellement rencontrées par l’organisation."],
      ["Une sélection traçable", "Les éléments qui soutiennent la shortlist sont conservés pour faciliter les échanges entre les parties prenantes."],
    ],
    closing: "Construisons un recrutement adapté à votre mission",
  },
  "/solutions/evaluation-techniciens-maintenance/": {
    audience: "MÉTIERS OPÉRATIONNELS",
    title: "Recrutez des profils capables d’agir sur le terrain.",
    lead: "Okjobs structure le recrutement des métiers opérationnels autour du travail réel : compréhension des consignes, résolution de problèmes, sécurité, autonomie et coopération avec l’équipe.",
    exampleRole: "Chef d’équipe maintenance",
    proof: ["Situations proches du terrain", "Exigences vérifiées séparément", "Entretien mieux ciblé"],
    useCases: [
      ["Recrutement de techniciens", "Vous devez apprécier une méthode de diagnostic, le respect des consignes et la capacité à expliquer une intervention."],
      ["Renforcement d’une équipe terrain", "L’activité augmente et vous recherchez des profils capables de s’intégrer, de prioriser et de travailler avec les autres intervenants."],
      ["Poste avec exigences de sécurité", "Les compétences observées doivent être distinguées des habilitations, certifications et autorisations qui nécessitent une vérification documentaire."],
    ],
    results: [
      ["Des compétences mises en situation", "Les candidats sont observés sur des raisonnements et des situations reliés aux activités du poste."],
      ["Des vérifications bien séparées", "Les habilitations et documents requis restent identifiés comme des éléments à contrôler par les méthodes adaptées."],
      ["Un entretien concentré sur le réel", "Les points à confirmer deviennent des questions concrètes sur les pratiques, les choix et les réactions du candidat."],
    ],
    closing: "Préparons votre prochain recrutement opérationnel",
  },
};

const icons = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 16 4-4 4 2 4-6"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg>',
];

function cards(items, result = false) {
  return items.map(([title, text], index) => {
    const resultLabel = result ? `<p class="mt-5 text-xs font-semibold text-muted-foreground">RÉSULTAT ${index + 1}</p>` : "";
    return `
    <article class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
      <span class="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">${icons[index]}</span>
      ${resultLabel}
      <h3 class="${result ? "mt-2" : "mt-5"} text-lg font-semibold text-foreground">${title}</h3>
      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">${text}</p>
    </article>`;
  }).join("").replace(/^\s+$/gm, "");
}

function pageTemplate(page) {
  if (page.audience === "PME") return pmeTemplate(page);
  if (page.audience === "ONG") return ongTemplate(page);
  return operationsTemplate(page);
}

const arrow = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 size-4" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
const primaryCta = (label) => `<a href="/signup" class="group/button inline-flex h-11 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-[color,background-color,scale] duration-150 hover:bg-primary/80 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">${label}${arrow}</a>`;

function pmeTemplate(page) {
  const cases = page.useCases.map(([title, text], index) => `<li class="grid gap-4 border-t border-border/70 py-6 md:grid-cols-[0.2fr_0.8fr]"><span class="text-sm font-semibold text-muted-foreground">0${index + 1}</span><div><h3 class="text-lg font-semibold text-foreground">${title}</h3><p class="mt-2 text-sm leading-relaxed text-muted-foreground">${text}</p></div></li>`).join("");
  return `
<section class="border-b border-border/60 bg-background">
  <div class="mx-auto max-w-7xl px-6 py-20 lg:py-28">
    <div class="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
      <div class="max-w-3xl"><p class="text-sm font-semibold text-muted-foreground">RECRUTEMENT POUR PME · 01</p><h1 class="display-heading-compact mt-4">${page.title}</h1><p class="body-copy mt-6 max-w-[60ch] md:text-lg">${page.lead}</p><div class="mt-8">${primaryCta("Cadrer mon recrutement")}</div></div>
      <aside class="border-l border-border/70 pl-6"><p class="text-xs font-semibold text-muted-foreground">EXEMPLE DE BESOIN</p><p class="mt-3 text-xl font-semibold text-foreground">${page.exampleRole}</p><p class="mt-4 text-sm leading-relaxed text-muted-foreground">Un poste transverse, plusieurs priorités et peu de temps disponible pour organiser la sélection.</p><a href="#use-cases" class="mt-6 inline-flex text-sm font-semibold text-foreground">Explorer les Use cases →</a></aside>
    </div>
  </div>
</section>
<section id="use-cases" class="bg-background py-20 md:py-24"><div class="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr]"><div><p class="text-sm font-semibold text-muted-foreground">USE CASES</p><h2 class="section-heading mt-3">Des situations où la structure fait gagner du temps</h2><p class="section-intro mt-5">Un format volontairement direct pour décider quoi déléguer et quoi garder en interne.</p></div><ol>${cases}</ol></div></section>
<section class="bg-foreground py-20 text-background md:py-24"><div class="mx-auto max-w-7xl px-6"><div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]"><div><p class="text-sm font-semibold opacity-70">RÉSULTATS</p><h2 class="section-heading mt-3 text-background">Un dossier de décision, pas une pile de CV</h2></div><div class="grid gap-5 md:grid-cols-3">${page.results.map(([title, text], index) => `<article class="border-t border-background pt-5"><p class="text-xs font-semibold opacity-70">0${index + 1}</p><h3 class="mt-4 text-lg font-semibold">${title}</h3><p class="mt-3 text-sm leading-relaxed opacity-70">${text}</p></article>`).join("")}</div></div></div></section>
<section class="bg-muted/30 py-20 md:py-24"><div class="mx-auto max-w-7xl px-6"><div class="grid gap-5 md:grid-cols-3"><article class="rounded-2xl bg-background p-6"><p class="text-sm font-semibold text-foreground">Cadrer</p><p class="mt-3 text-sm text-muted-foreground">Priorités, responsabilités et critères réellement indispensables.</p></article><article class="rounded-2xl bg-background p-6"><p class="text-sm font-semibold text-foreground">Comparer</p><p class="mt-3 text-sm text-muted-foreground">Une même lecture pour chaque candidature et des écarts visibles.</p></article><article class="rounded-2xl bg-background p-6"><p class="text-sm font-semibold text-foreground">Décider</p><p class="mt-3 text-sm text-muted-foreground">Une shortlist expliquée. Votre équipe garde le dernier mot.</p></article></div><div class="mt-10 text-center"><h2 class="section-heading">${page.closing}</h2><div class="mt-7">${primaryCta("Décrire le poste")}</div></div></div></section>`;
}

function ongTemplate(page) {
  const cases = page.useCases.map(([title, text], index) => `<article class="rounded-2xl border border-border/70 bg-background p-6 md:p-8"><div class="flex items-start gap-4"><span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">${index + 1}</span><div><h3 class="text-lg font-semibold text-foreground">${title}</h3><p class="mt-3 text-sm leading-relaxed text-muted-foreground">${text}</p></div></div></article>`).join("");
  return `
<section class="bg-muted/30"><div class="mx-auto grid min-w-0 max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28"><div class="max-w-2xl"><p class="text-sm font-semibold text-muted-foreground">RECRUTEMENT · ONG</p><h1 class="display-heading-compact mt-4">${page.title}</h1><p class="body-copy mt-6 max-w-[60ch] md:text-lg">${page.lead}</p><div class="mt-8">${primaryCta("Parler de la mission")}</div></div><aside class="rounded-2xl bg-foreground p-6 text-background md:p-8"><p class="text-xs font-semibold opacity-70">NOTE DE MISSION</p><p class="mt-4 text-2xl font-semibold">${page.exampleRole}</p><dl class="mt-8 space-y-5 text-sm"><div class="flex justify-between gap-4 border-t border-background pt-4"><dt class="opacity-70">Contexte</dt><dd class="text-right">Programme &amp; terrain</dd></div><div class="flex justify-between gap-4 border-t border-background pt-4"><dt class="opacity-70">Lecture</dt><dd class="text-right">Critères partagés</dd></div><div class="flex justify-between gap-4 border-t border-background pt-4"><dt class="opacity-70">Décision</dt><dd class="text-right">Documentée &amp; humaine</dd></div></dl></aside></div></section>
<section id="use-cases" class="bg-muted/30 py-20 md:py-24"><div class="mx-auto max-w-7xl px-6"><div class="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]"><div class="max-w-xl"><p class="text-sm font-semibold text-muted-foreground">USE CASES</p><h2 class="section-heading mt-3">Partir de la mission, pas d’une fiche générique</h2><p class="section-intro mt-5">Les critères changent avec le programme, le terrain, les responsabilités et les personnes impliquées dans la décision.</p></div><div class="space-y-5">${cases}</div></div></div></section>
<section class="bg-background py-20 md:py-24"><div class="mx-auto max-w-7xl px-6"><div class="mx-auto max-w-3xl text-center"><p class="text-sm font-semibold text-muted-foreground">RÉSULTATS</p><h2 class="section-heading mt-3">Une lecture commune entre siège, programme et terrain</h2></div><div class="mt-12 grid gap-5 md:grid-cols-3">${cards(page.results, true)}</div></div></section>
<section class="border-y border-border/60 bg-background py-20 md:py-24"><div class="mx-auto max-w-5xl px-6"><p class="text-sm font-semibold text-muted-foreground">FIL DE DÉCISION</p><ol class="mt-8 grid gap-0 md:grid-cols-3"><li class="border-t border-border/70 py-6 md:pr-6"><p class="text-sm font-semibold text-foreground">01 · Aligner</p><p class="mt-3 text-sm text-muted-foreground">Les parties prenantes valident la mission et les critères.</p></li><li class="border-t border-border/70 py-6 md:px-6"><p class="text-sm font-semibold text-foreground">02 · Évaluer</p><p class="mt-3 text-sm text-muted-foreground">Les profils sont lus dans le contexte réel du programme.</p></li><li class="border-t border-border/70 py-6 md:pl-6"><p class="text-sm font-semibold text-foreground">03 · Documenter</p><p class="mt-3 text-sm text-muted-foreground">La shortlist conserve les raisons et points à approfondir.</p></li></ol><div class="mt-10 rounded-2xl bg-muted/40 p-6 text-center md:p-8"><h2 class="section-heading">${page.closing}</h2><p class="section-intro mx-auto mt-4 max-w-[58ch]">Présentez-nous le programme, le contexte du poste et les personnes qui participeront à la sélection.</p><div class="mt-7">${primaryCta("Préparer la mission")}</div></div></div></section>`;
}

function operationsTemplate(page) {
  const situations = page.useCases.map(([title, text], index) => `<article class="grid gap-4 border-t border-border/70 py-7 md:grid-cols-[0.2fr_0.8fr]"><span class="text-2xl font-semibold text-foreground">0${index + 1}</span><div><h3 class="text-lg font-semibold text-foreground">${title}</h3><p class="mt-2 text-sm leading-relaxed text-muted-foreground">${text}</p></div></article>`).join("");
  return `
<section class="border-b border-border/60 bg-background"><div class="mx-auto max-w-7xl px-6 py-16 lg:py-24"><div class="max-w-5xl"><p class="text-sm font-semibold text-muted-foreground">RECRUTEMENT · MÉTIERS OPÉRATIONNELS</p><h1 class="display-heading-compact mt-4">${page.title}</h1></div><div class="mt-10 grid gap-8 border-t border-border/70 pt-8 lg:grid-cols-2"><p class="body-copy max-w-[60ch] md:text-lg">${page.lead}</p><div class="flex flex-col items-start gap-5"><div class="flex flex-wrap gap-2">${page.proof.map((item) => `<span class="rounded-full border border-border/70 bg-muted/30 px-3 py-2 text-xs font-medium text-foreground">${item}</span>`).join("")}</div>${primaryCta("Évaluer un besoin terrain")}</div></div></div></section>
<section class="bg-foreground py-12 text-background"><div class="mx-auto max-w-7xl px-6"><div class="grid gap-6 md:grid-cols-3"><div><p class="text-xs font-semibold opacity-70">POSTE REPÈRE</p><p class="mt-2 text-lg font-semibold">${page.exampleRole}</p></div><div><p class="text-xs font-semibold opacity-70">ON OBSERVE</p><p class="mt-2 text-lg font-semibold">Méthode · sécurité · coopération</p></div><div><p class="text-xs font-semibold opacity-70">ON RESTITUE</p><p class="mt-2 text-lg font-semibold">Écarts · vigilance · questions</p></div></div></div></section>
<section id="use-cases" class="bg-background py-20 md:py-24"><div class="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr]"><div><p class="text-sm font-semibold text-muted-foreground">USE CASES</p><h2 class="section-heading mt-3">Trois réalités du recrutement terrain</h2><p class="section-intro mt-5">Le CV ouvre la discussion. Les situations de travail permettent de la rendre concrète.</p></div><div>${situations}</div></div></section>
<section class="bg-muted/30 py-20 md:py-24"><div class="mx-auto max-w-7xl px-6"><div class="grid gap-12 lg:grid-cols-2"><div><p class="text-sm font-semibold text-muted-foreground">RÉSULTATS</p><h2 class="section-heading mt-3">Le rapport terrain</h2><p class="section-intro mt-5">Une restitution organisée autour de ce qui a été observé, de ce qui reste à vérifier et de ce qui doit être discuté en entretien.</p></div><div class="rounded-2xl bg-foreground p-6 text-background md:p-8"><p class="text-xs font-semibold opacity-70">SYNTHÈSE DE SÉLECTION</p><div class="mt-7 space-y-6">${page.results.map(([title, text], index) => `<div class="flex gap-4 border-t border-background pt-5"><span class="text-sm font-semibold opacity-70">${index + 1}</span><div><h3 class="text-base font-semibold">${title}</h3><p class="mt-2 text-sm leading-relaxed opacity-70">${text}</p></div></div>`).join("")}</div></div></div></div></section>
<section class="bg-background py-20 md:py-24"><div class="mx-auto max-w-7xl px-6"><div class="grid gap-5 md:grid-cols-3"><article class="rounded-2xl border border-border/70 p-6"><p class="text-xs font-semibold text-muted-foreground">AVANT</p><h3 class="mt-3 text-lg font-semibold text-foreground">Définir les gestes et décisions clés</h3></article><article class="rounded-2xl border border-border/70 p-6"><p class="text-xs font-semibold text-muted-foreground">PENDANT</p><h3 class="mt-3 text-lg font-semibold text-foreground">Observer le raisonnement en situation</h3></article><article class="rounded-2xl border border-border/70 p-6"><p class="text-xs font-semibold text-muted-foreground">APRÈS</p><h3 class="mt-3 text-lg font-semibold text-foreground">Séparer acquis et vérifications</h3></article></div><div class="mt-12 flex flex-col items-start justify-between gap-6 border-t border-border/70 pt-10 md:flex-row md:items-center"><div><h2 class="section-heading">${page.closing}</h2><p class="mt-3 text-sm text-muted-foreground">Votre équipe conserve la validation des exigences et la décision finale.</p></div>${primaryCta("Décrire le poste terrain")}</div></div></section>`;
}

export function applyRecruitmentUseCasesPage(document, route) {
  const page = pages[route];
  if (!page) return;
  function findMain(node) {
    if (node.tagName === "main") return node;
    for (const child of node.childNodes ?? []) {
      const match = findMain(child);
      if (match) return match;
    }
    return null;
  }
  const main = findMain(document);
  if (!main) return;
  const replacement = parseFragment(pageTemplate(page)).childNodes;
  for (const node of replacement) node.parentNode = main;
  main.childNodes = replacement;
}
