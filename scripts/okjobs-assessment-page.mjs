import { parseFragment } from "parse5";

const assessmentPage = `
<section class="border-b border-border/60 bg-background">
  <div class="mx-auto grid min-w-0 max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
    <div class="min-w-0 max-w-2xl">
      <p class="text-sm font-semibold text-muted-foreground">ASSESSMENT</p>
      <h1 class="display-heading-compact mt-4">Évaluez les compétences qui comptent vraiment pour le poste.</h1>
      <p class="body-copy mt-6 max-w-[60ch] md:text-lg">Définissez vos critères, invitez les candidats aux évaluations utiles et retrouvez des résultats contextualisés pour préparer vos entretiens avec plus de précision.</p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <a href="/signup" class="group/button inline-flex h-11 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-[color,background-color,scale] duration-150 hover:bg-primary/80 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Créer mon Assessment
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 size-4" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
        <a href="#methode" class="inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-background px-7 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Voir la méthode</a>
      </div>
      <div class="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
        <span class="flex items-center gap-2"><span class="text-foreground">✓</span> Critères liés au poste</span>
        <span class="flex items-center gap-2"><span class="text-foreground">✓</span> Rapports contextualisés</span>
        <span class="flex items-center gap-2"><span class="text-foreground">✓</span> Décision humaine</span>
      </div>
    </div>

    <div class="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-muted/40 p-5 shadow-lg md:p-7" aria-label="Exemple de configuration Assessment">
      <div class="flex items-start justify-between gap-4 border-b border-border/70 pb-5">
        <div class="min-w-0">
          <p class="text-xs font-semibold text-muted-foreground">ASSESSMENT EN PRÉPARATION</p>
          <p class="mt-1 text-lg font-semibold text-foreground">Technicien de maintenance</p>
        </div>
        <span class="shrink-0 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-foreground">Prêt à inviter</span>
      </div>
      <div class="mt-5 space-y-3">
        <div class="rounded-xl border border-border/70 bg-background p-4">
          <div class="flex items-center justify-between gap-4"><p class="text-sm font-semibold text-foreground">Critères prioritaires</p><span class="text-xs text-muted-foreground">3 définis</span></div>
          <div class="mt-3 flex flex-wrap gap-2">
            <span class="rounded-full bg-muted px-3 py-1 text-xs text-foreground">Diagnostic</span>
            <span class="rounded-full bg-muted px-3 py-1 text-xs text-foreground">Sécurité</span>
            <span class="rounded-full bg-muted px-3 py-1 text-xs text-foreground">Autonomie</span>
          </div>
        </div>
        <div class="rounded-xl border border-border/70 bg-background p-4">
          <p class="text-sm font-semibold text-foreground">Parcours sélectionné</p>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">Mise en situation, raisonnement métier et questions de vérification.</p>
        </div>
        <div class="rounded-xl bg-foreground p-4 text-background">
          <p class="text-xs font-semibold opacity-70">À LA FIN DU PARCOURS</p>
          <p class="mt-1 text-sm font-semibold">Un rapport lisible pour préparer l’entretien</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="bg-background py-20 md:py-24">
  <div class="mx-auto max-w-7xl px-6">
    <div class="max-w-3xl">
      <p class="text-sm font-semibold text-muted-foreground">AU-DELÀ DU CV</p>
      <h2 class="section-heading mt-3">Comparez les profils sur les mêmes bases</h2>
      <p class="section-intro mt-5">L’Assessment ajoute des éléments observés au parcours déclaré, sans confondre une évaluation avec une décision de recrutement.</p>
    </div>
    <div class="mt-10 grid gap-5 md:grid-cols-3">
      <article class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <span class="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </span>
        <h3 class="mt-5 text-lg font-semibold text-foreground">Des critères définis avant</h3>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Votre équipe précise les compétences attendues et leur importance avant de consulter les résultats.</p>
      </article>
      <article class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <span class="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 16 4-4 4 2 4-6"/></svg>
        </span>
        <h3 class="mt-5 text-lg font-semibold text-foreground">Des résultats contextualisés</h3>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Les observations sont rapprochées du poste, du parcours déclaré et des limites de la méthode utilisée.</p>
      </article>
      <article class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <span class="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg>
        </span>
        <h3 class="mt-5 text-lg font-semibold text-foreground">Des entretiens mieux ciblés</h3>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Les écarts, incohérences et informations manquantes deviennent des questions concrètes à approfondir.</p>
      </article>
    </div>
  </div>
</section>

<section id="methode" class="border-y border-border/60 bg-muted/30 py-20 md:py-24">
  <div class="mx-auto max-w-7xl px-6">
    <div class="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
      <div class="max-w-xl">
        <p class="text-sm font-semibold text-muted-foreground">UN PARCOURS SIMPLE</p>
        <h2 class="section-heading mt-3">De vos critères au rapport candidat</h2>
        <p class="section-intro mt-5">Vous gardez le pilotage du poste et des invitations. Okjobs structure le parcours d’évaluation et restitue les résultats avec leur contexte.</p>
      </div>
      <ol class="space-y-4">
        <li class="flex gap-4 rounded-2xl border border-border/70 bg-background p-5">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">1</span>
          <div><h3 class="text-base font-semibold text-foreground">Définissez le poste</h3><p class="mt-2 text-sm leading-relaxed text-muted-foreground">Renseignez les responsabilités, les compétences attendues et les critères prioritaires.</p></div>
        </li>
        <li class="flex gap-4 rounded-2xl border border-border/70 bg-background p-5">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">2</span>
          <div><h3 class="text-base font-semibold text-foreground">Configurez et invitez</h3><p class="mt-2 text-sm leading-relaxed text-muted-foreground">Choisissez les évaluations pertinentes, puis envoyez les invitations aux candidats concernés.</p></div>
        </li>
        <li class="flex gap-4 rounded-2xl border border-border/70 bg-background p-5">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">3</span>
          <div><h3 class="text-base font-semibold text-foreground">Lisez les résultats et décidez</h3><p class="mt-2 text-sm leading-relaxed text-muted-foreground">Comparez les rapports, repérez les points à confirmer et préparez votre entretien.</p></div>
        </li>
      </ol>
    </div>
  </div>
</section>

<section class="bg-background py-20 md:py-24">
  <div class="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
    <div class="max-w-xl">
      <p class="text-sm font-semibold text-muted-foreground">UN RAPPORT À INTERPRÉTER</p>
      <h2 class="section-heading mt-3">Comprenez ce qui a été observé</h2>
      <p class="section-intro mt-5">Chaque résultat indique le critère concerné, les éléments observés et les précautions de lecture. L’objectif est de préparer votre jugement, pas de le remplacer.</p>
      <ul class="mt-7 space-y-4 text-sm text-muted-foreground">
        <li class="flex gap-3"><span class="text-foreground">✓</span><span>Correspondances avec les attentes du poste</span></li>
        <li class="flex gap-3"><span class="text-foreground">✓</span><span>Écarts et informations qui restent à vérifier</span></li>
        <li class="flex gap-3"><span class="text-foreground">✓</span><span>Questions proposées pour l’entretien</span></li>
      </ul>
    </div>
    <div class="min-w-0 rounded-2xl border border-border/70 bg-muted/30 p-5 md:p-7">
      <div class="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div><p class="text-xs font-semibold text-muted-foreground">EXTRAIT DU RAPPORT</p><p class="mt-1 text-base font-semibold text-foreground">Diagnostic d’une panne</p></div>
        <span class="shrink-0 rounded-full bg-background px-3 py-1 text-xs text-foreground">Mise en situation</span>
      </div>
      <div class="mt-5 grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-border/70 bg-background p-4"><p class="text-xs font-semibold text-muted-foreground">OBSERVÉ</p><p class="mt-2 text-sm text-foreground">Hypothèses formulées dans un ordre cohérent</p></div>
        <div class="rounded-xl border border-border/70 bg-background p-4"><p class="text-xs font-semibold text-muted-foreground">À VÉRIFIER</p><p class="mt-2 text-sm text-foreground">Priorisation lorsque plusieurs urgences se présentent</p></div>
      </div>
      <div class="mt-3 rounded-xl bg-foreground p-4 text-background"><p class="text-xs font-semibold opacity-70">QUESTION D’ENTRETIEN</p><p class="mt-2 text-sm">« Comment organisez-vous votre diagnostic quand le temps est limité ? »</p></div>
    </div>
  </div>
</section>

<section class="border-y border-border/60 bg-muted/30 py-20 md:py-24">
  <div class="mx-auto max-w-7xl px-6">
    <div class="mx-auto max-w-3xl text-center">
      <p class="text-sm font-semibold text-muted-foreground">UN CADRE RESPONSABLE</p>
      <h2 class="section-heading mt-3">Ce que l’Assessment apporte — et ce qu’il ne remplace pas</h2>
    </div>
    <div class="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
      <div class="rounded-2xl border border-border/70 bg-background p-6 md:p-8">
        <p class="text-sm font-semibold text-foreground">Il vous aide à</p>
        <ul class="mt-5 space-y-4 text-sm text-muted-foreground">
          <li class="flex gap-3"><span class="text-foreground">✓</span><span>Observer certaines compétences liées au poste</span></li>
          <li class="flex gap-3"><span class="text-foreground">✓</span><span>Appliquer des critères communs aux candidats</span></li>
          <li class="flex gap-3"><span class="text-foreground">✓</span><span>Préparer les vérifications humaines</span></li>
        </ul>
      </div>
      <div class="rounded-2xl border border-border/70 bg-background p-6 md:p-8">
        <p class="text-sm font-semibold text-foreground">Il ne remplace pas</p>
        <ul class="mt-5 space-y-4 text-sm text-muted-foreground">
          <li class="flex gap-3"><span class="text-foreground">—</span><span>La vérification des références et habilitations</span></li>
          <li class="flex gap-3"><span class="text-foreground">—</span><span>L’entretien et les échanges avec le candidat</span></li>
          <li class="flex gap-3"><span class="text-foreground">—</span><span>La décision finale de votre équipe</span></li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="bg-background py-20 md:py-24">
  <div class="mx-auto max-w-4xl px-6 text-center">
    <h2 class="section-heading">Préparez votre prochain Assessment</h2>
    <p class="section-intro mx-auto mt-5 max-w-[58ch]">Créez le poste, définissez les compétences prioritaires et choisissez les évaluations utiles à votre décision.</p>
    <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
      <a href="/signup" class="group/button inline-flex h-11 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-[color,background-color,scale] duration-150 hover:bg-primary/80 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Créer mon espace entreprise
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 size-4" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </a>
      <a href="/pricing/" class="inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-background px-7 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Voir les offres</a>
    </div>
    <p class="fine-print mt-5">Les résultats servent d’aide à la décision. Votre équipe conserve le choix final.</p>
  </div>
</section>`;

export function applyAssessmentPage(document) {
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
  const replacement = parseFragment(assessmentPage).childNodes;
  for (const node of replacement) node.parentNode = main;
  main.childNodes = replacement;
}
