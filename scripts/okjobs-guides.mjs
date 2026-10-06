import { parseFragment } from "parse5";

// Authored guides: fictional situations are examples, never research findings.
// Existing page shell, styles, menu, hero assets and route remain unchanged.
export const guides = {
  "ai-receptionist-affiliate-program": {
    title: "Une formation utile commence par un besoin identifié", audience: "formation",
    lead: "Vous dirigez un centre de formation ? Aidez les participants à travailler une compétence précise, plutôt que de choisir un programme sans lien avec leur objectif.",
    situation: "Un participant cherche un poste administratif et hésite entre plusieurs formations. Avant de lui proposer un parcours, clarifiez les tâches qu’il veut maîtriser et les acquis dont il dispose déjà.",
    action: "Reliez chaque module à une compétence et à un exercice concret.",
    evidence: "Un exercice réalisé avant et après la formation peut éclairer une progression sur la compétence travaillée, si les conditions restent comparables.",
    caution: "Une inscription, une attestation de présence et une compétence démontrée ne prouvent pas la même chose. Ne promettez pas un emploi à partir de l’une de ces seules informations.",
    next: "Préparez une fiche indiquant le public, les prérequis, les compétences travaillées et la manière de constater les acquis.",
    criteria: ["Objectif professionnel", "Prérequis", "Exercice pratique", "Progression observée"],
  },
  "ai-receptionist-savings": {
    title: "Recruter en PME sans y consacrer toutes vos journées", audience: "entreprise",
    lead: "Vous pilotez l’activité et les recrutements ? Concentrez votre temps sur les décisions qui nécessitent vraiment votre connaissance de l’équipe.",
    situation: "Vous recrutez un gestionnaire de stock. Vous recevez des CV par différents canaux, mais aucune méthode commune ne vous aide encore à comparer les profils.",
    action: "Écrivez les trois tâches essentielles du poste avant de commencer à trier les CV.",
    evidence: "Un exemple de suivi de stock, une réponse à un écart d’inventaire et un entretien ciblé apportent des éléments plus utiles qu’une liste de qualités générales.",
    caution: "Un outil ne supprime pas toutes les étapes du recrutement. Gardez du temps pour vérifier les éléments importants et échanger avec les personnes présélectionnées.",
    next: "Prenez un poste réel et identifiez l’étape qui vous prend le plus de temps avant de choisir votre accompagnement.",
    criteria: ["Suivi des stocks", "Rigueur", "Gestion d’un écart", "Communication avec l’équipe"],
  },
  "ai-receptionist-vs-virtual-receptionist": {
    title: "Évaluation et jugement humain : décidez avec les deux", audience: "entreprise",
    lead: "Une évaluation apporte des repères. Votre équipe apporte la connaissance du poste et du contexte. Aucun de ces deux regards ne devrait remplacer l’autre.",
    situation: "Un candidat obtient des résultats intéressants, mais une responsabilité du poste n’a pas été évaluée. Le rapport vous aide à formuler une question ; il ne permet pas de présumer la réponse.",
    action: "Pour chaque exigence importante, indiquez ce qui est observé et ce qui reste à confirmer.",
    evidence: "Combinez les réponses, les exemples d’expérience et les vérifications pertinentes plutôt que de retenir uniquement une impression ou un score.",
    caution: "Un résultat décrit une performance dans des conditions données. Il ne prédit pas à lui seul la réussite dans votre équipe.",
    next: "Préparez un entretien consacré aux incertitudes du dossier, puis documentez la décision de votre équipe.",
    criteria: ["Exigences du poste", "Résultats observés", "Incertitudes", "Vérifications humaines"],
  },
  "ai-receptionist-vs-voicemail": {
    title: "Pourquoi une note unique ne suffit pas pour choisir", audience: "entreprise",
    lead: "Deux personnes ayant une note proche peuvent présenter des points forts très différents. Regardez les compétences importantes pour votre poste avant de conclure.",
    situation: "Vous comparez deux candidatures pour un poste de suivi administratif. L’une montre davantage de rigueur, l’autre une communication plus claire. Votre choix dépend des responsabilités réelles du poste.",
    action: "Lisez les résultats par compétence avant de consulter une éventuelle synthèse globale.",
    evidence: "Une réponse concrète, son contexte et les limites de l’évaluation permettent de comprendre ce qui se cache derrière le résultat.",
    caution: "Une moyenne peut masquer un écart sur une exigence essentielle. Définissez les priorités avant de connaître les résultats.",
    next: "Listez les compétences indispensables, celles qui peuvent être développées et les éléments restant à vérifier.",
    criteria: ["Compétences indispensables", "Points forts", "Écarts", "Accompagnement possible"],
  },
  "ai-receptionist-workflows": {
    title: "Votre candidature : sachez quoi faire à chaque étape", audience: "candidat",
    lead: "Vous avez reçu une invitation à candidater ? Préparez votre parcours, répondez avec des exemples réels et vérifiez les étapes restantes avant d’envoyer votre dossier.",
    situation: "Vous ouvrez le lien reçu par courriel et découvrez plusieurs étapes. Prenez connaissance des consignes avant de commencer pour savoir ce qui est attendu et quels documents préparer.",
    action: "Gardez votre CV et les dates de vos principales expériences à portée de main.",
    evidence: "Des réponses précises sur votre rôle, vos actions et leurs résultats rendent votre candidature plus compréhensible qu’un texte général.",
    caution: "Vérifiez les consignes propres au parcours. Une étape complétée ou un dossier envoyé ne signifie pas qu’une décision d’embauche a été prise.",
    next: "Dans votre espace candidat, retrouvez les dossiers en cours et ouvrez celui que vous souhaitez compléter.",
    criteria: ["Parcours exact", "Exemples vécus", "Consignes respectées", "Dossier complet"],
  },
  "ai-voice-agent-gpt-live": {
    title: "Choisissez l’évaluation qui éclaire votre objectif", audience: "candidat",
    lead: "Toutes les évaluations ne répondent pas à la même question. Comprenez ce qui sera observé pour utiliser votre résultat sans lui faire dire davantage.",
    situation: "Vous visez un poste de support administratif. Un exercice sur l’organisation d’informations et une mise en situation de communication peuvent éclairer des compétences différentes.",
    action: "Lisez l’objectif, le format et les conditions de passation avant de répondre.",
    evidence: "Une restitution utile relie les observations à une compétence et indique les limites de cette interprétation.",
    caution: "Un test exploratoire doit être présenté comme exploratoire. Il ne constitue pas automatiquement une certification ou une preuve de toutes vos compétences.",
    next: "Choisissez une compétence liée au métier visé et demandez comment elle sera évaluée.",
    criteria: ["Objectif du test", "Format", "Conditions de passation", "Limites du résultat"],
  },
  "best-open-source-ai-phone-answering-services": {
    title: "Donnez du concret à votre profil professionnel", audience: "candidat",
    lead: "Votre parcours devient plus utile lorsque le recruteur comprend ce que vous avez fait, ce que vous avez appris et les éléments qui appuient vos compétences.",
    situation: "Vous avez un stage, quelques missions et une formation. Présentez-les avec leurs dates, votre rôle et vos réalisations plutôt que de chercher à allonger artificiellement votre expérience.",
    action: "Pour chaque expérience, décrivez une responsabilité et un exemple d’action menée.",
    evidence: "Un document pertinent ou un résultat d’évaluation peut compléter votre déclaration, sans démontrer à lui seul tout votre savoir-faire.",
    caution: "Partagez uniquement des documents que vous pouvez communiquer. Évitez les données confidentielles d’un ancien employeur ou d’un client.",
    next: "Relisez votre profil comme si vous découvriez votre parcours : les tâches, les dates et les acquis sont-ils compréhensibles ?",
    criteria: ["Expériences", "Responsabilités", "Compétences", "Éléments disponibles"],
  },
  "build-or-buy-ai-receptionist": {
    title: "Assessment ou Recruitment : choisissez selon vos ressources", audience: "entreprise",
    lead: "Vous n’avez pas besoin du même accompagnement si votre équipe mène déjà les entretiens ou si vous devez gérer seul le recrutement.",
    situation: "Une responsable RH veut des évaluations pour comparer ses candidats. Un dirigeant de PME souhaite aussi être accompagné dans le cadrage et la présélection. Leurs livrables attendus sont différents.",
    action: "Listez les étapes que votre équipe peut gérer et celles pour lesquelles elle a besoin d’appui.",
    evidence: "Assessment apporte les évaluations et rapports du périmètre convenu. Recruitment ajoute l’accompagnement aux étapes de recrutement retenues ensemble.",
    caution: "Le nom d’une offre ne suffit pas à définir une mission. Précisez les responsabilités, les livrables et les limites avant de vous engager.",
    next: "Présentez votre poste, votre volume de candidats et vos ressources internes pour cadrer un devis.",
    criteria: ["Ressources internes", "Étapes à accompagner", "Livrables", "Périmètre du devis"],
  },
  "cloudtalk-ai-receptionist-alternative": {
    title: "Évaluez les compétences utiles à votre poste", audience: "entreprise",
    lead: "Commencez par le travail à réaliser, pas par un catalogue de tests. Votre évaluation doit éclairer une décision précise.",
    situation: "Pour un poste de maintenance, le raisonnement face à un incident peut être important. Certaines pratiques de sécurité ou compétences manuelles exigent aussi une vérification adaptée sur le terrain.",
    action: "Associez chaque compétence prioritaire à une situation ou à une vérification pertinente.",
    evidence: "Expliquez pourquoi un exercice est utile au poste et quelle observation il permet de recueillir.",
    caution: "Un questionnaire ne remplace pas toutes les mises en pratique, habilitations ou vérifications requises par un métier.",
    next: "Faites relire les critères par une personne qui connaît le travail quotidien du poste.",
    criteria: ["Tâches réelles", "Compétences prioritaires", "Situations adaptées", "Vérifications terrain"],
  },
  "dialzara-alternative": {
    title: "Transformez une fiche de poste en critères utiles", audience: "entreprise",
    lead: "Une fiche de poste devient plus utile lorsqu’elle décrit ce que la personne devra réaliser et les éléments qui permettront d’en apprécier la maîtrise.",
    situation: "La formule « personne dynamique et polyvalente » ne permet pas de comparer deux candidats. Décrivez plutôt les tâches, les responsabilités et les situations à gérer.",
    action: "Remplacez les qualités vagues par des comportements ou des réalisations liés au travail.",
    evidence: "Pour « organisation », vous pouvez chercher comment le candidat priorise plusieurs demandes et explique son choix.",
    caution: "N’ajoutez pas une exigence uniquement parce qu’elle semble valorisante. Vérifiez sa nécessité pour le poste et le niveau attendu.",
    next: "Validez une courte grille avec le manager avant d’inviter les candidats.",
    criteria: ["Responsabilités", "Situations à gérer", "Niveau attendu", "Éléments observables"],
  },
  "elevenlabs-reception-alternative": {
    title: "Une compétence annoncée n’est pas encore une compétence démontrée", audience: "entreprise",
    lead: "Utilisez le CV comme un point de départ. Une déclaration, un justificatif et une observation ne renseignent pas de la même manière votre décision.",
    situation: "Un candidat indique maîtriser un outil bureautique. Demandez quel usage il en a fait, puis choisissez un exercice pertinent si cette compétence est essentielle au poste.",
    action: "Indiquez l’origine de chaque information importante dans votre comparaison.",
    evidence: "Un exemple expliqué, un document communicable et un exercice adapté apportent des éclairages complémentaires.",
    caution: "Une attestation ou un diplôme ne garantit pas à lui seul le niveau actuel de pratique. Vérifiez ce qui compte réellement pour la mission.",
    next: "Choisissez une compétence prioritaire et identifiez la vérification qui manque encore au dossier.",
    criteria: ["Déclaration", "Justificatif", "Observation", "Vérification restante"],
  },
  "goodcall-alternative": {
    title: "Comparez les candidatures sur les mêmes bases", audience: "entreprise",
    lead: "Une comparaison devient utile quand chaque candidat est examiné à partir d’attentes communes, sans oublier les conditions de l’évaluation.",
    situation: "Deux managers ne retiennent pas les mêmes éléments d’un entretien. Une grille commune les aide à expliquer leurs observations et leurs désaccords.",
    action: "Fixez les critères et les priorités avant de consulter les résultats.",
    evidence: "Reliez chaque appréciation à une réponse, à un exemple ou à une observation précise plutôt qu’à une impression générale.",
    caution: "Des conditions de passation différentes peuvent compliquer la comparaison. Signalez les incidents et les informations manquantes au lieu de les interpréter comme une faiblesse professionnelle.",
    next: "Comparez les profils critère par critère, puis listez les incertitudes à lever.",
    criteria: ["Attentes communes", "Observations", "Conditions de passation", "Incertitudes"],
  },
  "how-to-choose-an-ai-receptionist": {
    title: "Choisissez une évaluation que vous pourrez expliquer", audience: "entreprise",
    lead: "Avant d’utiliser un test, demandez quelle décision il doit éclairer et pourquoi ses résultats seront utiles au poste.",
    situation: "Vous recevez une proposition d’évaluation avec un score global. Pour l’utiliser, vous devez aussi connaître les compétences observées, les conditions et les limites de la méthode.",
    action: "Demandez un exemple de restitution et examinez ce qu’il vous permet réellement de décider.",
    evidence: "Une méthode explicite présente ses sources, son statut exploratoire ou validé, sa version et les précautions d’interprétation.",
    caution: "Ne transformez pas une promesse commerciale en preuve scientifique. Une méthode doit être appréciée sur des éléments disponibles et pertinents pour son usage.",
    next: "Commencez par un poste pilote et recueillez les retours des recruteurs et des candidats.",
    criteria: ["Décision à préparer", "Compétences observées", "Méthode", "Limites"],
  },
  "lobbystack-is-live": {
    title: "Okjobs : rendre vos compétences visibles pour mieux avancer", audience: "candidat",
    lead: "Votre objectif n’est pas de remplir un profil de plus. C’est de rendre votre parcours compréhensible et de savoir quelle étape préparer ensuite.",
    situation: "Vous cherchez un premier emploi ou souhaitez faire reconnaître une expérience de terrain. Votre profil doit montrer vos acquis, pas uniquement vos intitulés de poste.",
    action: "Commencez par une expérience dont vous pouvez décrire précisément votre contribution.",
    evidence: "Les compétences déclarées restent distinctes des éléments documentés et des résultats observés pendant une évaluation.",
    caution: "Okjobs aide à présenter et à comprendre un profil. La création d’un compte ou une évaluation ne garantit ni entretien ni embauche.",
    next: "Présentez votre parcours et clarifiez le métier ou la prochaine responsabilité que vous visez.",
    criteria: ["Parcours", "Acquis", "Objectif", "Prochaine étape"],
  },
  "lobbystack-mit-license-ai-receptionist-resellers": {
    title: "Faites reconnaître ce que votre expérience vous a appris", audience: "candidat",
    lead: "Vous avez appris en travaillant, en mission ou en apprentissage ? Votre profil peut décrire ces acquis sans inventer un diplôme ou un poste.",
    situation: "Un technicien a réalisé plusieurs interventions sans disposer d’un CV détaillé. Décrire les tâches effectuées, son autonomie et les problèmes rencontrés rend son expérience plus lisible.",
    action: "Pour chaque mission, précisez le contexte, votre rôle et une difficulté que vous avez traitée.",
    evidence: "Une description exacte de votre contribution aide à comprendre votre expérience. Une vérification adaptée reste nécessaire lorsque la compétence doit être démontrée.",
    caution: "Ne présentez pas une tâche observée comme une tâche maîtrisée si vous n’en étiez pas responsable. Une description honnête est plus utile qu’un intitulé gonflé.",
    next: "Choisissez deux expériences représentatives et décrivez ce que vous avez personnellement réalisé.",
    criteria: ["Contexte de la mission", "Contribution personnelle", "Autonomie", "Acquis"],
  },
  "moneypenny-ai-receptionist-alternative": {
    title: "Préparez un entretien qui vous aide vraiment à choisir", audience: "entreprise",
    lead: "Un entretien utile ne se limite pas à relire le CV. Il approfondit les compétences importantes et les incertitudes du dossier.",
    situation: "Le candidat présente une expérience de coordination. Demandez-lui une situation précise, son rôle et la façon dont il a géré une difficulté avec l’équipe.",
    action: "Préparez vos questions à partir des exigences du poste et des points encore incertains.",
    evidence: "Une réponse détaillée sur les actions menées apporte plus d’éléments qu’une affirmation comme « je travaille bien en équipe ».",
    caution: "Un discours fluide ne suffit pas à prouver une compétence. Distinguez la qualité de la présentation des éléments pertinents pour le travail.",
    next: "Pour chaque candidature présélectionnée, notez les trois vérifications qui feront avancer votre choix.",
    criteria: ["Situation vécue", "Rôle personnel", "Actions", "Résultat et limites"],
  },
  "my-ai-front-desk-alternative": {
    title: "Lisez votre résultat sans vous enfermer dans une note", audience: "candidat",
    lead: "Votre résultat décrit des observations dans un contexte. Il peut vous aider à comprendre vos acquis, mais ne résume pas toute votre valeur professionnelle.",
    situation: "Une dimension de l’évaluation vous semble difficile. Regardez ce qui a été observé, les conditions de passation et les compétences concernées avant de tirer une conclusion générale.",
    action: "Commencez par le détail des dimensions observées, pas uniquement par la synthèse.",
    evidence: "Un résultat utile indique les points mis en évidence, les incertitudes et les pistes à approfondir.",
    caution: "Une difficulté de connexion ou une consigne mal comprise ne doit pas être automatiquement confondue avec une incapacité professionnelle. Signalez les incidents selon le parcours proposé.",
    next: "Choisissez un point fort à illustrer et une compétence à développer pour votre objectif.",
    criteria: ["Observations", "Conditions", "Points forts", "Progression"],
  },
  "nextiva-xbert-alternative": {
    title: "Sachez quand un résultat mérite d’être approfondi", audience: "entreprise",
    lead: "Le niveau de confiance vous aide à apprécier les éléments disponibles. Il ne transforme pas une observation limitée en certitude.",
    situation: "Une compétence est évoquée dans le CV, mais peu observée pendant l’évaluation. Votre équipe peut chercher un exemple ou une vérification complémentaire avant de conclure.",
    action: "Séparez les observations suffisamment étayées des informations encore incertaines.",
    evidence: "La source, la méthode et les limites permettent d’expliquer pourquoi une conclusion doit être utilisée avec prudence.",
    caution: "Un niveau de confiance n’est pas une probabilité d’embauche ou de réussite au poste. Ne lui attribuez pas un sens que la méthode ne justifie pas.",
    next: "Pour les critères essentiels, identifiez les données manquantes et la façon de les compléter.",
    criteria: ["Source", "Observation", "Limite", "Vérification complémentaire"],
  },
  "open-source-ai-receptionist-stack": {
    title: "Comprenez les éléments derrière une évaluation Okjobs", audience: "entreprise",
    lead: "Pour utiliser un rapport, vous devez savoir ce qu’il décrit et sur quoi il s’appuie. La transparence aide votre équipe à décider avec prudence.",
    situation: "Vous consultez un profil avec des expériences, des compétences déclarées et des résultats. Ces informations sont complémentaires, mais elles ne doivent pas être présentées comme équivalentes.",
    action: "Demandez l’origine des informations et les limites du protocole utilisé.",
    evidence: "Une restitution traçable permet de retrouver les critères du poste, les observations et la version de la méthode.",
    caution: "Une référence provisoire doit rester identifiée comme telle. Elle ne peut pas être présentée comme une norme déjà validée pour tous les métiers ou tous les publics.",
    next: "Vérifiez qu’une autre personne de votre équipe peut comprendre les raisons de votre sélection à partir du dossier.",
    criteria: ["Origine des informations", "Critères", "Version de la méthode", "Limites"],
  },
  "quo-sona-alternative": {
    title: "Utilisez une évaluation pour ce qu’elle permet réellement de conclure", audience: "entreprise",
    lead: "Un résultat devient utile quand son périmètre est clair. Certaines compétences ont été observées ; d’autres demandent encore une vérification.",
    situation: "Une mise en situation écrite renseigne sur une manière de traiter un problème. Elle ne démontre pas automatiquement tous les gestes pratiques nécessaires au métier.",
    action: "Pour chaque résultat, vérifiez la compétence visée et les conditions dans lesquelles elle a été observée.",
    evidence: "Les limites de la méthode vous aident à choisir ce qui doit être approfondi en entretien, en exercice pratique ou par un justificatif pertinent.",
    caution: "Ne généralisez pas un résultat à une aptitude qui n’a pas été évaluée. Une information insuffisante doit rester signalée comme insuffisante.",
    next: "Ajoutez à votre dossier de décision les vérifications encore nécessaires sur les responsabilités essentielles.",
    criteria: ["Compétence évaluée", "Conditions", "Portée du résultat", "Vérifications restantes"],
  },
  "ringcentral-ai-receptionist-alternative": {
    title: "Une shortlist utile explique pourquoi approfondir chaque profil", audience: "entreprise",
    lead: "Une liste de noms ne suffit pas. Votre équipe doit comprendre les correspondances avec le poste et les questions encore ouvertes.",
    situation: "Votre direction vous demande de présenter trois profils. Pour chacun, reliez les points forts aux attentes du poste et indiquez les éléments à confirmer.",
    action: "Présentez chaque recommandation avec ses arguments, ses limites et la prochaine vérification.",
    evidence: "Une shortlist documentée permet de relier une recommandation à des éléments précis du dossier.",
    caution: "La présélection n’est pas une décision d’embauche. Évitez de présenter un classement comme une conclusion définitive.",
    next: "Préparez une synthèse comparable pour chaque profil retenu avant l’échange avec les décideurs.",
    criteria: ["Correspondances", "Arguments", "Incertitudes", "Prochain entretien"],
  },
  "rosie-ai-alternative": {
    title: "Repérez les questions qui feront avancer votre entretien", audience: "entreprise",
    lead: "Transformez une incertitude en question précise. Vous obtenez un échange plus utile qu’en demandant simplement au candidat de se présenter à nouveau.",
    situation: "Vous ne savez pas comment la personne gère les priorités. Demandez une situation où plusieurs tâches urgentes se sont présentées et comment elle a choisi son ordre d’action.",
    action: "Formulez une question liée à un critère, puis demandez un exemple concret.",
    evidence: "Le contexte, la décision, les actions et leurs conséquences apportent des éléments pour apprécier la réponse.",
    caution: "Évitez les questions qui orientent vers la réponse attendue. Cherchez à comprendre la pratique, pas à faire confirmer votre première impression.",
    next: "Relisez votre grille et préparez une relance pour chaque point essentiel encore incertain.",
    criteria: ["Critère à vérifier", "Exemple", "Décision prise", "Conséquences"],
  },
  "smith-ai-alternative": {
    title: "Gardez la décision humaine au cœur du recrutement", audience: "entreprise",
    lead: "Le rapport vous aide à comprendre un dossier. La décision demande aussi votre connaissance des responsabilités, de l’équipe et des éléments restant à vérifier.",
    situation: "Une synthèse fait ressortir un point de vigilance. Avant de rejeter un profil, examinez les observations, leur portée et les informations qui pourraient préciser votre compréhension.",
    action: "Documentez les raisons de votre décision à partir des exigences du poste.",
    evidence: "Les résultats, les exemples d’expérience et les entretiens fournissent des repères complémentaires, sans remplacer votre appréciation contextualisée.",
    caution: "Ne faites pas d’un score une instruction automatique de retenir ou d’écarter une personne.",
    next: "Confirmez les éléments essentiels avec votre équipe et distinguez ce qui est établi de ce qui reste incertain.",
    criteria: ["Attentes du poste", "Éléments du dossier", "Incertitudes", "Décision expliquée"],
  },
  "upfirst-alternative": {
    title: "Préparez une évaluation qui vous aide à choisir", audience: "entreprise",
    lead: "Avant de lancer des tests, précisez le doute que vous souhaitez lever. Le résultat doit servir votre recrutement, pas ajouter une étape sans utilité.",
    situation: "Vous recrutez pour un poste administratif et hésitez entre plusieurs CV. Vous avez besoin d’éclairer l’organisation, la communication et la fiabilité du suivi, pas de mesurer tout le profil à la fois.",
    action: "Choisissez les compétences prioritaires et reliez-les aux tâches quotidiennes du poste.",
    evidence: "Une mise en situation pertinente fait apparaître une méthode de travail et prépare les points à approfondir avec le candidat.",
    caution: "Un résultat d’évaluation ne garantit pas une performance future. Vérifiez les responsabilités importantes avec les moyens adaptés.",
    next: "Validez les critères avec le responsable métier et convenez des livrables avant la passation.",
    criteria: ["Organisation", "Communication", "Suivi", "Méthode de travail"],
  },
  "why-lobbystack-is-moving-away-from-convex": {
    title: "Retrouvez les raisons derrière un résultat", audience: "entreprise",
    lead: "Une conclusion utile doit pouvoir être reliée à sa source. Votre équipe comprend mieux une évaluation lorsqu’elle peut retrouver les éléments qui l’appuient.",
    situation: "Deux évaluations ont été réalisées à des moments différents. Avant de les comparer, vérifiez le protocole, la version et les conditions utilisés.",
    action: "Conservez le contexte du résultat avec les informations qui ont servi à l’interpréter.",
    evidence: "Les observations et leur origine permettent d’expliquer une recommandation et de repérer les points qui demandent une nouvelle vérification.",
    caution: "Des résultats produits selon des méthodes ou des conditions différentes ne doivent pas être comparés sans examiner ces différences.",
    next: "Lorsque vous partagez une synthèse, gardez accessibles les critères, les sources et les limites nécessaires à sa compréhension.",
    criteria: ["Source", "Date", "Méthode", "Conditions"],
  },
  "zoom-ai-receptionist-alternative": {
    title: "Un écart identifié peut devenir une prochaine étape", audience: "candidat",
    lead: "Une compétence à développer ne signifie pas que votre parcours s’arrête. Elle vous aide à choisir un objectif de progression concret.",
    situation: "Vous souhaitez évoluer vers une fonction de coordination. Une évaluation fait ressortir un besoin de travailler l’organisation. Vous pouvez rechercher une activité ou une formation adaptée à ce besoin.",
    action: "Choisissez une compétence à travailler et une situation dans laquelle vous pourrez la pratiquer.",
    evidence: "Un exercice, un retour sur une réalisation ou une réévaluation adaptée peut aider à apprécier les acquis développés.",
    caution: "Toutes les formations ne correspondent pas à votre besoin. Vérifiez leurs prérequis, leurs objectifs et la manière dont les acquis seront appréciés.",
    next: "Définissez votre prochaine action et les éléments qui vous permettront de constater une progression.",
    criteria: ["Objectif", "Compétence à travailler", "Pratique", "Progression observée"],
  },
};

