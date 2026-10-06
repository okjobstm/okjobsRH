import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parse, serialize } from "parse5";
import { applyPersonaCopy, rewritePersonaRuntime } from "./okjobs-persona-copy.mjs";
import { rewriteGuide, rewriteGuideLinks } from "./okjobs-guides.mjs";
import { applyDirectorHomeCopy } from "./okjobs-home-director-copy.mjs";
import { applyOkjobsImages } from "./okjobs-public-images.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultRoot = path.join(projectRoot, "public", "_lobbystack");

const common = new Map(Object.entries({
  "Features": "Candidats",
  "Solutions": "Entreprises",
  "Pricing": "Tarifs",
  "Resources": "Ressources",
  "Product": "Découvrir",
  "Company": "Okjobs",
  "How it Works": "Notre méthode",
  "About": "À propos",
  "Blog": "Ressources",
  "Help Center": "Notre méthode",
  "Privacy Policy": "Confidentialité",
  "Cookie Policy": "Cookies",
  "Terms of Service": "Conditions d’utilisation",
  "Privacy": "Confidentialité",
  "Terms": "Conditions",
  "Cookie preferences": "Préférences de cookies",
  "All rights reserved.": "Tous droits réservés.",
  "Skip to main content": "Aller au contenu principal",
  "Top Uses": "Services",
  "AI phone answering": "Assessment",
  "AI appointment scheduler": "Recruitment",
  "After-hours answering": "Évaluation en groupe",
  "Self-hosted AI receptionist": "Accompagnement sur mesure",
  "By Trade": "Types d’organisation",
  "Plumbers": "PME",
  "HVAC": "ONG",
  "Electricians": "Institutions",
  "Garage door repair": "Métiers opérationnels",
  "Appliance repair": "Fonctions support",
  "Restoration": "Profils juniors",
  "Locksmiths": "Profils expérimentés",
  "Roofing": "Recrutement individuel",
  "Property management": "Campagnes de recrutement",
  "By Industry": "Parcours",
  "Home services": "Candidats",
  "Dental offices": "Évaluation",
  "Salons and spas": "Recrutement",
  "Changelog": "Notre méthode",
  "Missed Call Calculator": "Construire mon profil",
  "Missed call calculator": "Construire mon profil",
  "Affiliate Program": "Offre entreprise",
  "Log in": "Se connecter",
  "GitHub": "À propos",
  "Try for free": "Créer un compte",
  "Start free": "Créer un compte",
  "View pricing": "Voir les offres",
  "View pricing details": "Voir les offres",
  "See pricing": "Voir les offres",
  "Contact us": "Nous contacter",
  "Common questions": "Questions fréquentes",
  "No credit card required. Cancel anytime.": "Création de compte gratuite.",
  "No credit card required to start.": "Création de compte gratuite.",
  "Never miss another ready-to-book caller": "Construisez un profil qui montre ce que vous savez faire",
  "Test 30 browser voice minutes for free. No telephone number included.": "La création du compte candidat est gratuite.",
}));

const home = new Map(Object.entries({
  "Okjobs turns missed calls into booked work.": "Montrez ce que vous savez faire. Recrutez sur des critères qui comptent.",
  "Okjobs is an AI receptionist for small businesses. It answers your phone, books appointments into your calendar, and sends urgent calls to your team. Use it for every call, or only when you're busy.": "Okjobs aide les candidats à construire un profil professionnel clair et permet aux entreprises d’évaluer chaque candidature à partir de compétences, d’éléments observés et de critères métier.",
  "Free plan with 30 minutes a month. Paid plans from $30.": "Accès gratuit pour les candidats. Offres entreprises établies selon le besoin.",
  "Ready when you are": "Prêt quand vous l’êtes",
  "Start call": "Découvrir",
  "Turn missed calls into booked work": "Un profil structuré pour aller au-delà du CV",
  "Okjobs captures what callers need, books appointments when they are ready, and routes urgent calls with context.": "Okjobs rassemble le parcours, les compétences déclarées et les résultats observés dans une lecture claire et utile.",
  "Turn unanswered calls into booked work": "Construire un profil professionnel",
  "Okjobs answers when your team cannot, captures what the caller needs, and helps them book or request a callback.": "Organisez vos expériences, vos formations, vos certifications et vos compétences dans un profil que vous pouvez comprendre et développer.",
  "See how it works": "Voir le parcours candidat",
  "Send the right calls to your team": "Évaluer selon les critères du poste",
  "Okjobs can answer routine calls, take a message, or route urgent conversations to your team with the caller's details and reason attached.": "Définissez les compétences attendues, comparez les candidatures sur une même grille et préparez les points à vérifier en entretien.",
  "Set routing rules": "Découvrir l’offre entreprise",
  "Answer calls and book appointments while you work": "Du parcours déclaré aux compétences observées",
  "Answer questions, qualify new customers, book appointments, capture follow-up details, and route urgent calls with context.": "Chaque information conserve son origine afin de distinguer ce qui est déclaré, documenté ou observé pendant une évaluation.",
  "Answers your calls": "Structure le parcours",
  "Okjobs can answer all your calls, or only when you're unavailable. It answers questions from your business information and collects what your team needs to follow up.": "Le CV, les expériences, les formations et les certifications sont organisés dans un profil professionnel cohérent.",
  "Books appointments": "Identifie les compétences",
  "Connect Google Calendar, and Okjobs checks availability, offers open times, books the appointment, and texts the caller a confirmation.": "Les compétences auto-déclarées restent séparées des compétences vérifiées par un test, une certification ou une expérience documentée.",
  "Collects caller details": "Contextualise les évaluations",
  "Okjobs collects names, contact info, service needs, timing, and next steps so your team can follow up with context.": "Les résultats indiquent ce qui a été observé, le niveau de confiance, la méthode utilisée et ses limites.",
  "Transfers when needed": "Prépare la progression",
  "When a customer needs a person, Okjobs can transfer the call or take a clear message with the caller's details and reason for calling.": "Les écarts deviennent des pistes de développement et peuvent orienter les prochaines compétences à travailler.",
  "Answers from everything your business knows": "Une lecture commune pour les candidats et les entreprises",
  "Import your website, PDFs, documents, spreadsheets, service lists, policies, and FAQs so Okjobs can answer with the same context your team uses every day.": "Le candidat comprend son profil. L’entreprise retrouve les critères du poste, les correspondances, les écarts et les points qui nécessitent une vérification humaine.",
  "AI receptionist for teams who care about response quality": "Des décisions mieux préparées, sans réduire une personne à une note",
  "Cover the phone without giving up the details, judgment, and follow through that customers notice.": "Les rapports décrivent des résultats observés et contextualisés. Ils ne remplacent jamais la décision humaine.",
  "Explore AI phone answering": "Comprendre notre méthode",
  "A receptionist that picks up when you need it to": "Un profil qui montre plus qu’un intitulé de poste",
  "Let Okjobs answer every call, or only step in when your team is busy, after hours, or unable to pick up.": "Rassemblez votre expérience et vos compétences dans une structure lisible, réutilisable et conçue pour évoluer avec votre parcours.",
  "Appointments booked without the back-and-forth": "Des critères métier définis avant l’évaluation",
  "Offer available times, confirm appointments, and send follow-up details without manual back-and-forth.": "Les compétences, les niveaux attendus et les critères éliminatoires sont distingués pour rendre l’analyse compréhensible.",
  "Human handoff when a call needs it": "Une validation humaine à chaque décision",
  "Route urgent or unusual calls to a human with the caller's reason, contact details, and conversation context attached.": "Okjobs met en évidence les correspondances et les points de vigilance afin d’aider le recruteur à poser les bonnes questions.",
  "Launch your AI receptionist in minutes": "Construisez votre profil étape par étape",
  "Set up the receptionist once, then refine how it answers, books, routes, and summarizes as your business grows.": "Commencez par votre parcours, complétez vos compétences, passez les évaluations utiles puis consultez les résultats avec leur contexte.",
  "Read the buyer guide": "Voir les ressources",
  "Connect your phone": "Ajoutez votre parcours",
  "Use a new local number or forward calls from the business number customers already call.": "Créez votre CV ou importez un document existant pour organiser vos expériences et vos formations.",
  "Add your knowledge": "Déclarez vos compétences",
  "Import your website, files, services, FAQs, hours, policies, and the details callers ask about most.": "Indiquez vos compétences actuelles sans les confondre avec celles qui ont déjà été vérifiées.",
  "Set the rules": "Passez les évaluations utiles",
  "Decide when Okjobs should answer, book appointments, take a message, or hand the call to a person.": "Répondez à des tests ou mises en situation liés au métier visé, selon une méthode clairement expliquée.",
  "Go live": "Comprenez la suite",
  "Okjobs starts answering calls, helping customers, and sending confirmations and summaries automatically.": "Consultez les résultats observés, les écarts à travailler et les prochaines étapes possibles.",
  "Keep control of every call": "Gardez le contrôle de chaque décision",
  "Okjobs handles routine conversations, but your team decides what it knows, what it can do, and when the call should come back to a person.": "L’entreprise définit les critères du poste. Okjobs structure les informations et la décision finale reste humaine.",
  "Control what your AI receptionist can say": "Définissez vos critères métier",
  "Update services, pricing, policies, FAQs, and instructions whenever your business changes, without waiting on a developer.": "Précisez les compétences, leur importance, les niveaux attendus et les points qui doivent être vérifiés pendant l’entretien.",
  "Review every call in one place": "Consultez une analyse traçable",
  "See recordings, transcripts, summaries, caller details, bookings, and next steps without digging through voicemails or scattered notes.": "Retrouvez la source des informations, la version de la méthode, le niveau de confiance et les limites de chaque résultat.",
  "Start free. Upgrade when calls grow.": "Un accès candidat gratuit, des offres entreprises sur devis",
  "Try Okjobs with included usage, then move to Starter or Pro when you are ready for production call coverage.": "Le service entreprise est cadré selon le nombre de candidats, les évaluations nécessaires et le niveau d’accompagnement.",
  "Free": "Candidat",
  "$0": "Gratuit",
  "30 browser voice minutes. No telephone number or credit card required.": "Profil professionnel, compétences et résultats accessibles au candidat.",
  "Starter": "Assessment",
  "$30/mo": "Sur devis",
  "150 voice minutes, 50 alert SMS segments, 20 transfer attempts, and email support.": "Évaluations liées au poste, rapports contextualisés et comparaison par critères.",
  "Pro": "Recruitment",
  "$100/mo": "Sur devis",
  "500 voice minutes, 200 alert SMS segments, 100 transfer attempts, and priority email support.": "Cadrage du besoin, présélection, évaluations et shortlist documentée.",
  "Enterprise": "Accompagnement",
  "Custom": "Sur mesure",
  "Higher volume, multiple numbers, and self-hosting implementation support.": "Un périmètre défini avec votre équipe selon le contexte et le volume du recrutement.",
  "Proudly open-source, self-hosted": "Une méthode transparente et progressivement validée",
  "Run Okjobs on your own servers and keep call recordings and customer data in your own infrastructure.": "Les seuils et normes provisoires sont identifiés comme tels puis recalibrés à partir de données de suivi fiables.",
  "View on GitHub": "Notre méthode",
  "Self-Hosting Overview": "Vision Okjobs",
  "Answering service by trade": "Des usages adaptés à chaque parcours",
  "See how Okjobs handles emergencies, bookings, and quotes for your kind of business.": "Découvrez comment Okjobs accompagne les candidats, les recruteurs et le développement des compétences.",
  "Plumbing answering service": "Créer son profil",
  "Burst pipes, sewage backups, and drain bookings": "Structurer expériences, formations et certifications",
  "HVAC answering service": "Déclarer ses compétences",
  "No-heat emergencies and heat-wave overflow": "Distinguer le déclaré du vérifié",
  "Electrician answering service": "Passer une évaluation",
  "Hazard calls, panel upgrades, and EV chargers": "Observer des compétences liées au métier",
  "Roofing answering service": "Comprendre ses résultats",
  "Storm surges, active leaks, and inspections": "Identifier les forces et les écarts",
  "Property management answering service": "Définir un besoin",
  "After-hours maintenance and showing requests": "Transformer la fiche de poste en critères",
  "Contractor answering service": "Comparer les profils",
  "Job-site emergencies after hours": "Utiliser une même grille de lecture",
  "Dental answering service": "Préparer l’entretien",
  "New patients, recalls, and dental emergencies": "Repérer les points à vérifier humainement",
  "Salon and spa answering service": "Documenter la shortlist",
  "Bookings and reschedules while you're with a client": "Conserver les raisons de chaque recommandation",
  "Garage door repair": "Développer les compétences",
  "Broken springs and doors stuck shut": "Transformer les lacunes en pistes de progression",
  "Appliance repair": "Suivre la méthode",
  "Repair bookings with the brand and model attached": "Connaître la source et les limites des résultats",
  "Restoration": "Recalibrer progressivement",
  "Flooding, fire, and mold calls at any hour": "Améliorer les normes avec des données fiables",
  "Locksmiths": "Décider humainement",
  "Lockouts, rekeys, and key replacements": "Utiliser l’évaluation comme aide à la décision",
  "Never miss another ready-to-book caller": "Construisez un profil qui montre ce que vous savez faire",
  "Test 30 browser voice minutes for free. No telephone number included.": "La création du compte candidat est gratuite.",
  "Can I customize my AI receptionist's greeting and tone?": "Puis-je modifier mon profil après sa création ?",
  "Yes. Okjobs lets you customize the greeting, tone, business instructions, and call handling rules so your AI receptionist sounds aligned with your brand.": "Oui. Votre profil est évolutif : vous pouvez compléter votre parcours, vos compétences et les éléments qui les documentent.",
  "What happens when a caller asks something unusual?": "Comment les compétences déclarées sont-elles présentées ?",
  "You define the fallback behavior. Okjobs can take a message for your team or transfer the caller to a person.": "Elles restent clairement séparées des compétences vérifiées afin de conserver une lecture honnête du profil.",
  "Can Okjobs book appointments directly into my calendar?": "Que montrent les résultats d’une évaluation ?",
  "Yes. Okjobs can check availability, offer appointment times, book the appointment, and send confirmation details to the caller.": "Ils décrivent les dimensions observées, leur niveau de confiance, leurs limites et leur correspondance avec les critères du parcours.",
  "Can the AI receptionist send a call summary to my phone?": "Une évaluation décide-t-elle à la place du recruteur ?",
  "Yes. Okjobs emails you after each call with the caller's details, reason for calling, outcome, and next step. On paid plans, you can also turn on SMS alerts.": "Non. Okjobs fournit des éléments structurés pour préparer la décision, qui reste toujours humaine.",
  "What types of calls should still go to a human?": "Comment les écarts sont-ils utilisés ?",
  "Okjobs is a strong fit for routine questions, bookings, intake, and lead qualification. Complex negotiations, sensitive situations, urgent cases, and specialized troubleshooting can be transferred to your team.": "Ils peuvent devenir des pistes de développement, des questions à approfondir ou des compétences à réévaluer ultérieurement.",
  "Is Okjobs open source?": "La méthode est-elle transparente ?",
  "Yes. Okjobs is an open-source AI receptionist. You can use Okjobs Cloud for a hosted setup or self-host the stack when you want more control over infrastructure and customer data.": "Oui. La source, la version, le niveau de confiance et les limites des résultats doivent rester visibles et compréhensibles.",
  "How much does an AI receptionist cost?": "Combien coûte Okjobs ?",
  "Okjobs starts free with 30 voice minutes per month for browser test calls. Paid plans begin at $30 per month for Starter and $100 per month for Pro, with usage-based overages. Enterprise pricing is available for higher volume and self-hosted support.": "Le compte candidat est gratuit. Les offres entreprises sont établies sur devis après cadrage du besoin.",
  "How is Okjobs different from a call tree or voicemail?": "En quoi Okjobs dépasse-t-il un CV classique ?",
  "A call tree pushes callers through rigid menus, and voicemail asks them to wait for a callback. Okjobs answers naturally, uses your business knowledge, can book appointments during the call, and sends your team a summary with context instead of a raw message.": "Okjobs relie le parcours, les compétences, les résultats observés et les critères métier tout en conservant l’origine et les limites de chaque information.",
}));

