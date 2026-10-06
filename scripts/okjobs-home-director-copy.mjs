import { applyPersonaCopy } from "./okjobs-persona-copy.mjs";

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
