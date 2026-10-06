import { parseFragment } from "parse5";

const trainingPage = `
<section class="border-b border-border/60 bg-background">
  <div class="mx-auto grid min-w-0 max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
    <div class="min-w-0 max-w-2xl">
      <p class="text-sm font-semibold text-muted-foreground">FORMATION RH</p>
      <h1 class="display-heading-compact mt-4">Donnez à votre équipe des repères communs pour mieux recruter.</h1>
      <p class="body-copy mt-6 max-w-[60ch] md:text-lg">Okjobs forme les dirigeants et les équipes RH à clarifier un besoin, évaluer avec méthode, conduire des entretiens structurés et documenter leurs décisions.</p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <a href="/signup" class="group/button inline-flex h-11 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-[color,background-color,scale] duration-150 hover:bg-primary/80 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Construire ma formation
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 size-4" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
        <a href="#programme" class="inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-background px-7 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Voir le programme</a>
      </div>
      <div class="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
        <span class="flex items-center gap-2"><span class="text-foreground">✓</span> Cas issus de votre activité</span>
        <span class="flex items-center gap-2"><span class="text-foreground">✓</span> Outils réutilisables</span>
        <span class="flex items-center gap-2"><span class="text-foreground">✓</span> Format adapté à l’équipe</span>
      </div>
    </div>

    <div class="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-muted/40 p-5 shadow-lg md:p-7" aria-label="Exemple de programme de formation RH">
      <div class="flex items-start justify-between gap-4 border-b border-border/70 pb-5">
        <div class="min-w-0">
          <p class="text-xs font-semibold text-muted-foreground">PROGRAMME EXEMPLE</p>
          <p class="mt-1 text-lg font-semibold text-foreground">Structurer ses recrutements</p>
        </div>
        <span class="shrink-0 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-foreground">Sur mesure</span>
      </div>
      <ol class="mt-5 space-y-3">
        <li class="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-4">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">1</span>
          <div class="min-w-0"><p class="text-sm font-semibold text-foreground">Définir les bons critères</p><p class="mt-1 text-sm text-muted-foreground">Passer de la fiche de poste à des attentes observables.</p></div>
        </li>
        <li class="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-4">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">2</span>
          <div class="min-w-0"><p class="text-sm font-semibold text-foreground">Conduire un entretien structuré</p><p class="mt-1 text-sm text-muted-foreground">Questionner, écouter et vérifier avec la même méthode.</p></div>
        </li>
        <li class="flex items-center gap-3 rounded-xl bg-foreground p-4 text-background">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold text-foreground">3</span>
          <div class="min-w-0"><p class="text-sm font-semibold">Décider et expliquer</p><p class="mt-1 text-sm opacity-70">Comparer les éléments recueillis sans réduire un profil à une note.</p></div>
        </li>
      </ol>
    </div>
  </div>
</section>

<section class="bg-background py-20 md:py-24">
  <div class="mx-auto max-w-7xl px-6">
    <div class="max-w-3xl">
      <p class="text-sm font-semibold text-muted-foreground">DES PRATIQUES DIRECTEMENT APPLICABLES</p>
      <h2 class="section-heading mt-3">Formez votre équipe autour d’une méthode commune</h2>
      <p class="section-intro mt-5">La formation relie les principes RH aux situations que votre équipe rencontre réellement, afin que chacun sache quoi observer et comment en parler.</p>
    </div>
    <div class="mt-10 grid gap-5 md:grid-cols-3">
      <article class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <span class="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </span>
        <h3 class="mt-5 text-lg font-semibold text-foreground">Cadrer avant d’évaluer</h3>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Clarifiez les responsabilités, les compétences prioritaires et les critères qui doivent guider la sélection.</p>
      </article>
      <article class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <span class="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg>
        </span>
        <h3 class="mt-5 text-lg font-semibold text-foreground">Questionner avec méthode</h3>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Préparez des questions liées au poste et distinguez les faits, les interprétations et les points à vérifier.</p>
      </article>
      <article class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <span class="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 16 4-4 4 2 4-6"/></svg>
        </span>
        <h3 class="mt-5 text-lg font-semibold text-foreground">Décider de façon lisible</h3>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Mettez les profils en regard des mêmes attentes et conservez les raisons qui soutiennent la décision finale.</p>
      </article>
    </div>
  </div>
</section>

<section id="programme" class="border-y border-border/60 bg-muted/30 py-20 md:py-24">
  <div class="mx-auto max-w-7xl px-6">
    <div class="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
      <div class="max-w-xl">
        <p class="text-sm font-semibold text-muted-foreground">UN PROGRAMME MODULABLE</p>
        <h2 class="section-heading mt-3">Quatre modules à adapter à vos enjeux</h2>
        <p class="section-intro mt-5">Le contenu est cadré avec vous. Chaque module associe repères, exemples et mise en pratique pour faciliter le passage à l’action.</p>
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <article class="rounded-2xl border border-border/70 bg-background p-6">
          <span class="text-sm font-semibold text-muted-foreground">01</span>
          <h3 class="mt-4 text-lg font-semibold text-foreground">Besoin et critères</h3>
          <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Traduire les responsabilités du poste en compétences et niveaux attendus.</p>
        </article>
        <article class="rounded-2xl border border-border/70 bg-background p-6">
          <span class="text-sm font-semibold text-muted-foreground">02</span>
          <h3 class="mt-4 text-lg font-semibold text-foreground">Lecture des candidatures</h3>
          <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Analyser un parcours, lire une évaluation et repérer ce qui reste à confirmer.</p>
        </article>
        <article class="rounded-2xl border border-border/70 bg-background p-6">
          <span class="text-sm font-semibold text-muted-foreground">03</span>
          <h3 class="mt-4 text-lg font-semibold text-foreground">Entretien structuré</h3>
          <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Construire une trame, approfondir les situations et réduire les écarts d’interprétation.</p>
        </article>
        <article class="rounded-2xl border border-border/70 bg-background p-6">
          <span class="text-sm font-semibold text-muted-foreground">04</span>
          <h3 class="mt-4 text-lg font-semibold text-foreground">Décision documentée</h3>
          <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Comparer les informations recueillies et argumenter la sélection auprès de l’équipe.</p>
        </article>
      </div>
    </div>
  </div>
</section>

<section class="bg-background py-20 md:py-24">
  <div class="mx-auto max-w-7xl px-6">
    <div class="mx-auto max-w-3xl text-center">
      <p class="text-sm font-semibold text-muted-foreground">POUR VOTRE ORGANISATION</p>
      <h2 class="section-heading mt-3">Un même socle, deux angles de travail</h2>
      <p class="section-intro mx-auto mt-5">Le programme tient compte du rôle des participants et des décisions qu’ils doivent prendre au quotidien.</p>
    </div>
    <div class="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
      <article class="rounded-2xl border border-border/70 bg-muted/30 p-6 md:p-8">
        <p class="text-xs font-semibold text-muted-foreground">DIRIGEANTS</p>
        <h3 class="mt-3 text-xl font-semibold text-foreground">Piloter sans improviser</h3>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Structurez vos attentes, organisez les validations importantes et gardez une lecture claire lorsque le recrutement mobilise peu de ressources internes.</p>
        <ul class="mt-5 space-y-3 text-sm text-muted-foreground">
          <li class="flex gap-3"><span class="text-foreground">✓</span><span>Clarifier le besoin avec les opérationnels</span></li>
          <li class="flex gap-3"><span class="text-foreground">✓</span><span>Arbitrer avec des critères partagés</span></li>
        </ul>
      </article>
      <article class="rounded-2xl border border-border/70 bg-background p-6 md:p-8">
        <p class="text-xs font-semibold text-muted-foreground">ÉQUIPES RH</p>
        <h3 class="mt-3 text-xl font-semibold text-foreground">Harmoniser les pratiques</h3>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Donnez aux recruteurs et managers une méthode commune pour préparer les entretiens, interpréter les résultats et restituer leurs conclusions.</p>
        <ul class="mt-5 space-y-3 text-sm text-muted-foreground">
          <li class="flex gap-3"><span class="text-foreground">✓</span><span>Utiliser une grille commune</span></li>
          <li class="flex gap-3"><span class="text-foreground">✓</span><span>Documenter les points de vigilance</span></li>
        </ul>
      </article>
    </div>
  </div>
</section>

<section class="border-y border-border/60 bg-muted/30 py-20 md:py-24">
  <div class="mx-auto max-w-7xl px-6">
    <div class="max-w-3xl">
      <p class="text-sm font-semibold text-muted-foreground">DES SUPPORTS QUI RESTENT</p>
      <h2 class="section-heading mt-3">Repartez avec des outils utilisables dès le prochain recrutement</h2>
    </div>
    <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-2xl border border-border/70 bg-background p-5"><p class="text-sm font-semibold text-foreground">Canevas de besoin</p><p class="mt-2 text-sm text-muted-foreground">Pour cadrer le poste avec les managers.</p></div>
      <div class="rounded-2xl border border-border/70 bg-background p-5"><p class="text-sm font-semibold text-foreground">Grille d’entretien</p><p class="mt-2 text-sm text-muted-foreground">Pour appliquer les mêmes repères.</p></div>
      <div class="rounded-2xl border border-border/70 bg-background p-5"><p class="text-sm font-semibold text-foreground">Trame de synthèse</p><p class="mt-2 text-sm text-muted-foreground">Pour distinguer faits et interprétations.</p></div>
      <div class="rounded-2xl border border-border/70 bg-background p-5"><p class="text-sm font-semibold text-foreground">Plan d’action</p><p class="mt-2 text-sm text-muted-foreground">Pour ancrer les pratiques après la formation.</p></div>
    </div>
  </div>
</section>

<section class="bg-background py-20 md:py-24">
  <div class="mx-auto max-w-4xl px-6 text-center">
    <h2 class="section-heading">Construisons une formation adaptée à votre équipe</h2>
    <p class="section-intro mx-auto mt-5 max-w-[58ch]">Présentez-nous vos pratiques actuelles, les profils à former et les difficultés rencontrées. Nous définirons ensemble les objectifs et les modules utiles.</p>
    <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
      <a href="/signup" class="group/button inline-flex h-11 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-[color,background-color,scale] duration-150 hover:bg-primary/80 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Décrire mon besoin
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 size-4" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </a>
      <a href="/pricing/" class="inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-background px-7 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Voir les autres services</a>
    </div>
    <p class="fine-print mt-5">Le programme, le format et les livrables sont définis avec votre organisation avant la formation.</p>
  </div>
</section>`;

export function applyTrainingPage(document) {
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
  const replacement = parseFragment(trainingPage).childNodes;
  for (const node of replacement) node.parentNode = main;
  main.childNodes = replacement;
}
