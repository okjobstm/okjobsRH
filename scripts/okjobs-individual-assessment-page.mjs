import { parseFragment } from "parse5";

const individualAssessmentPage = `
<section class="border-b border-border/60 bg-background">
  <div class="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
    <div class="max-w-2xl">
      <p class="text-sm font-semibold text-muted-foreground">RECRUTEMENT</p>
      <h1 class="display-heading-compact mt-4">Avancez du besoin à une shortlist expliquée.</h1>
      <p class="body-copy mt-6 max-w-[60ch] md:text-lg">Vous manquez de temps ou de ressources RH ? Okjobs structure avec vous les étapes du recrutement, compare les candidatures selon les mêmes critères et prépare une shortlist que votre équipe peut comprendre.</p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <a href="/signup" class="group/button inline-flex h-11 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-[color,background-color,scale] duration-150 hover:bg-primary/80 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Parler de mon recrutement
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 size-4" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
        <a href="#methode" class="inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-background px-7 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Voir la méthode</a>
      </div>
      <div class="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
        <span class="flex items-center gap-2"><span class="text-foreground">✓</span> Besoin clarifié</span>
        <span class="flex items-center gap-2"><span class="text-foreground">✓</span> Candidatures comparées</span>
        <span class="flex items-center gap-2"><span class="text-foreground">✓</span> Décision humaine</span>
      </div>
    </div>

    <div class="rounded-2xl border border-border/70 bg-muted/40 p-5 shadow-lg md:p-7" aria-label="Exemple de suivi de recrutement">
      <div class="flex items-start justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <p class="text-xs font-semibold text-muted-foreground">SUIVI DE MISSION</p>
          <p class="mt-1 text-lg font-semibold text-foreground">Responsable administratif</p>
        </div>
        <span class="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-foreground">En cours</span>
      </div>
      <div class="mt-5 space-y-3">
        <div class="rounded-xl border border-border/70 bg-background p-4">
          <div class="flex items-center justify-between gap-4"><p class="text-sm font-semibold text-foreground">Besoin cadré</p><span class="text-xs text-muted-foreground">Validé</span></div>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">Responsabilités, compétences prioritaires et contraintes du poste partagées avec votre équipe.</p>
        </div>
        <div class="rounded-xl border border-border/70 bg-background p-4">
          <div class="flex items-center justify-between gap-4"><p class="text-sm font-semibold text-foreground">Profils comparés</p><span class="text-xs text-muted-foreground">Même grille</span></div>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">Parcours, évaluations et points de vigilance rapprochés des attentes convenues.</p>
        </div>
        <div class="rounded-xl bg-foreground p-4 text-background">
          <p class="text-xs font-semibold opacity-70">PROCHAINE ÉTAPE</p>
          <p class="mt-1 text-sm font-semibold">Shortlist documentée à valider</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="bg-background py-20 md:py-24">
  <div class="mx-auto max-w-7xl px-6">
    <div class="max-w-3xl">
      <p class="text-sm font-semibold text-muted-foreground">UN PROCESSUS LISIBLE</p>
      <h2 class="section-heading mt-3">Concentrez votre temps sur les décisions</h2>
      <p class="section-intro mt-5">Okjobs prend en charge les étapes convenues et restitue les informations utiles dans un format commun, sans retirer la décision finale à votre équipe.</p>
    </div>
    <div class="mt-10 grid gap-5 md:grid-cols-3">
      <article class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <span class="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </span>
        <h3 class="mt-5 text-lg font-semibold text-foreground">Un besoin bien cadré</h3>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Le poste, les priorités et les critères de comparaison sont clarifiés avant d’examiner les candidatures.</p>
      </article>
      <article class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <span class="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 16 4-4 4 2 4-6"/></svg>
        </span>
        <h3 class="mt-5 text-lg font-semibold text-foreground">Une comparaison cohérente</h3>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Les candidatures sont examinées selon les mêmes repères, avec leurs correspondances et leurs écarts.</p>
      </article>
      <article class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <span class="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg>
        </span>
        <h3 class="mt-5 text-lg font-semibold text-foreground">Une shortlist expliquée</h3>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">Chaque profil retenu est accompagné des éléments observés et des points à approfondir en entretien.</p>
      </article>
    </div>
  </div>
</section>

<section id="methode" class="border-y border-border/60 bg-muted/30 py-20 md:py-24">
  <div class="mx-auto max-w-7xl px-6">
    <div class="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <div class="max-w-xl">
        <p class="text-sm font-semibold text-muted-foreground">UNE MÉTHODE EN TROIS TEMPS</p>
        <h2 class="section-heading mt-3">Du besoin à votre sélection</h2>
        <p class="section-intro mt-5">Le périmètre est défini avant la mission : étapes prises en charge, livrables attendus et validations qui restent entre vos mains.</p>
      </div>
      <ol class="space-y-4">
        <li class="flex gap-4 rounded-2xl border border-border/70 bg-background p-5">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">1</span>
          <div><h3 class="text-base font-semibold text-foreground">Clarifier le besoin</h3><p class="mt-2 text-sm leading-relaxed text-muted-foreground">Nous définissons avec vous les responsabilités, les compétences attendues et les critères prioritaires.</p></div>
        </li>
        <li class="flex gap-4 rounded-2xl border border-border/70 bg-background p-5">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">2</span>
          <div><h3 class="text-base font-semibold text-foreground">Présélectionner et évaluer</h3><p class="mt-2 text-sm leading-relaxed text-muted-foreground">Les candidatures sont structurées, rapprochées du poste et évaluées selon le dispositif convenu.</p></div>
        </li>
        <li class="flex gap-4 rounded-2xl border border-border/70 bg-background p-5">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">3</span>
          <div><h3 class="text-base font-semibold text-foreground">Préparer la shortlist</h3><p class="mt-2 text-sm leading-relaxed text-muted-foreground">Vous recevez une sélection documentée, les écarts à examiner et les questions utiles pour vos entretiens.</p></div>
        </li>
      </ol>
    </div>
  </div>
</section>

<section class="bg-background py-20 md:py-24">
  <div class="mx-auto max-w-7xl px-6">
    <div class="mx-auto max-w-3xl text-center">
      <p class="text-sm font-semibold text-muted-foreground">DES RESPONSABILITÉS CLAIRES</p>
      <h2 class="section-heading mt-3">Vous savez ce que nous prenons en charge</h2>
      <p class="section-intro mx-auto mt-5">Le service Recrutement accompagne le processus convenu. Votre équipe conserve les validations importantes et le choix final.</p>
    </div>
    <div class="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
      <div class="rounded-2xl border border-border/70 bg-muted/30 p-6 md:p-8">
        <p class="text-sm font-semibold text-foreground">Okjobs peut prendre en charge</p>
        <ul class="mt-5 space-y-4 text-sm text-muted-foreground">
          <li class="flex gap-3"><span class="text-foreground">✓</span><span>Le cadrage du poste et des critères prioritaires</span></li>
          <li class="flex gap-3"><span class="text-foreground">✓</span><span>La présélection et les évaluations convenues</span></li>
          <li class="flex gap-3"><span class="text-foreground">✓</span><span>La préparation d’une shortlist documentée</span></li>
        </ul>
      </div>
      <div class="rounded-2xl border border-border/70 bg-background p-6 md:p-8">
        <p class="text-sm font-semibold text-foreground">Votre équipe conserve</p>
        <ul class="mt-5 space-y-4 text-sm text-muted-foreground">
          <li class="flex gap-3"><span class="text-foreground">✓</span><span>La validation du besoin et des critères</span></li>
          <li class="flex gap-3"><span class="text-foreground">✓</span><span>Les échanges sensibles avec les candidats</span></li>
          <li class="flex gap-3"><span class="text-foreground">✓</span><span>La décision finale de recrutement</span></li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="border-t border-border/60 bg-muted/30 py-20 md:py-24">
  <div class="mx-auto max-w-4xl px-6 text-center">
    <h2 class="section-heading">Parlons du poste que vous devez pourvoir</h2>
    <p class="section-intro mx-auto mt-5 max-w-[58ch]">Décrivez votre besoin, le volume de candidatures attendu et les étapes sur lesquelles votre équipe souhaite être accompagnée.</p>
    <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
      <a href="/signup" class="group/button inline-flex h-11 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-[color,background-color,scale] duration-150 hover:bg-primary/80 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Créer mon compte
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 size-4" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </a>
      <a href="/pricing/" class="inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-background px-7 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Voir les offres</a>
    </div>
    <p class="fine-print mt-5">Le périmètre et les livrables sont définis avant la mission. Votre équipe garde la décision finale.</p>
  </div>
</section>`;

export function applyIndividualAssessmentPage(document) {
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
  const replacement = parseFragment(individualAssessmentPage).childNodes;
  for (const node of replacement) node.parentNode = main;
  main.childNodes = replacement;
}
