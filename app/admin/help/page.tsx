import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import {
  Briefcase,
  Send,
  Users,
  ClipboardCheck,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { APP_NAME } from "@/lib/site-config";

export default async function HelpPage() {
  await requireAuth();

  return (
    <div className="max-w-[760px] space-y-8 pb-12">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Avancez jusqu’à votre sélection avec {APP_NAME}</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Du poste à pourvoir à la décision finale, retrouvez l’action à mener à chaque étape de votre recrutement.
        </p>
      </div>

      <Section
        icon={Briefcase}
        title="1. Créer un poste"
        steps={[
          <>Cliquez sur <Code>Créer un poste</Code> en haut à droite (ou sur le bouton <Code>Nouveau</Code> à côté de <em>Postes</em> dans la barre latérale).</>,
          <>Collez la description du poste en texte brut. Le dépôt d’un PDF fonctionne aussi, mais le texte brut est plus fiable.</>,
          <>Le système génère dix questions spécifiques au poste à partir de la description. Vous pouvez les modifier, les supprimer, les réordonner ou ajouter des questions situationnelles personnalisées avant d’ouvrir le poste.</>,
          <>Passez le poste de <Code>Brouillon</Code> à <Code>Ouvert</Code> lorsque vous êtes prêt à inviter des candidats.</>,
        ]}
      />

      <Section
        icon={Send}
        title="2. Inviter des candidats"
        steps={[
          <>Ouvrez le poste et cliquez sur l’onglet <Code>Invitations</Code>.</>,
          <>Ajoutez une invitation avec le nom et l’adresse e-mail, ou utilisez <Code>Import CSV</Code> lorsque vous avez plus de trois candidats.</>,
          <>Chaque invitation dispose d’un lien unique. Cliquez sur <Code>Copier le lien</Code> et envoyez-le par votre canal habituel.</>,
          <>Les liens expirent au bout de 14 jours. Vous pouvez révoquer une invitation à tout moment, tant que le candidat n’a pas soumis sa candidature.</>,
        ]}
      />

      <Section
        icon={Users}
        title="3. Suivre les candidatures"
        steps={[
          <>Le tableau de bord regroupe les candidats par poste. Cliquez sur un en-tête de poste pour le déplier ou le replier.</>,
          <>Les étapes vont de <em>Non démarrée</em> à <em>En cours</em>, puis <em>Soumise</em>, avant les décisions des évaluateurs (<em>En cours d’examen</em>, <em>Présélectionné</em>, <em>Offre</em>, <em>Embauché</em> ou <em>Refusé</em>).</>,
          <>Cliquez sur le nom d’un candidat pour ouvrir son évaluation complète, son panneau d’engagement et son panneau d’évaluateurs.</>,
          <>La bande d’indicateurs en haut du tableau de bord donne d’un coup d’œil les compteurs de tout le pipeline.</>,
        ]}
      />

      <Section
        icon={ClipboardCheck}
        title="4. Affecter et rendre les évaluations"
        steps={[
          <>Sur la fiche d’un candidat, le panneau <em>Évaluateurs</em> se trouve près du haut. Choisissez un collègue dans la liste <Code>Attribuer à</Code>, puis cliquez sur <Code>Attribuer</Code>. Vous pouvez aussi vous attribuer vous-même.</>,
          <>Chaque évaluateur dispose de sa propre file. Ouvrez <Link href="/admin/reviews" className="text-blue-600 hover:underline">Évaluations</Link> dans la barre latérale pour voir vos affectations en attente, vos décisions passées et la file de l’équipe.</>,
          <>Pour rendre une décision, ouvrez la fiche du candidat dont vous êtes l’évaluateur affecté, choisissez <em>oui franc, oui, non mesuré ou non</em>, ajoutez vos notes et cliquez sur <Code>Rendre votre décision</Code>.</>,
          <>Une affectation en attente peut être retirée par l’évaluateur comme par la personne qui l’a faite. Les décisions rendues sont définitives : retirez l’affectation et réattribuez-la si vous devez refaire une évaluation.</>,
        ]}
      />

      <Section
        icon={CheckCircle2}
        title="5. Prendre la décision finale"
        steps={[
          <>Depuis la fiche d’un candidat ayant terminé sa candidature, utilisez la barre d’actions en haut : <Code>Présélectionner</Code>, <Code>Refuser</Code> ou <Code>Embaucher</Code>.</>,
          <>Les candidats refusés peuvent revenir en présélection si vous changez d’avis.</>,
          <>Chaque décision est consignée dans le journal d’audit, afin que l’équipe voie qui a fait quoi et quand.</>,
        ]}
      />

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
        <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 leading-relaxed">
          <p className="font-semibold mb-1">Quelques réflexes utiles</p>
          <ul className="list-disc pl-5 space-y-1 opacity-90">
            <li>Lancez <Code>Analyser le candidat</Code> avant d’affecter un évaluateur. L’évaluation structurée leur donne de quoi réagir au lieu d’une page blanche.</li>
            <li>Gardez des notes brèves. Vous vous en remercierez plus tard lors des comparaisons entre candidats.</li>
            <li>Utilisez la même grille d’évaluation pour tous les évaluateurs d’un même poste, afin que les décisions restent comparables.</li>
            <li>Si quelque chose semble ne pas fonctionner, consultez d’abord le journal d’audit de la page du poste : il enregistre chaque action d’administration avec son horodatage.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  steps,
}: {
  icon: typeof Briefcase;
  title: string;
  steps: React.ReactNode[];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <ol className="space-y-2 text-sm text-slate-700 leading-relaxed list-decimal pl-5 marker:text-slate-400">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-slate-100 text-slate-700 px-1.5 py-0.5 text-[12px] font-medium">
      {children}
    </code>
  );
}
