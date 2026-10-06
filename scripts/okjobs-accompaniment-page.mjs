import { parseFragment } from "parse5";

const accompanimentPage = `
<section class="border-b border-border/60 bg-background">
  <div class="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
    <div class="max-w-2xl">
      <p class="text-sm font-semibold text-muted-foreground">ACCOMPAGNEMENT SUR MESURE</p>
      <h1 class="display-heading-compact mt-4">Un recrutement important mérite un cadre adapté.</h1>
      <p class="body-copy mt-6 max-w-[60ch] md:text-lg">Vous avez un poste particulier, beaucoup de candidatures ou peu de ressources RH ? Définissons ensemble les étapes à structurer, les livrables attendus et les décisions que votre équipe doit conserver.</p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <a href="/signup" class="group/button inline-flex h-11 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-[color,background-color,scale] duration-150 hover:bg-primary/80 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Décrire mon besoin
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 size-4" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
        <a href="/pricing/" class="inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-background px-7 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Voir les offres</a>
      </div>
      <p class="fine-print mt-4">Votre équipe garde la décision finale. Le périmètre est défini avant la mission.</p>
    </div>

    <div class="rounded-2xl border border-border/70 bg-muted/40 p-5 shadow-lg md:p-7">
      <div class="flex items-start justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <p class="text-xs font-semibold text-muted-foreground">EXEMPLE DE MISSION</p>
          <p class="mt-1 text-lg font-semibold text-foreground">Responsable administratif</p>
        </div>
        <span class="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-foreground">Sur devis</span>
      </div>
      <ol class="mt-5 space-y-3">
        <li class="flex gap-3 rounded-xl border border-border/70 bg-background p-4">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">1</span>
          <div><p class="text-sm font-semibold text-foreground">Clarifier le poste</p><p class="mt-1 text-sm text-muted-foreground">Responsabilités, contraintes et compétences indispensables.</p></div>
        </li>
        <li class="flex gap-3 rounded-xl border border-border/70 bg-background p-4">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">2</span>
          <div><p class="text-sm font-semibold text-foreground">Comparer sur les mêmes bases</p><p class="mt-1 text-sm text-muted-foreground">Informations, évaluations et critères appliqués avec cohérence.</p></div>
        </li>
        <li class="flex gap-3 rounded-xl border border-border/70 bg-background p-4">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">3</span>
          <div><p class="text-sm font-semibold text-foreground">Préparer votre décision</p><p class="mt-1 text-sm text-muted-foreground">Shortlist expliquée et questions à approfondir en entretien.</p></div>
        </li>
      </ol>
    </div>
  </div>
</section>

<section class="bg-background py-20 md:py-24">
  <div class="mx-auto max-w-7xl px-6">
    <div class="max-w-3xl">
      <p class="text-sm font-semibold text-muted-foreground">UN PÉRIMÈTRE CLAIR</p>
      <h2 class="section-heading mt-3">Choisissez le niveau d’appui utile à votre équipe</h2>
      <p class="section-intro mt-5">L’accompagnement ne remplace pas votre jugement. Il structure les étapes qui prennent du temps et rend les éléments de décision plus lisibles.</p>
    </div>
    <div class="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      <article class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <span class="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </span>
        <h3 class="mt-5 text-lg font-semibold text-foreground">Assessment</h3>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Votre équipe pilote le recrutement. Okjobs fournit les évaluations et les rapports pour comparer les profils et préparer les entretiens.</p>
      </article>
      <article class="rounded-2xl border border-foreground bg-foreground p-6 text-background shadow-lg">
        <span class="flex size-10 items-center justify-center rounded-full bg-background text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg>
        </span>
        <p class="mt-5 text-xs font-semibold opacity-70">LE PLUS COMPLET</p>
        <h3 class="mt-1 text-lg font-semibold">Recrutement</h3>
        <p class="mt-3 text-sm leading-relaxed opacity-80">Nous cadrons avec vous les étapes convenues, de la clarification du besoin à la préparation d’une shortlist documentée.</p>
      </article>
      <article class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <span class="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </span>
        <h3 class="mt-5 text-lg font-semibold text-foreground">Mission personnalisée</h3>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Un volume inhabituel, un métier spécifique ou une contrainte interne ? Nous construisons uniquement les livrables nécessaires.</p>
      </article>
      <article class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <span class="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M12 20h9"/><path d="M12 4h9"/><path d="M4 9h16"/><path d="M4 15h16"/><path d="M4 4h.01"/><path d="M4 20h.01"/></svg>
        </span>
        <h3 class="mt-5 text-lg font-semibold text-foreground">Formation</h3>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Des formations RH pour aider les dirigeants et les équipes RH à structurer les critères, les entretiens et les décisions.</p>
      </article>
    </div>
  </div>
</section>

<section class="border-y border-border/60 bg-muted/30 py-20 md:py-24">
  <div class="mx-auto max-w-7xl px-6">
    <div class="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
      <div class="max-w-xl">
        <p class="text-sm font-semibold text-muted-foreground">UNE MISSION LISIBLE</p>
        <h2 class="section-heading mt-3">Avant de commencer, chacun sait qui fait quoi</h2>
        <p class="section-intro mt-5">Le devis précise les étapes, les responsabilités, les livrables et les données nécessaires. Vous ne payez pas pour un accompagnement dont vous n’avez pas besoin.</p>
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="rounded-2xl border border-border/70 bg-background p-6">
          <p class="text-sm font-semibold text-foreground">Votre équipe conserve</p>
          <ul class="mt-5 space-y-4 text-sm text-muted-foreground">
            <li class="flex gap-3"><span class="text-foreground">✓</span><span>La validation du besoin et des critères</span></li>
            <li class="flex gap-3"><span class="text-foreground">✓</span><span>Les échanges sensibles avec les candidats</span></li>
            <li class="flex gap-3"><span class="text-foreground">✓</span><span>La décision finale de recrutement</span></li>
          </ul>
        </div>
        <div class="rounded-2xl border border-border/70 bg-background p-6">
          <p class="text-sm font-semibold text-foreground">Okjobs peut prendre en charge</p>
          <ul class="mt-5 space-y-4 text-sm text-muted-foreground">
            <li class="flex gap-3"><span class="text-foreground">✓</span><span>La structuration des critères du poste</span></li>
            <li class="flex gap-3"><span class="text-foreground">✓</span><span>Les évaluations et rapports comparables</span></li>
            <li class="flex gap-3"><span class="text-foreground">✓</span><span>La préparation d’une shortlist expliquée</span></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="bg-background py-20 md:py-24">
  <div class="mx-auto max-w-4xl px-6 text-center">
    <h2 class="section-heading">Parlons du poste et des décisions à préparer</h2>
    <p class="section-intro mx-auto mt-5 max-w-[58ch]">Indiquez-nous le type de poste, le volume de candidatures et les étapes sur lesquelles votre équipe souhaite être accompagnée.</p>
    <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
      <a href="/signup" class="group/button inline-flex h-11 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-[color,background-color,scale] duration-150 hover:bg-primary/80 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Décrire mon besoin
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 size-4" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </a>
      <a href="/pricing/" class="inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-background px-7 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Comparer les offres</a>
    </div>
  </div>
</section>`;

export function applyAccompanimentPage(document) {
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
  const replacement = parseFragment(accompanimentPage).childNodes;
  for (const node of replacement) node.parentNode = main;
  main.childNodes = replacement;
}
