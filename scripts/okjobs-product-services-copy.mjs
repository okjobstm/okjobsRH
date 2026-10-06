import { applyPersonaCopy } from './okjobs-persona-copy.mjs';

// Approved positioning: the four named Okjobs services remain the primary taxonomy.
// No subscription price, service fee, testimonial or new feature is invented.
export const productServicesCopy = new Map(Object.entries({
  'Most Popular': 'Accompagnement renforcé',
  'Avec assistance': 'Assessment',
  'En délégation': 'Recrutement',
  'Accompagnement sur mesure': 'Mission personnalisée',
  'Comparez vos candidats sur les mêmes bases': 'Formation',
  'Deux niveaux d’accompagnement': 'Quatre services selon votre besoin',
  'Assessment : vous gardez le pilotage': 'Assessment : évaluez avec des repères communs',
  'Recruitment : nous accompagnons le processus': 'Recrutement : avancez vers une shortlist expliquée',
  'Assessment ou Recruitment : choisissez votre accompagnement': 'Assessment, Recrutement, Mission personnalisée ou Formation',
  'Choisissez le niveau d’accompagnement adapté à votre besoin : évaluer des candidatures selon vos critères ou confier une partie du recrutement à Okjobs.': 'Utilisez Okjobs en autonomie : créez un poste, configurez les tests et envoyez les invitations. Si vous avez besoin d’aide, faites-vous assister ou déléguez les étapes convenues à notre équipe.',
  'Le service entreprise est cadré selon le nombre de candidats, les évaluations nécessaires et le niveau d’accompagnement.': 'Okjobs réunit un logiciel que votre équipe peut utiliser seule et des services optionnels pour être assistée ou déléguer certaines étapes du recrutement.',
  'Les offres entreprises sont définies sur devis selon le volume, les évaluations et le niveau d’accompagnement.': 'L’accès au logiciel et les services d’accompagnement sont distincts. Utilisez votre espace entreprise en autonomie, demandez une assistance ou convenez des étapes à déléguer.',
  'Le devis dépend du nombre de candidats, des évaluations nécessaires et du niveau d’accompagnement demandé.': 'Le tarif d’accès au logiciel reste à confirmer. Les services d’assistance et de délégation font l’objet d’un devis séparé selon les étapes et le volume convenus.',
  'Le volume de candidatures, les critères du poste, la batterie d’évaluation et le niveau d’accompagnement déterminent le devis.': 'Pour les services, le devis précise les étapes prises en charge, les livrables et le volume de candidatures. Ce coût est distinct de l’accès au logiciel.',
  'Quelle différence entre Assessment et Recruitment ?': 'Puis-je utiliser Okjobs seul, être assisté ou déléguer ?',
  'Assessment fournit les évaluations et les rapports à votre équipe. Recruitment ajoute un accompagnement sur plusieurs étapes du processus.': 'Oui. En autonomie, vous créez le poste, configurez les tests et envoyez les invitations. Avec assistance, notre équipe vous aide à réaliser ces étapes. En délégation, elle prend en charge les tâches convenues. Vous gardez la décision finale.',
  'Pour comparer avant de choisir': 'Créez votre poste, configurez les tests et invitez vos candidats.',
  'Pour avancer vers une sélection expliquée': 'Faites-vous aider à préparer le poste, les tests ou la lecture des résultats.',
  'Pour les besoins spécifiques': 'Confiez les étapes convenues à notre équipe, sans déléguer votre décision.',
  'Pour un besoin spécifique': 'Confiez à notre équipe les étapes convenues et gardez la décision finale.',
  'Le compte candidat est gratuit. Les prestations entreprises sont sur devis.': 'Compte candidat gratuit. Accès au logiciel et services entreprises distincts ; accompagnement sur devis.',
  'Prestations entreprises sur devis, selon le périmètre convenu.': 'Accès au logiciel distinct des services. Assistance et délégation sur devis.',
  'Les prestations entreprises sont sur devis, selon le poste, le volume de candidatures et les étapes à accompagner. Le périmètre est défini avant la mission.': 'Le tarif du logiciel reste à confirmer. L’assistance et la délégation sont proposées sur devis séparé, avec des tâches et des livrables convenus avant la mission.',
  'Le périmètre est défini selon le nombre de candidats, la complexité du poste et le niveau d’accompagnement attendu.': 'Vous choisissez les étapes que vous réalisez dans le logiciel, celles pour lesquelles vous souhaitez de l’aide et celles que vous confiez à notre équipe.',
}));

