import { applyPersonaCopy } from "./okjobs-persona-copy.mjs";
import { parseFragment } from "parse5";

const heroRecruitmentVisual = `
<div class="mx-auto flex w-full min-w-0 flex-col items-center" role="img" aria-label="Aperçu Okjobs d'une shortlist comparant trois candidatures selon les critères du poste">
  <div class="w-full max-w-md overflow-hidden rounded-2xl border border-border/70 bg-background p-5 shadow-lg md:p-6">
    <div class="flex items-start justify-between gap-4 border-b border-border/70 pb-4">
      <div class="min-w-0 text-left">
        <p class="text-xs font-medium text-muted-foreground">POSTE À POURVOIR</p>
        <p class="mt-1 text-base font-semibold text-foreground">Responsable des opérations</p>
      </div>
      <span class="shrink-0 rounded-full border border-border/70 bg-muted px-3 py-1 text-xs font-medium text-foreground">3 profils</span>
    </div>

    <div class="mt-5 space-y-3">
      <div class="rounded-xl border border-border/70 bg-muted/50 p-4 text-left">
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">NM</span>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-foreground">Nadia M.</p>
              <p class="text-xs text-muted-foreground">Expérience documentée</p>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5 shrink-0" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <span class="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs text-foreground">Organisation</span>
          <span class="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs text-foreground">Management</span>
          <span class="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs text-muted-foreground">1 point à vérifier</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-border/70 bg-background p-3 text-left shadow-sm">
          <div class="flex items-center gap-2">
            <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">SK</span>
            <div class="min-w-0">
              <p class="text-sm font-medium text-foreground">Serge K.</p>
              <p class="text-xs text-muted-foreground">À approfondir</p>
            </div>
          </div>
        </div>
        <div class="rounded-xl border border-border/70 bg-background p-3 text-left shadow-sm">
          <div class="flex items-center gap-2">
            <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">AA</span>
            <div class="min-w-0">
              <p class="text-sm font-medium text-foreground">Aïcha A.</p>
              <p class="text-xs text-muted-foreground">Profil complété</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-5 flex items-center gap-3 rounded-xl border border-border/70 bg-foreground p-4 text-left text-background">
      <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      </span>
      <div>
        <p class="text-sm font-semibold">Shortlist expliquée</p>
        <p class="mt-0.5 text-xs opacity-80">Correspondances, écarts et questions d'entretien.</p>
      </div>
    </div>
  </div>
</div>`;

export function applyDirectorHeroVisual(document) {
  function replace(node) {
    for (let index = 0; index < (node.childNodes ?? []).length; index += 1) {
      const child = node.childNodes[index];
      const componentUrl = child.attrs?.find((attr) => attr.name === "component-url")?.value ?? "";
      if (child.tagName === "astro-island" && componentUrl.includes("LobbyStackWebVoiceWidget")) {
        const replacement = parseFragment(heroRecruitmentVisual).childNodes;
        for (const replacementNode of replacement) replacementNode.parentNode = node;
        node.childNodes.splice(index, 1, ...replacement);
        return true;
      }
      if (replace(child)) return true;
    }
    return false;
  }
  replace(document);
}