const escape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const paragraph = (value) => `<p>${escape(value)}</p>`;
const section = (title, ...paragraphs) => `<h2>${escape(title)}</h2>${paragraphs.map(paragraph).join("")}`;
const attr = (node, name) => node.attrs?.find((item) => item.name === name);
const text = (node) => node.nodeName === "#text" ? node.value : (node.childNodes ?? []).map(text).join("");

function setText(node, value) {
  const nodes = [];
  function collect(child) {
    if (child.nodeName === "#text") nodes.push(child);
    else (child.childNodes ?? []).forEach(collect);
  }
  collect(node);
  if (nodes.length) {
    nodes[0].value = value;
    nodes.slice(1).forEach((item) => { item.value = ""; });
  }
}

export function rewriteGuide(document, route) {
  const slug = route.match(/^\/blog\/([^/]+)\/$/)?.[1];
  const guide = guides[slug];
  if (!guide) return false;
  let copy;
  let article;
  let previousTitle;
  function locate(node) {
    if (node.tagName === "title") previousTitle = text(node).trim();
    if (node.tagName === "article" && attr(node, "id")?.value === "main-content") article = node;
    if (attr(node, "class")?.value.split(/\s+/).includes("blog-copy")) copy = node;
    for (const child of node.childNodes ?? []) locate(child);
  }
  locate(document);
  if (!copy || !article) throw new Error(`Blog template not found: ${route}`);
  const candidate = guide.audience === "candidat";
  const formation = guide.audience === "formation";
  const blocks = [
    paragraph(guide.lead),
    section("Partez d’une situation concrète", guide.situation,
      "Adaptez cet exemple à votre objectif et aux exigences réelles du poste."),
    section("Ce que vous voulez obtenir", candidate
      ? "Un parcours plus compréhensible, une lecture claire de vos acquis et une prochaine étape cohérente avec votre objectif."
      : formation ? "Une formation reliée à un besoin réel, avec des objectifs que le participant comprend et des acquis que vous pouvez apprécier."
        : "Des éléments concrets pour comparer les profils, préciser vos questions et expliquer votre décision à votre équipe.", guide.action),
    section("Commencez par un objectif précis", candidate
      ? "Définissez le métier ou la responsabilité que vous visez. Vous pourrez sélectionner les expériences et les compétences qui éclairent le mieux cet objectif."
      : formation ? "Précisez la situation professionnelle à laquelle votre programme prépare. Les compétences et prérequis deviennent plus faciles à expliquer."
        : "Clarifiez les tâches à réaliser, les responsabilités et le niveau attendu. Votre évaluation doit rester liée au travail réel.",
      "Un objectif précis évite d’accumuler des informations qui ne vous aideront pas à préparer la prochaine étape."),
    `<h2>Les repères à garder sous les yeux</h2><ul>${guide.criteria.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>`,
    section("Appuyez-vous sur des éléments concrets", guide.evidence,
      candidate ? "Décrivez votre contribution personnelle. Le contexte et les actions menées rendent votre exemple plus utile qu’une qualité annoncée sans illustration."
        : "Reliez chaque appréciation à un élément du dossier. Distinguez les compétences déclarées des observations et des documents disponibles."),
    section("Préparez des conditions adaptées", candidate
      ? "Avant une passation, lisez les consignes, vérifiez la durée annoncée et préparez les documents demandés. Si un incident survient, signalez-le selon les modalités du parcours."
      : "Clarifiez les conditions de passation et les possibilités d’assistance. Les difficultés de connexion ou d’équipement ne doivent pas être automatiquement interprétées comme un manque de compétence.",
      "Dans le contexte congolais, vérifiez les conditions réelles de chaque participant plutôt que de supposer que tout le monde dispose du même équipement. Une bonne préparation aide à distinguer un incident technique d’une difficulté professionnelle."),
    section("Lisez le résultat avec son contexte", guide.caution,
      "Une restitution doit distinguer les observations, les incertitudes et les limites. Un résultat exploratoire ne doit pas être présenté comme une méthode déjà validée."),
    section("Transformez vos doutes en questions", candidate
      ? "Préparez un exemple de votre parcours pour expliquer un point fort. Pour une difficulté, cherchez quelle compétence est concernée et quelle pratique pourrait vous aider."
      : "Pour chaque critère important encore incertain, préparez une question ou une vérification adaptée. Un entretien, un exercice pratique ou un justificatif peut compléter les éléments disponibles.",
      "Le but n’est pas d’obtenir une réponse parfaite, mais de comprendre une expérience, un raisonnement ou une pratique pertinente."),
    section("Gardez une lecture honnête du profil", candidate
      ? "Présentez ce que vous avez fait sans inventer d’expérience ou de diplôme. Les stages, missions et apprentissages peuvent être expliqués avec leur contexte réel."
      : "Ne réduisez pas un candidat à une impression ou à un score. Documentez les correspondances avec le poste et les éléments qui restent à confirmer.",
      "Partagez uniquement les informations nécessaires et les documents que vous êtes autorisé à communiquer."),
    section("Ce qu’Okjobs peut apporter", candidate
      ? "Okjobs aide à rendre votre parcours lisible et à comprendre les résultats disponibles dans votre parcours. Le compte candidat est gratuit."
      : formation ? "La vision Okjobs relie les besoins de développement aux formations pertinentes. Le parcours Learning est prévu dans une phase ultérieure : il ne faut pas le présenter comme un service déjà ouvert à tous."
        : "Assessment fournit des évaluations et des rapports selon le périmètre convenu. Recruitment ajoute un accompagnement aux étapes retenues avec votre équipe. Les prestations entreprises sont sur devis.",
      "Le périmètre disponible doit être confirmé pour votre parcours. Ni une évaluation ni une création de compte ne garantit un entretien ou une embauche."),
    section("Votre prochaine action", guide.next,
      candidate ? "Choisissez une action réalisable : compléter une expérience, préparer un exemple ou approfondir un résultat. Vous avancez avec un objectif plus clair."
        : "Commencez par un besoin réel et un périmètre limité. Les retours sur ce premier parcours aideront à vérifier l’utilité des livrables avant d’élargir l’usage."),
  ];
  const fragment = parseFragment(blocks.join("\n"));
  copy.childNodes = fragment.childNodes;
  copy.childNodes.forEach((node) => { node.parentNode = copy; });

  function update(node, inArticle = false, inCopy = false) {
    const insideArticle = inArticle || node === article;
    const insideCopy = inCopy || node === copy;
    if (node.tagName === "title") setText(node, `${guide.title} | Okjobs`);
    if (node.tagName === "meta") {
      const name = attr(node, "name")?.value ?? attr(node, "property")?.value;
      const content = attr(node, "content");
      if (content && ["og:title", "twitter:title"].includes(name)) content.value = guide.title;
      if (content && ["description", "og:description", "twitter:description"].includes(name)) content.value = guide.lead;
      if (content && name === "article:modified_time") content.value = "2026-10-06T00:00:00.000Z";
    }
    if (node.tagName === "time" && text(node).trim().startsWith("Updated")) {
      setText(node, "Mis à jour le 6 octobre 2026");
      const date = attr(node, "datetime");
      if (date) date.value = "2026-10-06T00:00:00.000Z";
    }
    if (insideArticle && !insideCopy && node.nodeName === "#text") {
      if (node.value.trim() === previousTitle || /alternative:|alternative for|AI receptionist|AI phone answering|GPT-Live|MIT:|Convex/i.test(node.value.trim())) node.value = guide.title;
      if (node.value.trim() === "Comparisons") node.value = "Guides pratiques";
      if (node.value.trim() === "Related reading") node.value = "Pour préparer la suite";
      if (node.value.trim() === "Continue with Okjobs") node.value = "Votre prochaine étape avec Okjobs";
      if (node.value.trim() === "By") node.value = "Par ";
      if (node.value.trim() === "Okjobs Team") node.value = "Équipe Okjobs";
    }
    if (node.tagName === "script" && attr(node, "type")?.value === "application/ld+json") {
      try {
        const schema = JSON.parse(text(node));
        const body = text(copy).replace(/\s+/g, " ").trim();
        function updateSchema(value) {
          if (!value || typeof value !== "object") return;
          if (["BlogPosting", "Article", "WebPage"].includes(value["@type"])) {
            if (value.name) value.name = guide.title;
            if (value.headline) value.headline = guide.title;
            if (value.description) value.description = guide.lead;
            if (value.articleBody) value.articleBody = body;
            if (value.articleSection) value.articleSection = "Guides pratiques";
            if (value.dateModified) value.dateModified = "2026-10-06T00:00:00.000Z";
          }
          Object.values(value).forEach(updateSchema);
        }
        updateSchema(schema);
        setText(node, JSON.stringify(schema));
      } catch { /* Leave unknown structured-data formats untouched. */ }
      return;
    }
    if (["script", "style"].includes(node.tagName)) return;
    for (const child of node.childNodes ?? []) update(child, insideArticle, insideCopy);
  }
  update(document);
  return true;
}

export function rewriteGuideLinks(document) {
  function visit(node) {
    if (["script", "style"].includes(node.tagName)) return;
    if (node.tagName === "a") {
      const slug = attr(node, "href")?.value.match(/\/blog\/([^/#?]+)\/?(?:[?#].*)?$/)?.[1];
      if (guides[slug]) setText(node, guides[slug].title);
    }
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(document);
}