const features = new Map(Object.entries({
  "AI receptionist features that actually get work done": "Un profil professionnel qui montre ce que vous savez réellement faire",
  "Okjobs handles AI phone answering, appointment booking, team notifications, call routing, quotes, and lead qualification without phone trees or workflow-builder mess.": "Okjobs structure le parcours, les compétences et les résultats observés afin de rendre le profil plus clair pour le candidat comme pour l’entreprise.",
  "Write the workflow": "Construire le profil",
  "When someone asks for a quote, ask what service they need, where they are located, their timeline, and their budget. Give our approved price range for standard jobs. If they need exact pricing, book an on-site estimate and attach the summary for the team.": "Organiser les expériences, les formations et les certifications. Distinguer ensuite les compétences déclarées de celles qui sont vérifiées par une évaluation, une certification ou une expérience documentée.",
  "Okjobs handles the call": "Le profil devient lisible",
  "Quote request from Sarah M.": "Profil professionnel de Sarah M.",
  "Service: Renovation estimate": "Expérience : gestion de projet",
  "Budget: $8,000 to $12,000": "Compétence : organisation",
  "Timeline: Next month": "Objectif : poste opérationnel",
  "Price range shared": "Parcours structuré",
  "On-site estimate needed": "Évaluation recommandée",
  "Review the outcome": "Comprendre le résultat",
  "Estimate visit booked": "Évaluation terminée",
  "Tuesday at 2:00 PM": "Résultats disponibles",
  "Assigned to Alex": "Dimensions observées",
  "Customer confirmation sent": "Niveau de confiance indiqué",
  "Team notification sent": "Limites précisées",
  "Summary attached": "Pistes de progression proposées",
  "Everything your front desk should already be doing": "Tout ce qu’un profil professionnel doit rendre visible",
  "Okjobs answers, books, qualifies, quotes, transfers, filters junk, and keeps your team in the loop.": "Le parcours, les compétences, les preuves, les résultats observés et les prochaines étapes sont réunis sans confondre leur origine.",
  "Build workflows with words, not flowcharts": "Décrivez votre parcours avec des mots clairs",
  "Train Okjobs the way you would train a real employee. Tell it what to ask, what to say, when to quote, when to book, when to transfer, and who to notify without touching a workflow builder.": "Présentez vos expériences, vos responsabilités et vos réalisations dans une structure compréhensible et réutilisable.",
  "If a caller asks for pricing, ask the required quote questions, give the approved price range, and take a message for the team if they need exact pricing.": "Une compétence déclarée reste distincte d’une compétence vérifiée. Chaque information conserve sa source.",
  "Book appointments while the customer is still ready": "Passez les évaluations liées à votre objectif",
  "Okjobs checks availability, offers times, books the appointment, and sends the confirmation before the caller moves on to someone else.": "Les tests et mises en situation sont proposés selon le métier visé et accompagnés d’une méthode explicite.",
  "Give quotes without making callers wait": "Comprenez ce qui a réellement été observé",
  "For approved services, Okjobs can give exact prices, starting prices, or price ranges. For custom work, it asks the right questions and passes the details to your team.": "Le rapport présente les dimensions observées, leur correspondance avec les critères et les points de vigilance.",
  "Transfer the calls that need a person": "Gardez la décision humaine",
  "Okjobs handles routine calls first, then transfers based on your instructions. Urgent requests, upset customers, high-value leads, and special cases can go straight to the right person.": "Aucun résultat n’est présenté comme une vérité absolue. Le candidat et le recruteur conservent le contexte nécessaire.",
  "Pay for real calls, not junk": "Transformez les écarts en pistes de développement",
  "Okjobs excludes spam calls and calls under 10 seconds from usage, so wrong numbers, robocalls, instant hang-ups, and pocket dials do not eat your plan.": "Une lacune identifiée peut orienter une formation, une nouvelle expérience ou une réévaluation ultérieure.",
  "Your business is not a flowchart": "Votre parcours ne tient pas dans une case",
  "Real calls are messy. Customers interrupt, change their mind, ask multiple questions, and explain things out of order. Okjobs lets you describe the outcome in plain English instead of building fragile call trees.": "Les parcours réels sont variés. Okjobs conserve cette richesse tout en organisant les informations nécessaires à une lecture professionnelle.",
  "Your phone, always staffed": "CV structuré",
  "Answers in your caller's language": "Compétences déclarées",
  "Unlimited concurrent calls": "Compétences vérifiées",
  "Natural conversations": "Évaluations contextualisées",
  "Dedicated call lines": "Résultats expliqués",
  "Lead qualification": "Niveau de confiance",
  "Service-area checks": "Limites visibles",
  "Appointment confirmation texts": "Pistes de développement",
  "Rescheduling": "Profil évolutif",
  "Cancellations": "Origine traçable",
  "Appointment reminders": "Méthode versionnée",
  "Call summaries": "Synthèse du profil",
  "Full transcripts": "Détails des résultats",
  "Call recordings": "Éléments documentés",
  "Email and SMS notifications": "Suivi des étapes",
  "Business knowledge": "Référentiel métier",
  "Service rules": "Critères du poste",
  "Do-not-say instructions": "Précautions d’interprétation",
  "Fallback behavior": "Points à vérifier",
  "Failed-transfer fallback": "Validation humaine",
  "Call history": "Historique du parcours",
  "Lead status": "État de la candidature",
  "Appointment activity": "Progression du profil",
  "Revenue opportunities": "Opportunités pertinentes",
  "Okjobs can answer every call or step in only when your team is busy, closed, or unavailable.": "Votre profil reste disponible et peut être complété à mesure que votre parcours évolue.",
  "Okjobs replies in the language the caller speaks, so customers who don't speak English can still book and ask questions.": "Présentez vos compétences avec des termes clairs et adaptés au contexte professionnel visé.",
  "Multiple customers can be helped at the same time instead of waiting in a queue or hitting a busy line.": "Plusieurs dimensions peuvent être observées sans être confondues dans une note unique.",
  "Customers can speak normally. Okjobs handles interruptions, follow-up questions, and messy real-world calls.": "Les évaluations conservent le contexte nécessaire pour interpréter les résultats avec prudence.",
  "Use Okjobs for a sales line, quote line, booking line, support line, or intake line.": "Utilisez le même profil pour présenter votre parcours, vos compétences et vos objectifs.",
  "Have Okjobs ask about budget, timeline, location, service type, urgency, and buying intent before booking or transferring.": "Les critères du poste permettent de relier l’évaluation aux compétences réellement attendues.",
  "Ask for a postal code or ZIP code before booking and route customers based on where you actually serve.": "Chaque résultat indique le contexte dans lequel il peut être utilisé et les conclusions qu’il ne permet pas de tirer.",
  "After booking, Okjobs sends the customer a confirmation text with the appointment details.": "Les prochaines étapes utiles sont présentées clairement à la fin du parcours.",
  "Customers can reschedule when your rules allow it, without waiting for your team to call back.": "Le profil peut être enrichi après une nouvelle expérience, une formation ou une évaluation.",
  "Okjobs can handle cancellations according to your policies and notify your team.": "Les informations conservent leur origine pour faciliter leur vérification.",
  "If the caller agrees, Okjobs texts them a reminder 24 hours before the appointment.": "La méthode utilisée et sa version accompagnent les résultats concernés.",
  "Every important call can end with a clear summary, outcome, and next step.": "Chaque parcours se termine par une synthèse claire et des prochaines étapes possibles.",
  "Review the full conversation when your team needs more detail than the summary.": "Consultez le détail des dimensions observées lorsque la synthèse ne suffit pas.",
  "Listen to any call again from your dashboard.": "Retrouvez les éléments documentés depuis votre espace personnel.",
  "Send booking updates, quote requests, urgent alerts, missed-transfer summaries, and high-value lead notices to the right person.": "Suivez les étapes importantes du profil et du parcours d’évaluation.",
  "Add your services, prices, hours, locations, policies, FAQs, and staff details so Okjobs knows what to say.": "Le référentiel métier rassemble les compétences et niveaux attendus pour le poste.",
  "Set different instructions for different services, locations, staff, appointment types, or lead types.": "Les critères peuvent être adaptés au poste, au niveau recherché et au contexte du recrutement.",
  "Tell Okjobs what it should never promise, explain, diagnose, quote, or book.": "Les précautions d’interprétation évitent de présenter un résultat comme une vérité absolue.",
  "When Okjobs does not know something, it can ask follow-up questions, take a message, transfer, or notify the team.": "Les points incertains deviennent des questions à vérifier plutôt que des conclusions définitives.",
  "If no one picks up, Okjobs takes a message and sends your team a summary.": "La validation humaine reste nécessaire lorsque les informations sont incomplètes.",
  "See every call, caller, outcome, summary, appointment, and transfer.": "Retrouvez les étapes, les résultats et les évolutions importantes de votre parcours.",
  "See which calls became qualified leads, quote requests, or appointments.": "Suivez l’état de votre profil et des candidatures auxquelles il est associé.",
  "Review bookings, reschedules, cancellations, and confirmation texts.": "Visualisez les évaluations réalisées et les compétences qui ont évolué.",
  "Highlight calls that became bookings, quote requests, or high-value leads.": "Repérez les opportunités cohérentes avec votre profil et vos objectifs.",
  "Answer telephone calls with Starter or Pro": "Un parcours candidat gratuit et des offres entreprises sur devis",
  "Call answering": "Profil structuré",
  "Plain-language workflows": "Parcours expliqué",
  "Appointment booking": "Pistes de développement",
  "Transfers": "Validation humaine",
  "Email notifications": "Suivi des étapes",
  "SMS notifications": "Informations utiles",
  "Spam filtering": "Critères explicites",
  "Calls under 10 seconds excluded": "Limites indiquées",
  "Knowledge base": "Référentiel métier",
  "Dashboard and call history": "Profil et historique",
  "Appointment booked": "Évaluation terminée",
  "Team notified": "Équipe informée",
  "Notes attached": "Synthèse jointe",
  "Urgent call": "Point prioritaire",
  "Routed to manager": "À vérifier en entretien",
  "Sales lead": "Candidature pertinente",
  "Routed to sales": "À examiner par l’équipe",
  "Billing request": "Question spécifique",
  "Routed to billing": "Réponse à compléter",
  "No answer": "Information manquante",
  "Message taken": "Point documenté",
  "Real customer calls": "Éléments observés",
  "Counted": "Pris en compte",
  "Spam calls": "Éléments non pertinents",
  "Excluded": "Exclus",
  "Under 10 seconds": "Données insuffisantes",
  "Answer telephone calls with Starter or Pro": "Commencez gratuitement avec un profil candidat",
  "Test 30 browser voice minutes on Free, without a telephone number. Choose Starter or Pro for a dedicated number and the telephone features below.": "Les offres entreprises sont définies sur devis selon le volume, les évaluations et le niveau d’accompagnement.",
  "Included on Starter and Pro": "Disponible selon le parcours",
  "Stop letting missed calls decide your revenue": "Ne laissez plus un CV résumer tout votre potentiel",
  "Let Okjobs answer, qualify, quote, book, and notify your team day or night.": "Construisez un profil professionnel clair, comprenez vos compétences et préparez la prochaine étape.",
}));