// Homepage-specific copy. Other audiences keep their dedicated pages.
const directorCopy = new Map(Object.entries({
  "Montrez vos compétences. Recrutez avec confiance.": "Choisissez vos prochains collaborateurs avec confiance.",
  "Votre CV ne dit pas tout. Faites ressortir ce que vous savez faire. Vous recrutez ? Comparez les compétences utiles au poste et sachez quels points vérifier avant de choisir.": "Vous devez recruter, mais les CV ne suffisent pas pour choisir. Okjobs vous aide à comparer les compétences utiles au poste, à lever vos doutes et à préparer une sélection que vous pouvez expliquer.",
  "Accès gratuit pour les candidats. Offres entreprises établies selon le besoin.": "PME, ONG et institutions : un accompagnement adapté à votre poste et à vos ressources.",
  "Votre expérience mérite d’être visible": "Deux CV proches. Une décision qui compte pour votre équipe.",
  "Un premier emploi, des missions de terrain ou plusieurs années d’expérience : donnez au recruteur des éléments concrets pour comprendre votre parcours.": "Au-delà des diplômes et des années d’expérience, identifiez ce que chaque candidat apporte à votre activité et ce qui reste à vérifier avant de le retenir.",
  "Montrez ce que votre CV ne raconte pas": "Distinguez les acquis derrière le CV",
  "Mettez en valeur ce que vous avez appris en formation, en stage ou au travail. Votre parcours devient plus facile à comprendre, même sans une longue liste de diplômes.": "Retrouvez les responsabilités exercées, les compétences annoncées et les éléments observés. Vous obtenez une base concrète pour comparer les profils.",
  "Voir le parcours candidat": "Comprendre le profil d’un candidat",
  "Le recruteur retrouve vos expériences et vos acquis sans devoir reconstituer votre parcours à partir de documents dispersés.": "Comprenez le parcours d’un candidat sans devoir reconstituer son expérience à partir de documents dispersés.",
  "Vos compétences déclarées et les éléments évalués restent distincts : votre profil montre vos acquis sans présenter une déclaration comme une preuve.": "Distinguez une compétence annoncée d’un élément documenté ou observé. Vous savez sur quoi appuyer votre choix et ce qui demande encore une vérification.",
  "Comprenez ce que votre évaluation révèle, ce qu’elle ne permet pas de conclure et les points à approfondir.": "Repérez les correspondances avec votre poste, les écarts et les limites du résultat pour préparer un entretien plus utile.",
  "Une prochaine étape plus claire": "Un entretien qui fait avancer votre choix",
  "Ne restez pas avec une note sans explication. Repérez les compétences à travailler pour avancer vers votre objectif.": "Concentrez vos questions sur les points encore incertains, plutôt que de consacrer l’échange à relire le CV.",
  "Moins de flou des deux côtés": "Vous êtes candidat ? Rendez vos compétences visibles.",
  "Candidat, comprenez vos points forts et vos axes de progression. Recruteur, identifiez les correspondances avec le poste et préparez un entretien plus utile.": "Votre expérience mérite d’être comprise, même si votre CV est court. Présentez vos acquis, comprenez vos résultats et identifiez votre prochaine étape. Le compte candidat est gratuit.",
  "Faites reconnaître vos acquis": "Ne confondez pas ancienneté et maîtrise",
  "Ce qui compte ne se limite pas au nom de votre dernier poste. Rendez visibles vos responsabilités, vos réalisations et les compétences acquises.": "Deux profils peuvent avoir la même ancienneté sans avoir exercé les mêmes responsabilités. Approfondissez les acquis utiles à votre poste avant de décider.",
  "Passez de votre parcours à vos points forts": "Avancez du besoin à une sélection expliquée",
  "Présentez ce que vous avez fait, évaluez les compétences utiles à votre objectif et repartez avec une lecture plus claire de vos acquis.": "Vous manquez de temps ou de ressources RH ? Clarifiez vos attentes, évaluez les compétences prioritaires et préparez les profils à rencontrer, avec l’accompagnement convenu.",
  "Mettez votre expérience en valeur": "Clarifiez le travail à réaliser",
  "Créez votre CV ou importez un document existant pour organiser vos expériences et vos formations.": "Décrivez les tâches et les responsabilités du poste. Votre équipe partage les mêmes attentes avant de comparer les candidatures.",
  "Faites ressortir vos acquis": "Définissez ce qui compte pour choisir",
  "Indiquez vos compétences actuelles sans les confondre avec celles qui ont déjà été vérifiées.": "Identifiez les compétences indispensables et celles qui peuvent être développées après la prise de poste.",
  "Montrez vos compétences en situation": "Approfondissez les compétences prioritaires",
  "Répondez à des tests ou mises en situation liés au métier visé, selon une méthode clairement expliquée.": "Appuyez-vous sur des évaluations liées au poste pour faire ressortir les acquis et les points à confirmer avec chaque candidat.",
  "Identifiez votre prochaine étape": "Préparez votre sélection",
  "Consultez les résultats observés, les écarts à travailler et les prochaines étapes possibles.": "Retrouvez les correspondances, les limites et les questions à approfondir pour décider des profils à rencontrer.",
  "Votre profil gratuit. Un accompagnement adapté à votre recrutement.": "Choisissez l’appui dont votre équipe a besoin",
  "Candidat, commencez sans frais. Entreprise, définissons le poste, les livrables et l’accompagnement dont vous avez besoin avant d’établir le devis.": "Vous pilotez déjà vos recrutements ou souhaitez confier certaines étapes ? Définissons les livrables et les responsabilités pour un accompagnement adapté à votre activité.",
  "Candidat": "Votre besoin",
  "Gratuit": "À préciser",
  "Rendez votre parcours lisible et comprenez vos résultats.": "Le poste, vos attentes et les décisions à préparer.",
  "Création de compte gratuite.": "Prestations entreprises sur devis, selon le périmètre convenu.",
  "Découvrez comment Okjobs accompagne les candidats, les recruteurs et le développement des compétences.": "Trouvez les repères adaptés à votre organisation, au type de poste et au volume de candidatures à examiner.",
  "Créer son profil": "Comprendre un parcours",
  "Structurer expériences, formations et certifications": "Retrouver les acquis derrière le CV",
  "Déclarer ses compétences": "Vérifier les compétences annoncées",
  "Passer une évaluation": "Observer les compétences utiles",
  "Comprendre ses résultats": "Repérer les écarts à approfondir",
  "Identifier les forces et les écarts": "Préparer des questions ciblées",
  "Développer les compétences": "Préparer l’accompagnement au poste",
  "Transformer les lacunes en pistes de progression": "Identifier les compétences à développer",
  "Puis-je modifier mon profil après sa création ?": "Je n’ai pas de service RH. Pouvez-vous m’accompagner ?",
  "Oui. Votre profil est évolutif : vous pouvez compléter votre parcours, vos compétences et les éléments qui les documentent.": "Oui. L’offre Recruitment permet de vous accompagner sur les étapes convenues : clarification du besoin, présélection, évaluations et préparation d’une shortlist documentée. Votre équipe garde la décision finale.",
  "Comment les compétences déclarées sont-elles présentées ?": "Comment distinguer ce qu’un candidat annonce de ce qu’il démontre ?",
  "Elles restent clairement séparées des compétences vérifiées afin de conserver une lecture honnête du profil.": "Les déclarations, les documents disponibles et les observations d’évaluation restent distincts. Vous pouvez identifier l’origine de chaque élément et les vérifications encore nécessaires.",
  "Que montrent les résultats d’une évaluation ?": "Que vais-je recevoir pour préparer ma décision ?",
  "Ils décrivent les dimensions observées, leur niveau de confiance, leurs limites et leur correspondance avec les critères du parcours.": "Selon le périmètre convenu, vous recevez des rapports reliant les observations aux critères du poste, avec les écarts et les points à approfondir. Recruitment ajoute un accompagnement à la préparation de la shortlist.",
  "Comment les écarts sont-ils utilisés ?": "Un candidat doit-il maîtriser toutes les compétences dès le départ ?",
  "Ils peuvent devenir des pistes de développement, des questions à approfondir ou des compétences à réévaluer ultérieurement.": "Cela dépend du poste. Définissez les compétences indispensables et celles qui peuvent être développées. Les écarts vous aident à apprécier l’accompagnement nécessaire, sans décider automatiquement de retenir ou d’écarter un profil.",
  "Le compte candidat est gratuit. Les offres entreprises sont établies sur devis après cadrage du besoin.": "Les prestations entreprises sont sur devis, selon le poste, le volume de candidatures et les étapes à accompagner. Le périmètre est défini avant la mission.",
  "Faites ressortir vos compétences": "Préparez votre prochain recrutement avec des éléments concrets",
  "La création du compte candidat est gratuite.": "Commencez par le poste à pourvoir. Clarifions vos attentes et l’accompagnement utile à votre décision.",
}));

export function applyDirectorHomeCopy(document) {
  const getText = (node) => node.nodeName === "#text" ? node.value : (node.childNodes ?? []).map(getText).join("");
  let candidateSection;
  function find(node) {
    if (node.tagName === "h2" && getText(node).trim() === "Moins de flou des deux côtés") {
      let parent = node.parentNode;
      while (parent && parent.tagName !== "section") parent = parent.parentNode;
      candidateSection = parent;
    }
    for (const child of node.childNodes ?? []) find(child);
  }
  find(document);
  function walk(node, inMain = false, inCandidate = false) {
    const main = inMain || node.tagName === "main";
    const candidate = inCandidate || node === candidateSection;
    if (main && node.tagName === "a" && node.attrs?.some((attr) => attr.name === "href" && attr.value === "/signup")) {
      applyPersonaCopy(node, new Map([["Créer mon compte", candidate ? "Créer mon compte candidat" : "Créer mon espace entreprise"]]));
    }
    if (node.tagName === "main") applyPersonaCopy(node, directorCopy);
    for (const child of node.childNodes ?? []) walk(child, main, candidate);
  }
  walk(document);
}
