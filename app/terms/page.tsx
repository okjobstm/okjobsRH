import Link from "next/link";
import { APP_NAME, ORG_NAME, CONTACT_EMAIL } from "@/lib/site-config";

export const metadata = {
  title: `Conditions d’utilisation | ${APP_NAME}`,
  description: `Conditions régissant l’utilisation de l’outil de recrutement ${APP_NAME}.`,
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-6 py-16 prose prose-slate">
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
          Dernière mise à jour : 2026-04-30
        </p>
        <h1>Conditions d’utilisation</h1>

        <div className="not-prose mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>À faire relire avant mise en production.</strong> Cette page est
          une traduction du texte anglais d’origine. Elle n’a pas été validée par un
          juriste et ne tient pas compte du droit applicable dans votre pays.
          Faites-la relire avant de diffuser des candidatures.
        </div>

        <p>
          Les présentes conditions régissent votre utilisation de l’outil de
          recrutement {APP_NAME}. En soumettant une candidature via ce site, vous
          acceptez les points ci-dessous.
        </p>

        <h2>Réponses sincères</h2>
        <p>
          L’évaluation vise à mesurer votre propre façon de raisonner. Le dépôt de
          réponses principalement générées par un outil d’IA, ou copiées d’une autre
          source sans mention, entraîne le retrait de votre candidature.
        </p>

        <h2>Votre lien d’invitation</h2>
        <p>
          Le lien que vous avez reçu vous est propre et expire à la date indiquée.
          Ne le partagez pas. Si vous avez besoin d’un nouveau lien, écrivez à{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <h2>Traitement de votre candidature</h2>
        <p>
          Vos réponses écrites sont examinées par l’équipe de recrutement de{" "}
          {ORG_NAME}, parallèlement à une évaluation assistée par IA. Nous vous
          communiquerons une décision dans un délai raisonnable. Consultez la{" "}
          <Link href="/privacy">politique de confidentialité</Link> pour le détail
          du traitement des données.
        </p>

        <h2>Disponibilité du service</h2>
        <p>
          Nous veillons à la disponibilité du site, mais ne garantissons aucune
          disponibilité. Si le site est indisponible au moment où vous soumettez votre
          candidature, votre progression est enregistrée et vous pourrez revenir plus
          tard.
        </p>

        <h2>Aucun contrat de travail</h2>
        <p>
          La soumission d’une candidature via ce site ne crée aucune relation de
          travail ni aucune offre d’emploi. Toute offre vous sera adressée
          séparément et par écrit.
        </p>

        <h2>Modifications des présentes conditions</h2>
        <p>
          Nous pouvons mettre à jour ces conditions de temps à autre. La date de
          «&nbsp;dernière mise à jour&nbsp;» en haut de page correspond à la version
          en vigueur.
        </p>

        <h2>Contact</h2>
        <p>
          Questions :{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        <p className="text-xs text-slate-500 mt-12 border-t border-slate-200 pt-4">
          <Link href="/privacy">Politique de confidentialité</Link>
        </p>
      </main>
    </div>
  );
}