const solutions = new Map(Object.entries({
  "AI receptionist solutions": "Évaluation et recrutement structurés",
  "Choose the Okjobs call workflow that matches how your business answers phones, books appointments, routes calls, and takes messages.": "Choisissez le niveau d’accompagnement adapté à votre besoin : évaluer des candidatures selon vos critères ou confier une partie du recrutement à Okjobs.",
  "These pages use the same product capabilities listed on the": "Ces parcours s’appuient sur le même profil professionnel présenté dans la",
  "features page": "page candidats",
  ": call answering, appointment booking, transfers, notifications, summaries, transcripts, and call history.": " : parcours, compétences déclarées, évaluations, résultats contextualisés et historique.",
  "AI phone answering": "Définition des critères métier",
  "Answer calls, capture caller details, book appointments, and route requests based on your rules.": "Transformez la fiche de poste en compétences attendues, niveaux, priorités et critères à vérifier.",
  "AI appointment scheduler": "Évaluation individuelle",
  "Turn booking calls into scheduled appointments with confirmations and team notifications.": "Proposez une batterie d’évaluation cohérente à un candidat et recevez un rapport contextualisé.",
  "Home services": "Évaluation en groupe",
  "Book HVAC, plumbing, electrical, roofing, landscaping, and other service calls while crews work.": "Évaluez plusieurs candidatures avec une même grille afin de rendre la comparaison plus lisible.",
  "After-hours answering": "Rapports contextualisés",
  "Cover calls when your team is busy, closed, or unavailable without staffing another shift.": "Consultez les correspondances, les écarts, le niveau de confiance et les limites des résultats.",
  "Dental offices": "Shortlist documentée",
  "Answer patient calls, book appointments, handle routine questions, and route urgent calls by your rules.": "Préparez une sélection expliquée sans réduire les candidats à une note unique.",
  "Salons and spas": "Questions d’entretien",
  "Book clients, answer service questions, and handle reschedules while providers stay with clients.": "Transformez les points de vigilance en questions concrètes à vérifier avec le candidat.",
  "Self-hosted AI receptionist": "Okjobs Assessment",
  "Run Okjobs on infrastructure you control when your team needs deployment and data-control flexibility.": "Vous pilotez le recrutement ; Okjobs structure les critères, les évaluations et les rapports.",
  "Open-source AI receptionist": "Okjobs Recruitment",
  "Audit the call handling logic, customize prompts and routing, and deploy on your own infrastructure.": "Okjobs accompagne le cadrage, la présélection, les évaluations et la préparation de la shortlist.",
  "AI receptionist for your trade": "Une méthode adaptée au métier",
  "Okjobs handles the call patterns that matter most in each trade: emergency screening, intake questions, booking, and after-hours routing.": "Les critères et les évaluations sont adaptés au poste et au contexte de recrutement, puis documentés pour rester compréhensibles.",
  "Plumbers": "PME",
  "HVAC": "ONG",
  "Electricians": "Institutions",
  "Garage door repair": "Métiers opérationnels",
  "Appliance repair": "Fonctions support",
  "Restoration": "Profils juniors",
  "Locksmiths": "Profils expérimentés",
  "Roofing": "Recrutements individuels",
  "Property management": "Campagnes de recrutement",
  "Contractor after-hours": "Besoins spécifiques",
  "Comparisons": "Deux niveaux d’accompagnement",
  "Not sure whether an AI receptionist is right for your situation? These comparisons break down the tradeoffs honestly.": "Gardez la maîtrise du recrutement ou confiez-nous davantage d’étapes selon vos ressources internes.",
  "AI receptionist vs virtual receptionist": "Assessment : vous gardez le pilotage",
  "Understand when AI, human, or a hybrid approach fits your call answering needs.": "Okjobs fournit la méthode, les évaluations et les rapports nécessaires à votre équipe.",
  "AI receptionist vs voicemail": "Recruitment : nous accompagnons le processus",
  "See how an AI receptionist captures revenue that voicemail loses.": "Okjobs intervient sur le besoin, la présélection, l’évaluation et la shortlist selon le périmètre convenu.",
  "One phone layer for multiple business workflows": "Une même grille pour plusieurs étapes du recrutement",
  "Okjobs can answer calls, step in when your team is unavailable, book appointments, collect caller details, route requests, and send summaries based on the rules you set.": "Le besoin, les candidatures, les résultats et les décisions restent reliés aux mêmes critères métier, avec une traçabilité claire.",
  "See the full feature list": "Voir le parcours candidat",
  "For service teams": "Pour l’équipe RH",
  "Capture job details, service area, urgency, and scheduling needs, then notify the right person with a clear summary.": "Disposez d’éléments comparables et préparez les échanges avec les responsables opérationnels.",
  "For appointment businesses": "Pour les responsables métier",
  "Let callers book, receive confirmation texts, reschedule when your rules allow it, or leave a message for your team.": "Retrouvez les critères du poste et les points qui demandent encore une validation humaine.",
  "Start with your busiest call path": "Commencez par un besoin de recrutement précis",
  "Try Okjobs on the calls your team misses most often, then expand to after-hours coverage, scheduling, and transfers as your workflow matures.": "Okjobs privilégie des pilotes ciblés afin de valider l’utilité des rapports avant d’élargir progressivement le service.",
  "View features": "Voir les candidats",
  "See pricing": "Voir les offres",
  "View solution": "Découvrir",
  "Read comparison": "En savoir plus",
}));