const homeCopy = new Map(Object.entries({
  'Choisissez l’appui dont votre équipe a besoin': 'Un logiciel pour agir. Une équipe si vous avez besoin d’aide.',
  'Vous pilotez déjà vos recrutements ou souhaitez confier certaines étapes ? Définissons les livrables et les responsabilités pour un accompagnement adapté à votre activité.': 'Créez votre poste, configurez les tests et invitez vos candidats dans votre espace. Vous préférez être assisté ou confier certaines étapes à notre équipe ? Choisissez le niveau d’intervention dont vous avez besoin.',
  'Votre besoin': 'En autonomie',
  'À préciser': 'Tarif à confirmer',
  'Le poste, vos attentes et les décisions à préparer.': 'Vous créez le poste, configurez les tests et envoyez les invitations.',
  'Recruitment': 'Recrutement',
  'Accompagnement': 'Mission personnalisée',
  'Comparez vos candidats et sachez quoi approfondir avant de choisir.': 'Notre équipe vous aide à préparer votre poste, vos tests ou à comprendre les résultats.',
  'Avancez vers une shortlist expliquée, avec un accompagnement à chaque étape convenue.': 'Notre équipe réalise les tâches convenues avec vous. Vous gardez le choix final.',
  'Un périmètre défini avec votre équipe selon le contexte et le volume du recrutement.': 'Précisez ce que vous gérez, ce que nous réalisons et les livrables attendus.',
  'Vous manquez de temps ou de ressources RH ? Clarifiez vos attentes, évaluez les compétences prioritaires et préparez les profils à rencontrer, avec l’accompagnement convenu.': 'Créez un poste dans votre espace, configurez les tests, envoyez les invitations et examinez les résultats. Réalisez ces étapes seul, avec de l’aide ou en les déléguant selon le périmètre convenu.',
  'Clarifiez le travail à réaliser': 'Créez votre poste',
  'Décrivez les tâches et les responsabilités du poste. Votre équipe partage les mêmes attentes avant de comparer les candidatures.': 'Dans votre espace entreprise, créez le poste à pourvoir et précisez les tâches, les responsabilités et les compétences attendues.',
  'Définissez ce qui compte pour choisir': 'Configurez les tests',
  'Identifiez les compétences indispensables et celles qui peuvent être développées après la prise de poste.': 'Configurez les tests en fonction de votre poste. Si cette étape vous pose difficulté, demandez l’aide de notre équipe.',
  'Approfondissez les compétences prioritaires': 'Invitez vos candidats',
  'Appuyez-vous sur des évaluations liées au poste pour faire ressortir les acquis et les points à confirmer avec chaque candidat.': 'Envoyez les invitations depuis votre espace pour que vos candidats passent les tests prévus pour ce recrutement.',
  'Préparez votre sélection': 'Examinez les résultats et décidez',
  'Oui. L’offre Recruitment permet de vous accompagner sur les étapes convenues : clarification du besoin, présélection, évaluations et préparation d’une shortlist documentée. Votre équipe garde la décision finale.': 'Oui. Vous pouvez utiliser le logiciel seul, être assisté pour préparer votre poste et vos tests, ou déléguer les étapes convenues. Notre équipe vous accompagne sans décider à votre place.',
}));

export function applyProductServicesCopy(document, route) {
  applyPersonaCopy(document, productServicesCopy);
  if (route === '/') applyPersonaCopy(document, homeCopy);
  if (route === '/pricing/') {
    applyPersonaCopy(document, new Map([
      ['Recruitment', 'Recrutement'],
      ['Sur mesure', 'Mission personnalisée'],
      ['Comparaison des services Candidat, Assessment, Recruitment et Sur mesure.', 'Comparez l’accès candidat et les services Assessment, Recrutement et Mission personnalisée. La Formation est proposée selon le besoin des dirigeants et équipes RH.'],
      ['/mo', ' '], ['/yr', ' '],
    ]));
  }
}

export function rewriteProductServicesRuntime(source) {
  let output = source;
  for (const [before, after] of productServicesCopy) {
    output = output.replaceAll(JSON.stringify(before), JSON.stringify(after))
      .replaceAll('`' + before + '`', '`' + after + '`');
  }
  if (source.includes('as PricingSection}')) {
    output = output.replaceAll('name:`Recruitment`', 'name:`Recrutement`')
      .replaceAll('name:`Sur mesure`', 'name:`Mission personnalisée`');
    for (const [before, after] of [['Recruitment', 'Recrutement'], ['Sur mesure', 'Mission personnalisée']]) {
      output = output.replaceAll('`' + before + '`', '`' + after + '`');
    }
  }
  return output;
}