const pricing = new Map(Object.entries({
  "Plans for businesses of every size": "Des offres claires selon votre usage d’Okjobs",
  "Start free, then upgrade to Starter or Pro for more included minutes and transparent overages.": "Le profil candidat est gratuit. Les prestations d’évaluation et de recrutement sont établies sur devis après cadrage du besoin.",
  "Monthly": "Candidats",
  "Annual": "Entreprises",
  "Save 20%": "Sur devis",
  "Free": "Candidat",
  "Test voice in your browser": "Créer et développer son profil",
  "30 browser voice minutes included": "Profil professionnel structuré",
  "No telephone number": "Compétences déclarées et vérifiées séparées",
  "Community support": "Résultats et pistes de développement",
  "Starter": "Assessment",
  "Per month, billed annually": "Offre établie selon le besoin",
  "150 voice minutes included": "Évaluations adaptées au poste",
  "Then $0.20/min": "Volume défini au devis",
  "1 dedicated business number": "Rapports contextualisés",
  "50 alert SMS segments": "Comparaison par critères",
  "Email support": "Accompagnement de l’équipe",
  "Pro": "Recruitment",
  "500 voice minutes included": "Cadrage et présélection",
  "Then $0.18/min": "Périmètre défini au devis",
  "200 alert SMS segments": "Évaluations et entretiens",
  "Priority email support": "Shortlist documentée",
  "Enterprise": "Sur mesure",
  "For higher volume": "Pour un besoin spécifique",
  "Multiple dedicated numbers": "Volume de candidatures adapté",
  "Custom usage limits": "Batterie d’évaluation personnalisée",
  "Dedicated implementation support": "Accompagnement défini ensemble",
  "Compare plans in detail": "Comparer les niveaux de service",
  "Free includes 30 browser voice minutes with no telephone number. Starter and Pro include a dedicated number, monthly usage allowances, and usage-based overages.": "Le devis dépend du nombre de candidats, des évaluations nécessaires et du niveau d’accompagnement demandé.",
  "Pricing questions": "Questions sur les offres",
  "How does Okjobs paid pricing work?": "Comment le devis entreprise est-il établi ?",
  "Starter is $30/month or $288/year and includes 150 voice minutes each month. Pro is $100/month or $960/year and includes 500 voice minutes each month. Starter voice overage is $0.20/minute, Pro voice overage is $0.18/minute, and extra alert SMS segments and transfer attempts cost $0.02 each.": "Le volume de candidatures, les critères du poste, la batterie d’évaluation et le niveau d’accompagnement déterminent le devis.",
  "Do spam calls or very short calls count toward usage?": "Pourquoi les prix entreprises ne sont-ils pas encore publiés ?",
  "No. Okjobs excludes spam calls and calls under 10 seconds from usage, so wrong numbers, robocalls, instant hang-ups, and pocket dials do not count against your included voice minutes or paid-plan overages.": "Les premiers pilotes servent à valider le niveau de service, les coûts réels et l’utilité des livrables avant de fixer des tarifs publics.",
  "Can I switch plans or cancel anytime?": "Quelle différence entre Assessment et Recruitment ?",
  "Yes. You can upgrade, downgrade, or cancel your plan from billing settings. When you downgrade, you keep your current plan until the end of the billing period. There are no cancellation fees.": "Assessment fournit les évaluations et les rapports à votre équipe. Recruitment ajoute un accompagnement sur plusieurs étapes du processus.",
  "Can I use Okjobs for free?": "Le compte candidat est-il gratuit ?",
  "Yes. You can test 30 browser voice minutes on Free without a credit card. Free has no telephone number. Choose Starter or Pro for a dedicated number.": "Oui. Le candidat peut créer son compte et commencer à structurer son profil gratuitement.",
  "What AI receptionist features are available today?": "Quelles fonctionnalités sont disponibles aujourd’hui ?",
  "Okjobs can answer calls, capture caller details, answer business questions from your knowledge base, qualify leads, book appointments, route urgent callers, send summaries by email, and support recordings, transcripts, Google Calendar, and conversations in the caller's language.": "Le profil candidat et les parcours d’évaluation ou de recrutement constituent le cœur actuel. La formation, le matching automatique et le marché d’opportunités sont prévus ultérieurement.",
  "Feature": "Fonction",
  "Usage & limits": "Usage et périmètre",
  "Voice minutes": "Évaluations",
  "30 browser minutes": "Profil candidat",
  "150 included then $0.20/min": "Selon le devis",
  "500 included then $0.18/min": "Selon le devis",
  "Custom": "Sur mesure",
  "Phone numbers": "Espaces utilisateurs",
  "Not included": "Non inclus",
  "Included": "Inclus",
  "Unlimited": "Selon le besoin",
  "Core receptionist": "Profil et évaluation",
  "24/7 call answering": "Accès au profil",
  "Browser testing": "Parcours candidat",
  "Caller details and message capture": "Parcours et compétences",
  "Knowledge base answers": "Référentiel métier",
  "Spam filtering": "Critères explicites",
  "Calls under 10s excluded from billing": "Limites documentées",
  "Unlimited concurrent calls": "Évaluations en groupe",
  "Answers in the caller's language": "Contenus en français",
  "Booking": "Parcours",
  "Appointment booking": "Évaluations liées au poste",
  "Appointment confirmation texts": "Suivi du parcours",
  "Google Calendar integration": "Historique des étapes",
  "Routing & transfers": "Décision et validation",
  "Urgent call handoff": "Points de vigilance",
  "Call transfers": "Validation humaine",
  "Notifications & messaging": "Suivi et informations",
  "Email notifications": "Notifications utiles",
  "SMS notifications": "Notifications complémentaires",
  "Alert SMS segments": "Notifications complémentaires",
  "50 included then $0.02/segment": "Selon le devis",
  "200 included then $0.02/segment": "Selon le devis",
  "Transfer attempts": "Validations humaines",
  "20 included then $0.02/attempt": "Selon le devis",
  "100 included then $0.02/attempt": "Selon le devis",
  "Data & dashboard": "Données et espace personnel",
  "Call summaries and transcripts": "Synthèses et résultats",
  "Call history and recordings": "Historique du profil",
  "Caller profiles and notes": "Profils et notes",
  "$0": "Gratuit",
  "$24": "Sur devis",
  "$30": "Sur devis",
  "$80": "Sur devis",
  "$100": "Sur devis",
  "/mo": "",
}));

const about = new Map(Object.entries({
  "About Okjobs": "Pourquoi Okjobs existe",
  "Okjobs exists to help small businesses answer calls and book appointments without giving up control of their phone workflow or customer data.": "Okjobs construit un langage commun entre les talents, les compétences et les besoins des entreprises dans le contexte congolais.",
  "No credit card required. Works with your existing business number.": "La création du compte candidat est gratuite.",
  "Open-source AI receptionist for small businesses": "Un profil professionnel structuré comme actif central",
  "Built around call answering, booking, transfers, and call summaries": "Une évaluation qui décrit sans juger ni prédire",
  "Designed for managed cloud use and self-hosted implementation support": "Une méthode transparente, traçable et progressivement validée",
  "Why Okjobs exists": "Notre vision",
  "Most small businesses do not lose customers because they do not care. They lose them because the phone rings while the team is already helping someone else.": "De nombreux parcours restent difficiles à lire avec un CV seul. Okjobs aide à structurer les expériences, les compétences et les éléments observés.",
  "Make every important call visible": "Rendre les compétences plus lisibles",
  "Turn routine questions into handled workflows": "Relier les profils aux critères métier",
  "Keep humans in control for sensitive or high-value calls": "Conserver une décision pleinement humaine",
  "Why we built it open source": "Pourquoi la transparence est essentielle",
  "Phone workflows sit on top of customer data, booking rules, and escalation policies. Teams should be able to inspect how those decisions are made instead of trusting a black box.": "Une évaluation influence des personnes et des décisions. Sa méthode, ses sources, son niveau de confiance et ses limites doivent donc rester compréhensibles.",
  "Review the MIT-licensed codebase, deployment model, and data boundaries on GitHub": "Distinguer les compétences déclarées des compétences vérifiées",
  "Start on Okjobs Cloud and move to self-hosting when your team needs more control": "Identifier clairement les normes provisoires et leurs versions",
  "Avoid vendor lock-in for the receptionist layer that sits in front of every caller": "Documenter ce que chaque évaluation mesure et ne mesure pas",
  "Who Okjobs is for": "À qui s’adresse Okjobs",
  "Okjobs is built for owner-operators and small teams that live on inbound calls: home services, trades, clinics, salons, and local service businesses that cannot afford to miss ready-to-book callers.": "Okjobs s’adresse aux candidats qui veulent mieux présenter leur potentiel et aux PME, ONG ou institutions qui souhaitent recruter avec des critères plus clairs.",
  "Teams that miss calls while they are on jobs, in appointments, or closed for the day": "Candidats souhaitant structurer et développer leur profil",
  "Operators who want phone booking without a phone tree or IVR builder": "Équipes qui veulent comparer des candidatures sur une même grille",
  "Businesses that need after-hours coverage without hiring another full-time receptionist": "Organisations qui recherchent un accompagnement de recrutement",
  "How support and security work": "Comment la méthode évolue",
  "Okjobs Cloud handles hosting, monitoring, and product updates. Self-hosted customers run the same open-source stack on infrastructure they control. In both cases, you define what the receptionist can say, book, and escalate.": "Okjobs commence par des métiers pilotes, observe l’utilité réelle des rapports puis améliore progressivement les critères, les seuils et les normes.",
  "Configure allowed answers, booking rules, and transfer paths in plain language": "Tester les profils et rapports dans de vraies décisions",
  "Review call summaries, transcripts, and outcomes in one operator dashboard": "Mesurer les écarts entre résultats et performance observée",
  "Use public documentation or contact support@lobbystack.com when you need implementation help": "Recalibrer la méthode à partir de données de suivi fiables",
  "Start answering every call without front-desk overload": "Commencez par construire un profil professionnel utile",
  "Try Okjobs with included voice minutes, configure your custom trade and call rules, and see how much revenue you can recover.": "Structurez votre parcours ou présentez-nous un besoin de recrutement précis pour démarrer.",
  "Related resources": "À découvrir",
  "Public documentation": "Notre méthode",
  "GitHub": "Ressources",
}));

const blog = new Map(Object.entries({
  "AI receptionist blog and product updates": "Ressources pour mieux comprendre les compétences",
  "Product updates and practical notes on AI phone answering, missed calls, appointment scheduling, call routing, lead follow-up, and open-source receptionist infrastructure.": "Des guides pratiques pour structurer un profil professionnel, préparer une évaluation et recruter avec des critères métier clairs.",
  "Topics we cover": "Sujets que nous préparons",
  "Open-source phone answering": "Construire un profil professionnel",
  "Compare self-hosted stacks, Asterisk agents, LiveKit voice kits, and full receptionist platforms.": "Présenter son parcours, distinguer les compétences et documenter les éléments qui peuvent être vérifiés.",
  "Choosing an AI receptionist": "Préparer une évaluation",
  "How to evaluate vendors, pricing models, and setup requirements before you turn on live call handling.": "Comprendre les formats de test, les conditions de passation et la manière dont les résultats sont interprétés.",
  "AI receptionist comparisons": "Lire un rapport avec prudence",
  "Fair comparisons of Upfirst, Frontdesk, Smith.ai, Goodcall, and other phone-answering products.": "Identifier les dimensions observées, le niveau de confiance, les limites et les points à vérifier.",
  "Build vs buy": "Définir les critères d’un poste",
  "When it makes sense to self-host, buy hosted software, or build from scratch.": "Transformer une fiche de poste en compétences attendues et critères observables.",
  "Missed-call economics": "Comparer sans réduire à une note",
  "How much revenue walks away when calls go unanswered, and what recovery looks like in practice.": "Utiliser une grille commune tout en conservant le contexte et les limites de chaque résultat.",
  "Open-source stack": "Comprendre la méthode Okjobs",
  "How Okjobs packages calls, booking, transcripts, dashboards, billing, and self-hosting in one receptionist stack.": "Découvrir comment les sources, les versions et les normes provisoires sont rendues traçables.",
  "Workflows without flowcharts": "Transformer un écart en progression",
  "Why n8n and Zapier chains break on live calls, and what a receptionist product layer should own instead.": "Relier une lacune observée à une compétence à développer puis à réévaluer.",
  "Affiliate program": "Préparer une shortlist documentée",
  "Earn recurring commission by recommending an open-source AI receptionist to agencies, consultants, and local operators.": "Présenter les correspondances, les écarts et les questions à approfondir pendant l’entretien.",
  "Solution guides": "Découvrir les parcours Okjobs",
  "Trade-specific pages for plumbers, HVAC teams, dental offices, salons, and other call-heavy businesses.": "Accéder au parcours candidat, à l’évaluation entreprise et à l’accompagnement au recrutement.",
  "How much can an AI receptionist save you?": "Pourquoi un profil structuré va plus loin qu’un CV",
  "Estimate AI receptionist savings from lower answering costs and fewer missed calls. Use the missed call calculator to run the numbers.": "Découvrez comment relier le parcours, les compétences et les résultats observés dans une lecture professionnelle claire.",
  "Our AI Voice Agent Now Runs on GPT-Live, the Model Behind ChatGPT Voice": "Comprendre les différents types d’évaluation",
  "ElevenLabs Reception alternative: minutes and ownership": "Distinguer compétence déclarée et compétence vérifiée",
  "Okjobs Is Now MIT: Build and Sell Your Own": "Comment Okjobs structure un profil professionnel",
  "Why Okjobs Is Moving Away From Convex": "Pourquoi la traçabilité des résultats est essentielle",
  "Upfirst alternative: Okjobs vs Upfirst": "Préparer une évaluation liée au métier",
  "My AI Front Desk alternative": "Lire un rapport sans surinterpréter un score",
  "Smith.ai alternative: AI and human coverage": "Conserver une décision humaine dans le recrutement",
  "Goodcall alternative: Compare the billing models": "Comparer des candidatures avec une même grille",
  "Rosie AI alternative: Plans and tradeoffs": "Identifier les points à vérifier en entretien",
  "Zoom AI Receptionist alternative": "Transformer une lacune en piste de développement",
  "Dialzara alternative: Plans, add-ons, and control": "Définir des critères métier observables",
  "RingCentral AI Receptionist alternative": "Construire une shortlist documentée",
  "Nextiva XBert alternative": "Expliquer le niveau de confiance d’un résultat",
  "Quo Sona alternative for AI call answering": "Présenter les limites d’une évaluation",
  "CloudTalk AI Receptionist alternative": "Adapter une batterie d’évaluation au poste",
  "Moneypenny AI Receptionist alternative": "Préparer les questions d’un entretien structuré",
  "AI vs virtual receptionist: A practical guide": "Évaluation et jugement humain : trouver le bon équilibre",
  "AI receptionist vs voicemail": "Pourquoi une note unique ne suffit pas",
  "Best open-source AI phone answering services": "Les éléments essentiels d’un profil professionnel",
  "Earn 20% with the Okjobs affiliate program": "Accompagner les candidats dans leur progression",
  "Open-source AI receptionist stack": "Les principes de transparence de la méthode Okjobs",
  "AI receptionist workflows without flowcharts": "Un parcours candidat expliqué étape par étape",
  "Should you build or buy an AI receptionist?": "Choisir entre Assessment et Recruitment",
  "How to choose an AI receptionist": "Choisir une méthode d’évaluation responsable",
  "Okjobs is live": "Okjobs : un profil professionnel pour mieux décider",
}));

const pageMaps = { "/": home, "/features/": features, "/solutions/": solutions, "/pricing/": pricing, "/about/": about, "/blog/": blog };
const pageMeta = {
  "/": ["Okjobs | Recrutez avec confiance", "Dirigeants de PME, ONG et institutions : comparez les compétences utiles au poste, levez vos doutes et préparez une sélection expliquée avec Okjobs."],
  "/features/": ["Candidats | Okjobs", "Premier emploi, expérience de terrain ou évolution : faites ressortir vos acquis et identifiez votre prochaine étape avec Okjobs."],
  "/solutions/": ["Entreprises | Okjobs", "Levez vos doutes sur les candidats, préparez des entretiens utiles et avancez vers une sélection que votre équipe peut expliquer."],
  "/pricing/": ["Tarifs | Okjobs", "Accès candidat gratuit et offres d’évaluation ou de recrutement sur devis."],
  "/about/": ["Vision et méthode | Okjobs", "Découvrez la vision, la transparence et la validation progressive de la méthode Okjobs."],
  "/blog/": ["Ressources | Okjobs", "Guides pour comprendre les compétences, les évaluations et le recrutement structuré."],
};

export const sectorRouteAliases = {
  "/solutions/ai-receptionist-for-appliance-repair/": "/solutions/evaluation-techniciens-reparation/",
  "/solutions/ai-receptionist-for-dental-offices/": "/solutions/evaluation-professionnels-sante/",
  "/solutions/ai-receptionist-for-electricians/": "/solutions/evaluation-electriciens/",
  "/solutions/ai-receptionist-for-garage-door-repair/": "/solutions/evaluation-techniciens-maintenance/",
  "/solutions/ai-receptionist-for-home-services/": "/solutions/evaluation-metiers-services/",
  "/solutions/ai-receptionist-for-hvac/": "/solutions/evaluation-techniciens-cvc/",
  "/solutions/ai-receptionist-for-locksmiths/": "/solutions/evaluation-metiers-securite/",
  "/solutions/ai-receptionist-for-plumbers/": "/solutions/evaluation-plombiers/",
  "/solutions/ai-receptionist-for-restoration-companies/": "/solutions/evaluation-intervention-apres-sinistre/",
  "/solutions/ai-receptionist-for-salons-and-spas/": "/solutions/evaluation-relation-client/",
  "/solutions/property-management-answering-service/": "/solutions/evaluation-gestion-immobiliere/",
  "/solutions/roofing-answering-service/": "/solutions/evaluation-metiers-btp/",
  "/solutions/after-hours-answering-service-for-contractors/": "/solutions/evaluation-equipes-terrain/",
};

export function rewriteVoiceDemoCopy(source) {
  let result = source;
  for (const [original, replacement] of [...common, ...home]) {
    // Only replace literal display strings; preserve compiled identifiers and URLs.
    result = result.replaceAll(JSON.stringify(original), JSON.stringify(replacement));
    result = result.replaceAll('`' + original + '`', '`' + replacement + '`');
  }
  return result;
}

const sectorPages = {
  "/solutions/ai-receptionist-for-appliance-repair/": {
    title: "Évaluer les techniciens de réparation avec des critères concrets",
    audience: "techniciens de réparation et de maintenance",
    context: "diagnostic, méthode de travail, sécurité et qualité d’intervention",
    criteria: ["Diagnostic méthodique", "Maîtrise technique", "Sécurité", "Relation client"],
  },
  "/solutions/ai-receptionist-for-dental-offices/": {
    title: "Évaluer les professionnels de santé avec méthode et prudence",
    audience: "professionnels de santé et équipes de cabinet",
    context: "rigueur, communication, respect des procédures et organisation",
    criteria: ["Rigueur professionnelle", "Écoute", "Respect des procédures", "Organisation"],
  },
  "/solutions/ai-receptionist-for-electricians/": {
    title: "Évaluer les électriciens au-delà du CV",
    audience: "électriciens et techniciens en installation électrique",
    context: "lecture de consignes, raisonnement technique, sécurité et fiabilité",
    criteria: ["Sécurité électrique", "Raisonnement technique", "Précision", "Autonomie"],
  },
  "/solutions/ai-receptionist-for-garage-door-repair/": {
    title: "Évaluer les techniciens de maintenance et d’installation",
    audience: "techniciens de maintenance, de dépannage et d’installation",
    context: "diagnostic, gestes professionnels, sécurité et communication terrain",
    criteria: ["Diagnostic", "Habileté technique", "Sécurité", "Communication terrain"],
  },
  "/solutions/ai-receptionist-for-home-services/": {
    title: "Mieux évaluer les métiers des services de proximité",
    audience: "professionnels des services à domicile et de proximité",
    context: "fiabilité, sens du service, autonomie et adaptation aux situations",
    criteria: ["Sens du service", "Fiabilité", "Autonomie", "Adaptabilité"],
  },
  "/solutions/ai-receptionist-for-hvac/": {
    title: "Évaluer les techniciens CVC sur les compétences du terrain",
    audience: "techniciens en climatisation, ventilation et froid",
    context: "diagnostic, raisonnement technique, sécurité et gestion des priorités",
    criteria: ["Diagnostic CVC", "Raisonnement technique", "Sécurité", "Priorisation"],
  },
  "/solutions/ai-receptionist-for-locksmiths/": {
    title: "Évaluer les métiers de la sécurité et de l’intervention",
    audience: "professionnels de la serrurerie et de l’intervention sécurisée",
    context: "précision, intégrité, diagnostic et respect des procédures",
    criteria: ["Intégrité", "Diagnostic", "Précision", "Respect des procédures"],
  },
  "/solutions/ai-receptionist-for-plumbers/": {
    title: "Évaluer les plombiers avec une grille adaptée au métier",
    audience: "plombiers, installateurs et techniciens sanitaires",
    context: "diagnostic, lecture de plans, sécurité et qualité d’exécution",
    criteria: ["Diagnostic", "Lecture technique", "Sécurité", "Qualité d’exécution"],
  },
  "/solutions/ai-receptionist-for-restoration-companies/": {
    title: "Évaluer les équipes d’intervention après sinistre",
    audience: "professionnels de l’assainissement et de l’intervention après sinistre",
    context: "réactivité, sécurité, organisation et qualité de compte rendu",
    criteria: ["Réactivité", "Sécurité", "Organisation", "Compte rendu"],
  },
  "/solutions/ai-receptionist-for-salons-and-spas/": {
    title: "Évaluer les compétences de service et de relation client",
    audience: "professionnels de l’accueil, du bien-être et de la relation client",
    context: "écoute, qualité de service, organisation et fidélisation",
    criteria: ["Écoute client", "Qualité de service", "Organisation", "Communication"],
  },
  "/solutions/property-management-answering-service/": {
    title: "Évaluer les profils de la gestion immobilière",
    audience: "gestionnaires immobiliers et équipes de proximité",
    context: "organisation, communication, suivi des demandes et gestion des priorités",
    criteria: ["Organisation", "Communication", "Suivi", "Gestion des priorités"],
  },
  "/solutions/roofing-answering-service/": {
    title: "Évaluer les professionnels du bâtiment et de la couverture",
    audience: "professionnels de la couverture et des métiers du bâtiment",
    context: "sécurité, précision, endurance et travail en équipe",
    criteria: ["Sécurité chantier", "Précision", "Endurance", "Travail en équipe"],
  },
  "/solutions/after-hours-answering-service-for-contractors/": {
    title: "Évaluer les équipes terrain dans leur contexte réel",
    audience: "équipes terrain, chefs d’équipe et intervenants techniques",
    context: "autonomie, fiabilité, coordination et réaction aux imprévus",
    criteria: ["Autonomie", "Fiabilité", "Coordination", "Gestion des imprévus"],
  },
};

// Public service pages keep their original layout and use the same editorial slots.
Object.assign(sectorPages, {
  "/affiliate-program/": {
    title: "Entreprise : trouvez l’accompagnement qui fera avancer votre recrutement",
    audience: "candidats à votre recrutement", context: "besoin clarifié, comparaison des compétences et sélection expliquée",
    criteria: ["Attentes du poste", "Compétences observées", "Écarts à approfondir", "Arguments de sélection"],
  },
  "/solutions/ai-phone-answering/": {
    title: "Assessment : comparez vos candidats avant de choisir",
    audience: "candidats à votre poste", context: "compétences utiles, raisonnement, attentes du poste et points à confirmer",
    criteria: ["Compétences du poste", "Raisonnement", "Méthode de travail", "Points à confirmer"],
  },
  "/solutions/ai-appointment-scheduler/": {
    title: "Évaluation individuelle : levez vos doutes sur un profil",
    audience: "candidats que vous souhaitez approfondir", context: "compétences attendues, éléments observés et préparation de l’entretien",
    criteria: ["Acquis utiles", "Réponse aux situations", "Éléments documentés", "Besoins d’accompagnement"],
  },
  "/solutions/after-hours-answering-service/": {
    title: "Évaluation en groupe : comparez sans perdre vos repères",
    audience: "candidats de votre campagne de recrutement", context: "critères communs, comparaison des résultats et justification de la présélection",
    criteria: ["Critères du poste", "Éléments comparables", "Écarts à approfondir", "Points de vérification"],
  },
  "/solutions/self-hosted-ai-receptionist/": {
    title: "Un besoin particulier ? Construisons votre accompagnement",
    audience: "candidats de votre organisation", context: "responsabilités du poste, contraintes de passation et décisions à préparer",
    criteria: ["Attentes prioritaires", "Compétences utiles", "Conditions de passation", "Vérifications nécessaires"],
  },
  "/solutions/open-source-ai-receptionist/": {
    title: "Recruitment : avancez vers une shortlist expliquée",
    audience: "candidats à votre recrutement", context: "besoin clarifié, présélection, évaluation et préparation de la shortlist",
    criteria: ["Attentes du poste", "Acquis des candidats", "Écarts à approfondir", "Arguments de sélection"],
  },
});

const organisationPages = {
  "/solutions/ai-receptionist-for-plumbers/": {
    title: "PME : recrutez avec des critères clairs et un accompagnement adapté",
    audience: "candidats de votre PME",
    context: "polyvalence, autonomie, compétences liées au poste et collaboration dans une petite équipe",
    criteria: ["Compétences du poste", "Polyvalence", "Autonomie", "Collaboration"],
  },
  "/solutions/ai-receptionist-for-hvac/": {
    title: "ONG : évaluez les candidatures selon vos missions et votre contexte",
    audience: "candidats aux postes de votre ONG",
    context: "compréhension de la mission, rigueur, adaptation au terrain et coordination des équipes",
    criteria: ["Compétences de la mission", "Rigueur", "Adaptation au contexte", "Coordination"],
  },
  "/solutions/ai-receptionist-for-electricians/": {
    title: "Institutions : documentez vos recrutements avec une grille commune",
    audience: "candidats aux postes de votre institution",
    context: "maîtrise des responsabilités, respect des procédures, qualité de service et traçabilité des décisions",
    criteria: ["Compétences du poste", "Respect des procédures", "Qualité de service", "Rigueur"],
  },
  "/solutions/ai-receptionist-for-garage-door-repair/": {
    title: "Métiers opérationnels : observez les compétences utiles au travail réel",
    audience: "candidats aux métiers opérationnels",
    context: "exécution des tâches, respect des consignes, résolution de problèmes et travail en équipe",
    criteria: ["Exécution des tâches", "Respect des consignes", "Résolution de problèmes", "Travail en équipe"],
  },
  "/solutions/ai-receptionist-for-appliance-repair/": {
    title: "Fonctions support : évaluez les compétences qui font fonctionner votre organisation",
    audience: "candidats aux fonctions support",
    context: "organisation, outils bureautiques, communication écrite et fiabilité du suivi administratif",
    criteria: ["Organisation", "Maîtrise des outils", "Communication écrite", "Fiabilité du suivi"],
  },
  "/solutions/ai-receptionist-for-restoration-companies/": {
    title: "Profils juniors : donnez une place aux compétences au-delà de l’expérience",
    audience: "candidats juniors et jeunes diplômés",
    context: "raisonnement, compétences de base, apprentissage et capacité à expliquer une démarche",
    criteria: ["Raisonnement", "Compétences de base", "Apprentissage", "Communication"],
  },
  "/solutions/ai-receptionist-for-locksmiths/": {
    title: "Profils expérimentés : reliez le parcours aux exigences du poste",
    audience: "candidats expérimentés",
    context: "réalisations documentées, expertise métier, autonomie et responsabilités exercées",
    criteria: ["Expertise métier", "Réalisations documentées", "Autonomie", "Responsabilités exercées"],
  },
  "/solutions/roofing-answering-service/": {
    title: "Recrutement individuel : préparez une décision sur un poste précis",
    audience: "candidats à votre recrutement individuel",
    context: "critères prioritaires du poste, éléments de preuve, points à vérifier et conditions de prise de fonction",
    criteria: ["Critères prioritaires", "Compétences attendues", "Éléments documentés", "Points à vérifier"],
  },
  "/solutions/property-management-answering-service/": {
    title: "Campagnes de recrutement : comparez les candidatures sur une même grille",
    audience: "candidats de votre campagne de recrutement",
    context: "critères partagés, cohérence des évaluations, suivi des candidatures et préparation des shortlists",
    criteria: ["Critères partagés", "Cohérence des évaluations", "Suivi des candidatures", "Shortlist documentée"],
  },
};
Object.assign(sectorPages, organisationPages);
for (const [source, destination] of Object.entries(sectorRouteAliases)) {
  sectorPages[destination] = sectorPages[source];
}

function routeFor(file, root) {
  let route = "/" + path.relative(root, file).replace(/\\/g, "/").replace(/index\.html$/, "");
  route = route.replace(/^\/(?:fr|es|sr)(?=\/|$)/, "") || "/";
  return route;
}

function getAttr(node, name) { return node.attrs?.find((attr) => attr.name === name); }

function textContent(node) {
  if (node.nodeName === "#text") return node.value;
  if (node.tagName === "script" || node.tagName === "style") return "";
  return (node.childNodes ?? []).map(textContent).join("");
}

function replaceElementText(node, replacements) {
  if (!["h1", "h2", "h3", "p", "summary", "button", "li"].includes(node.tagName)) return;
  const compact = textContent(node).replace(/\s+/g, " ").trim();
  const next = replacements.get(compact);
  if (!next) return;
  const textNodes = [];
  function collect(child) {
    if (child.nodeName === "#text" && child.value.trim()) textNodes.push(child);
    else if (child.tagName !== "script" && child.tagName !== "style") {
      for (const nested of child.childNodes ?? []) collect(nested);
    }
  }
  collect(node);
  if (!textNodes.length) return;
  const words = next.split(/\s+/);
  if (words.length < textNodes.length) {
    textNodes.forEach((item, index) => {
      const leading = item.value.match(/^\s*/)?.[0] ?? "";
      const trailing = item.value.match(/\s*$/)?.[0] ?? "";
      item.value = index === 0 ? `${leading}${next}${trailing}` : `${leading}${trailing}`;
    });
    return;
  }
  const weights = textNodes.map((item) => Math.max(1, item.value.trim().length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = 0;
  textNodes.forEach((item, index) => {
    const remainingNodes = textNodes.length - index - 1;
    const remainingWords = words.length - cursor;
    const take = index === textNodes.length - 1
      ? remainingWords
      : Math.max(1, Math.min(remainingWords - remainingNodes, Math.round(words.length * weights[index] / totalWeight)));
    const leading = item.value.match(/^\s*/)?.[0] ?? "";
    const trailing = item.value.match(/\s*$/)?.[0] ?? "";
    item.value = `${leading}${words.slice(cursor, cursor + take).join(" ")}${trailing}`;
    cursor += take;
  });
}

function replaceNodeText(node, replacements) {
  if (node.nodeName !== "#text") return;
  const compact = node.value.replace(/\s+/g, " ").trim();
  const next = replacements.get(compact);
  if (!next) return;
  const leading = node.value.match(/^\s*/)?.[0] ?? "";
  const trailing = node.value.match(/\s*$/)?.[0] ?? "";
  node.value = `${leading}${next}${trailing}`;
}

function replaceStructuredValue(value, replacements) {
  if (typeof value === "string") return replacements.get(value) ?? value;
  if (Array.isArray(value)) return value.map((item) => replaceStructuredValue(item, replacements));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceStructuredValue(item, replacements)]));
  }
  return value;
}

function setElementText(node, next) {
  const textNodes = [];
  function collect(child) {
    if (child.nodeName === "#text" && child.value.trim()) textNodes.push(child);
    else if (child.tagName !== "script" && child.tagName !== "style") {
      for (const nested of child.childNodes ?? []) collect(nested);
    }
  }
  collect(node);
  if (!textNodes.length) return;
  const words = next.split(/\s+/);
  const weights = textNodes.map((item) => Math.max(1, item.value.trim().length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = 0;
  textNodes.forEach((item, index) => {
    const remainingNodes = textNodes.length - index - 1;
    const remainingWords = words.length - cursor;
    const take = index === textNodes.length - 1
      ? remainingWords
      : Math.max(1, Math.min(remainingWords - remainingNodes, Math.round(words.length * weights[index] / totalWeight)));
    const leading = item.value.match(/^\s*/)?.[0] ?? "";
    const trailing = item.value.match(/\s*$/)?.[0] ?? "";
    item.value = `${leading}${words.slice(cursor, cursor + take).join(" ")}${trailing}`;
    cursor += take;
  });
}

function applySectorCopy(document, data) {
  const outcomes = {
    "candidats de votre PME": ["PME : choisissez avec confiance, même sans équipe RH", "Vous devez recruter sans y consacrer toutes vos journées ? Clarifiez le poste, comparez les compétences utiles et avancez vers une shortlist dont vous comprenez les raisons."],
    "candidats aux postes de votre ONG": ["ONG : une sélection adaptée au terrain et facile à expliquer", "Préparez votre campagne avec des critères liés à la mission. Votre équipe retrouve les éléments de sélection et les points à vérifier, sans confondre aisance à l’écrit et compétence terrain."],
    "candidats aux postes de votre institution": ["Institutions : justifiez vos choix avec des critères communs", "Vous devez rendre votre sélection compréhensible ? Comparez les candidatures sur des attentes définies et retrouvez les éléments derrière chaque recommandation."],
    "candidats aux métiers opérationnels": ["Métiers opérationnels : voyez ce que le candidat sait faire", "Un CV ne suffit pas à montrer comment une personne résout un problème. Approfondissez les compétences utiles au poste et repérez les pratiques qui nécessitent une vérification sur le terrain."],
    "candidats aux fonctions support": ["Fonctions support : trouvez les compétences qui soutiendront votre équipe", "Organisation, outils, communication et suivi : distinguez les acquis annoncés des éléments observés pour préparer un choix utile à votre activité."],
    "candidats juniors et jeunes diplômés": ["Profils juniors : repérez les acquis derrière un premier CV", "Un parcours court ne signifie pas une absence de compétences. Donnez une place aux acquis des stages, des projets et des formations, puis identifiez les besoins d’accompagnement pour le poste."],
    "candidats expérimentés": ["Profils expérimentés : distinguez les années de pratique des acquis démontrés", "Deux candidats peuvent avoir la même ancienneté sans avoir exercé les mêmes responsabilités. Approfondissez leur expérience et les compétences utiles à votre poste avant de choisir."],
    "candidats à votre recrutement individuel": ["Un poste à pourvoir : levez vos doutes avant de choisir", "Votre décision compte pour toute l’équipe. Clarifiez vos attentes, évaluez les compétences utiles et préparez les questions qui vous aideront à départager les profils."],
    "candidats de votre campagne de recrutement": ["Campagnes de recrutement : gardez une sélection lisible à chaque étape", "Quand les candidatures se multiplient, gardez les mêmes repères. Comparez les résultats, identifiez les dossiers à approfondir et expliquez votre présélection à votre équipe."],
  };
  const selectedOutcome = outcomes[data.audience];
  const headings = [
    "Repérez les compétences utiles à votre équipe",
    "Comparez vos candidats sans vous fier à une note unique",
    "Mettez votre équipe d’accord avant de choisir",
    "Levez vos doutes avec une évaluation ciblée",
    "Sachez quoi approfondir en entretien",
    "Ce que l’évaluation mesure — et ce qu’elle ne mesure pas",
    "Un parcours clair en trois étapes",
    "Assessment ou Recruitment : choisissez votre accompagnement",
    "Questions fréquentes",
    "Avancez vers une sélection que vous pouvez expliquer",
  ];
  const subheadings = [
    ...data.criteria,
    "Définir le besoin",
    "Observer les compétences",
    "Lire les résultats avec prudence",
    "Préparer les points à vérifier",
    "Conserver une validation humaine",
    "Suivre les résultats dans le temps",
  ];
  const paragraphs = [
    selectedOutcome?.[1] ?? `Vous hésitez entre plusieurs profils ? Comparez les ${data.audience} sur les exigences de votre poste : ${data.context}. Retrouvez les éléments utiles pour décider et les points à confirmer.`,
    "Deux CV proches peuvent cacher des acquis différents. Allez au-delà du discours pour comprendre ce qui a été observé et ce qui reste à vérifier.",
    "Évitez les attentes qui changent en cours de recrutement. Définissez avec votre équipe les compétences nécessaires et le niveau réellement attendu.",
    "Comparez les candidatures avec les mêmes repères. Vous distinguez les compétences annoncées des éléments documentés et des résultats d’évaluation.",
    `Pour ce besoin, l’analyse peut notamment porter sur ${data.criteria.join(", ").toLowerCase()}. La combinaison exacte dépend du poste et du niveau recherché.`,
    "Les évaluations complètent l’entretien ; elles ne le remplacent pas. Elles donnent des repères communs et font émerger les questions qui méritent une vérification humaine.",
    "Retrouvez ce qui répond à vos attentes, les écarts et les informations manquantes. Vous pouvez concentrer votre entretien sur ce qui fera avancer votre décision.",
    "Aucun résultat n’est présenté comme une vérité absolue. La méthode, la version utilisée et les limites d’interprétation restent visibles.",
    "Les compétences auto-déclarées ne sont jamais fusionnées avec les compétences vérifiées. Cette séparation protège la lisibilité du profil candidat.",
    "Lorsque les données sont insuffisantes, Okjobs le signale clairement au lieu de produire une conclusion artificiellement précise.",
    "Vous gardez le dernier mot. Les résultats vous aident à poser les bonnes questions, sans choisir une personne à votre place.",
    "Vous avez une équipe qui mène les entretiens ? Assessment vous apporte les évaluations et les rapports pour comparer les profils et approfondir vos doutes.",
    "Vous manquez de temps ou de ressources RH ? Recruitment vous accompagne sur les étapes convenues, du besoin à la préparation d’une shortlist expliquée.",
    "Le périmètre est défini selon le nombre de candidats, la complexité du poste et le niveau d’accompagnement attendu.",
    "Les premières missions servent aussi à améliorer progressivement les référentiels et à vérifier l’utilité réelle des rapports dans les décisions.",
    "Les normes provisoires sont identifiées comme telles. Elles doivent être recalibrées à partir de données de suivi fiables avant toute promesse prédictive.",
    `Une évaluation adaptée aux ${data.audience} doit rester liée au contexte du poste, aux conditions de travail et aux responsabilités réellement confiées.`,
    "La restitution privilégie des formulations descriptives : ce qui a été observé, ce qui reste incertain et ce qui doit encore être vérifié.",
    "Le candidat peut comprendre son profil, tandis que l’entreprise dispose d’une lecture structurée pour préparer la suite du processus.",
    "Parlez-nous du poste, du volume de candidatures et des décisions que votre équipe doit préparer. Nous vous proposerons un parcours adapté.",
  ];
  const bullets = [
    ...data.criteria.map((criterion) => `${criterion} relié aux exigences du poste`),
    "Critères définis avant l’évaluation",
    "Même grille de lecture pour chaque candidature",
    "Compétences déclarées et vérifiées clairement séparées",
    "Résultats contextualisés et limites visibles",
    "Points de vigilance transformés en questions d’entretien",
    "Décision finale conservée par l’équipe de recrutement",
    "Méthode et version du moteur traçables",
    "Rapport candidat distinct du rapport employeur",
    "Shortlist documentée selon le périmètre choisi",
    "Données insuffisantes signalées explicitement",
    "Pistes de développement proposées sans jugement",
  ];
  const questions = [
    `Quelles compétences évaluer pour les ${data.audience} ?`,
    "Comment la batterie d’évaluation est-elle choisie ?",
    "Les résultats remplacent-ils l’entretien ?",
    "Comment limiter les biais d’interprétation ?",
    "Que reçoit l’entreprise à la fin du parcours ?",
    "Comment le devis est-il établi ?",
  ];
  const table = [
    "Étape", "Ce qu’Okjobs structure", "Ce que votre équipe décide",
    "Besoin", "Critères du poste", "Priorités et contraintes",
    "Candidatures", "Informations comparables", "Profils à approfondir",
    "Évaluations", "Résultats contextualisés", "Points à vérifier",
    "Shortlist", "Synthèse documentée", "Décision finale",
  ];
  const microcopy = [
    "Besoin de recrutement défini", "Critères métier validés", "Candidat", "Parcours et expériences structurés",
    "Okjobs", "Compétences déclarées séparées des éléments vérifiés", "Évaluation", "Mise en situation liée au poste",
    "Résultat", "Points observés et limites explicités", "Entretien", "Questions de vérification préparées",
    "Décision", "Validation humaine conservée", "Rapport", "Synthèse traçable disponible",
  ];
  const ctaFor = (node) => {
    const href = getAttr(node, "href")?.value ?? "";
    if (href.includes("signup")) return "Créer un compte";
    if (href.includes("pricing")) return "Voir les offres";
    if (href.startsWith("mailto:")) return "Nous contacter";
    return "Découvrir l’offre entreprise";
  };
  const counters = { h1: 0, h2: 0, h3: 0, p: 0, li: 0, summary: 0, table: 0, micro: 0 };

  function transform(node) {
    if (node.tagName === "main") {
      for (const child of node.childNodes ?? []) transform(child);
      return;
    }
    if (node.tagName === "h1") { setElementText(node, selectedOutcome?.[0] ?? data.title); counters.h1 += 1; return; }
    if (node.tagName === "h2") { setElementText(node, headings[counters.h2++ % headings.length]); return; }
    if (["h3", "h4", "h5", "h6"].includes(node.tagName)) {
      setElementText(node, subheadings[counters.h3++ % subheadings.length]); return;
    }
    if (node.tagName === "p") { setElementText(node, paragraphs[counters.p++ % paragraphs.length]); return; }
    if (node.tagName === "li") { setElementText(node, bullets[counters.li++ % bullets.length]); return; }
    if (node.tagName === "summary") { setElementText(node, questions[counters.summary++ % questions.length]); return; }
    if (["th", "td", "caption"].includes(node.tagName)) {
      setElementText(node, table[counters.table++ % table.length]); return;
    }
    if (["a", "button"].includes(node.tagName) && textContent(node).replace(/\s+/g, " ").trim()) {
      setElementText(node, ctaFor(node)); return;
    }
    if (node.nodeName === "#text" && node.value.trim() && /[A-Za-zÀ-ÿ]/.test(node.value)) {
      const leading = node.value.match(/^\s*/)?.[0] ?? "";
      const trailing = node.value.match(/\s*$/)?.[0] ?? "";
      node.value = `${leading}${microcopy[counters.micro++ % microcopy.length]}${trailing}`;
      return;
    }
    if (node.tagName === "script" || node.tagName === "style") return;
    for (const child of node.childNodes ?? []) transform(child);
  }

  function findMain(node) {
    if (node.tagName === "main") return node;
    for (const child of node.childNodes ?? []) {
      const match = findMain(child);
      if (match) return match;
    }
    return null;
  }
  const main = findMain(document);
  if (main) {
    transform(main);
    const answers = [
      `Les critères sont définis selon le poste. Pour les ${data.audience}, ils peuvent porter sur ${data.criteria.join(", ").toLowerCase()}. Les diplômes, habilitations et compétences pratiques doivent être vérifiés avec les méthodes adaptées.`,
      "La batterie est choisie après cadrage du besoin, du niveau attendu et des conditions de travail. Chaque outil doit préciser ce qu’il mesure, son statut exploratoire ou validé et ses limites.",
      "Non. Les évaluations complètent le parcours déclaré, les éléments documentés et l’entretien. Elles font ressortir des points à approfondir ; votre équipe conserve la décision finale.",
      "Les critères sont fixés avant la passation et appliqués de façon cohérente. Les sources, les normes provisoires et le niveau de confiance sont explicités pour aider à interpréter les résultats avec prudence.",
      "Selon le périmètre convenu, l’entreprise reçoit des rapports contextualisés, les correspondances avec les critères du poste et les points à vérifier. Recruitment ajoute un accompagnement à la préparation d’une shortlist documentée.",
      "Le devis dépend du poste, du nombre de candidatures, des évaluations nécessaires et de l’accompagnement souhaité. Les prix sont cadrés avec votre équipe avant la mission.",
    ];
    let faqIndex = 0;
    function polish(node) {
      if (node.tagName === "details") {
        const index = faqIndex++ % questions.length;
        function updateDetails(child) {
          if (child.tagName === "summary") { setElementText(child, questions[index]); return; }
          if (child.tagName === "p") { setElementText(child, answers[index]); return; }
          for (const nested of child.childNodes ?? []) updateDetails(nested);
        }
        updateDetails(node);
        return;
      }
      if (node.tagName === "table") {
        let rowIndex = 0;
        const rows = [
          ["Critère", "Éléments à observer", "Vérification humaine"],
          [data.criteria[0], "Réponse à une situation liée au poste", "Exemple concret et échange en entretien"],
          [data.criteria[1], "Méthode et raisonnement explicités", "Mise en pratique adaptée au métier"],
          [data.criteria[2], "Application des consignes professionnelles", "Vérification des pratiques et justificatifs"],
          [data.criteria[3], "Comportements observés dans le contexte évalué", "Retour sur une expérience documentée"],
          ["Niveau de confiance", "Sources et limites du résultat", "Compléter les données manquantes"],
          ["Décision", "Correspondances et points de vigilance", "Choix final de l’équipe de recrutement"],
        ];
        function updateTable(child) {
          if (child.tagName === "tr") {
            const values = rows[Math.min(rowIndex++, rows.length - 1)];
            const cells = (child.childNodes ?? []).filter((item) => item.tagName === "td" || item.tagName === "th");
            cells.forEach((cell, index) => setElementText(cell, values[Math.min(index, values.length - 1)]));
            return;
          }
          for (const nested of child.childNodes ?? []) updateTable(nested);
        }
        updateTable(node);
        return;
      }
      for (const child of node.childNodes ?? []) polish(child);
    }
    polish(main);
  }
}

function rewrite(html, route, outputRoute = route) {
  const document = parse(html);
  const hasEditedMain = Boolean(pageMaps[route]);
  const mainReplacements = new Map([...(hasEditedMain ? common : []), ...(pageMaps[route] ?? new Map())]);
  const sector = sectorPages[route];
  const [title, description] = pageMeta[route] ?? (sector
    ? [`${sector.title} | Okjobs`, `Évaluez les ${sector.audience} selon des critères métier clairs, avec des résultats contextualisés et une décision humaine.`]
    : []);
  if (sector) applySectorCopy(document, sector);
  function walk(node, region = null, blocked = false) {
    const nowRegion = node.tagName === "header" && region !== "main" ? "header"
      : node.tagName === "footer" && region !== "main" ? "footer"
        : node.tagName === "main" ? "main"
          : region;
    const nowBlocked = blocked || node.tagName === "script" || node.tagName === "style";
    if (node.tagName === "html") {
      const lang = getAttr(node, "lang");
      if (lang) lang.value = "fr";
    }
    if (title && node.tagName === "title" && node.childNodes?.[0]) node.childNodes[0].value = title;
    if (description && node.tagName === "meta") {
      const name = getAttr(node, "name")?.value;
      const property = getAttr(node, "property")?.value;
      const content = getAttr(node, "content");
      if (content && (name === "description" || name === "twitter:description" || property === "og:description")) content.value = description;
      if (content && (name === "twitter:title" || property === "og:title")) content.value = title;
      if (content && property === "og:locale") content.value = "fr_FR";
    }
    if (node.tagName === "link" && getAttr(node, "rel")?.value === "canonical") {
      const href = getAttr(node, "href");
      if (href && outputRoute !== route) href.value = outputRoute;
    }
    if ((nowRegion === "header" || nowRegion === "footer") && node.tagName === "a") {
      const href = getAttr(node, "href");
      if (href && sectorRouteAliases[href.value]) href.value = sectorRouteAliases[href.value];
      const destination = getAttr(node, "data-ph-capture-attribute-destination");
      if (destination && sectorRouteAliases[destination.value]) destination.value = sectorRouteAliases[destination.value];
    }
    if (node.tagName === "astro-island") {
      const props = getAttr(node, "props");
      if (props) {
        try {
          const replacements = nowRegion === "main" ? mainReplacements : common;
          props.value = JSON.stringify(replaceStructuredValue(JSON.parse(props.value), replacements));
        } catch {
          // Keep the original island props when Astro uses a non-JSON encoding.
        }
      }
    }
    if (!nowBlocked && (nowRegion === "header" || nowRegion === "footer")) {
      replaceElementText(node, common);
      replaceNodeText(node, common);
    } else if (!nowBlocked && nowRegion === "main" && hasEditedMain) {
      const replacements = mainReplacements;
      replaceElementText(node, replacements);
      replaceNodeText(node, replacements);
    }
    for (const child of node.childNodes ?? []) walk(child, nowRegion, nowBlocked);
    if (nowRegion === "header" && !nowBlocked) {
      const labels = {
        "/solutions/evaluation-plombiers/": "PME",
        "/solutions/evaluation-techniciens-cvc/": "ONG",
        "/solutions/evaluation-electriciens/": "Institutions",
        "/solutions/evaluation-techniciens-maintenance/": "Métiers opérationnels",
        "/solutions/evaluation-techniciens-reparation/": "Fonctions support",
        "/solutions/evaluation-intervention-apres-sinistre/": "Profils juniors",
        "/solutions/evaluation-metiers-securite/": "Profils expérimentés",
        "/solutions/evaluation-metiers-btp/": "Recrutement individuel",
        "/solutions/evaluation-gestion-immobiliere/": "Campagnes de recrutement",
        "/solutions/evaluation-metiers-services/": "Services de proximité",
        "/solutions/evaluation-professionnels-sante/": "Santé",
        "/solutions/evaluation-relation-client/": "Accueil et relation client",
      };
      if (node.tagName === "a") {
        const href = getAttr(node, "href")?.value?.replace(/^\/(fr|es|sr)(?=\/)/, "");
        const normalized = href?.endsWith("/") ? href : `${href}/`;
        if (labels[normalized]) setElementText(node, labels[normalized]);
      }
      if (node.nodeName === "#text" && node.value.trim() === "Par métier") {
        node.value = node.value.replace("Par métier", "Types d’organisation");
      }
      if (node.nodeName === "#text" && node.value.trim() === "Autres secteurs") {
        node.value = node.value.replace("Autres secteurs", "Parcours");
      }
    }
  }
  walk(document);
  rewriteGuide(document, route);
  rewriteGuideLinks(document);
  applyPersonaCopy(document);
  if (route === "/") applyDirectorHomeCopy(document);
  // Keep search/social previews aligned with the visible promise, not the old title.
  const findHeading = (node) => node.tagName === "h1" ? textContent(node).trim()
    : (node.childNodes ?? []).map(findHeading).find(Boolean);
  const heading = findHeading(document);
  if (heading && (hasEditedMain || sector)) {
    function syncMeta(node) {
      if (node.tagName === "title") setElementText(node, `${heading} | Okjobs`);
      if (node.tagName === "meta" && ["og:title", "twitter:title"].includes(getAttr(node, "property")?.value ?? getAttr(node, "name")?.value)) {
        const content = getAttr(node, "content");
        if (content) content.value = `${heading} | Okjobs`;
      }
      for (const child of node.childNodes ?? []) syncMeta(child);
    }
    syncMeta(document);
  }
  applyOkjobsImages(document);
  return serialize(document);
}

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(absolute));
    else if (entry.name.endsWith(".html")) files.push(absolute);
  }
  return files;
}

export async function applyOkjobsPublicText(root = defaultRoot) {
  const files = await walkFiles(root);
  let changed = 0;
  for (const file of files) {
    const route = routeFor(file, root);
    const original = await readFile(file, "utf8");
    const rewritten = rewrite(original, route);
    if (rewritten !== original) {
      await writeFile(file, rewritten, "utf8");
      changed += 1;
    }
    const alias = sectorRouteAliases[route];
    if (alias) {
      const relative = path.relative(root, file).replace(/\\/g, "/");
      const locale = relative.match(/^(fr|es|sr)\//)?.[1];
      const localizedAlias = locale ? `/${locale}${alias}` : alias;
      const aliasFile = path.join(root, localizedAlias.slice(1), "index.html");
      await mkdir(path.dirname(aliasFile), { recursive: true });
      await writeFile(aliasFile, rewrite(original, route, localizedAlias), "utf8");
    }
  }
  const homepage = await readFile(path.join(root, "index.html"), "utf8");
  const sharedHeader = homepage.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0];
  if (sharedHeader) {
    for (const file of await walkFiles(root)) {
      const original = await readFile(file, "utf8");
      const rewritten = original.replace(/<header\b[^>]*>[\s\S]*?<\/header>/i, sharedHeader);
      if (rewritten !== original) await writeFile(file, rewritten, "utf8");
    }
  }
  const assets = path.join(root, "_astro");
  for (const name of await readdir(assets).catch(() => [])) {
    if (!name.endsWith(".js")) continue;
    const file = path.join(assets, name);
    const source = await readFile(file, "utf8");
    const rewritten = rewritePersonaRuntime(source);
    if (rewritten !== source) await writeFile(file, rewritten, "utf8");
  }
  // Astro hashes stay unchanged when only compiled copy is patched. Invalidate
  // immutable browser caches so hydration cannot restore the previous wording.
  for (const name of await readdir(assets).catch(() => [])) {
    if (!(name.startsWith("PricingSection.") || name.startsWith("LobbyStackWebVoiceWidget.")) || !name.endsWith(".js")) continue;
    const source = await readFile(path.join(assets, name), "utf8");
    const version = createHash("sha256").update(source).digest("hex").slice(0, 12);
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(/_astro/${escaped})(?:\\?copy=[a-f0-9]+)?(?=["'])`, "g");
    for (const file of await walkFiles(root)) {
      const original = await readFile(file, "utf8");
      const rewritten = original.replace(pattern, `$1?copy=${version}`);
      if (rewritten !== original) await writeFile(file, rewritten, "utf8");
    }
  }
  return changed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : defaultRoot;
  console.log(`Updated text only in ${await applyOkjobsPublicText(root)} Okjobs pages.`);
}
