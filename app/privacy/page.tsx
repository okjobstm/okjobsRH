import Link from "next/link";
import { APP_NAME, ORG_NAME, CONTACT_EMAIL } from "@/lib/site-config";

export const metadata = {
  title: `Politique de confidentialité | ${APP_NAME}`,
  description: `Comment ${ORG_NAME} traite les données des candidats dans l’outil de recrutement ${APP_NAME}.`,
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-6 py-16 prose prose-slate">
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
          Dernière mise à jour : 2026-04-30
        </p>
        <h1>Politique de confidentialité</h1>

        <div className="not-prose mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>À faire relire avant mise en production.</strong> Cette page est
          une traduction du texte anglais d’origine. Elle n’a pas été validée par un
          juriste et ne tient pas compte du droit applicable dans votre pays
          (protection des données à caractère personnel). Faites-la relire et
          complétez les champs entre crochets avant de diffuser des candidatures.
        </div>

        <p>
          Cette page explique comment {ORG_NAME} («&nbsp;nous&nbsp;») traite les
          données à caractère personnel transmises via l’outil de recrutement{" "}
          {APP_NAME}. Si vous avez posé une candidature via ce site, la présente
          politique décrit les données que nous collectons et les raisons de cette
          collecte.
        </p>

        <h2>Données que nous collectons</h2>
        <ul>
          <li>
            Votre nom et votre adresse e-mail (fournis lors de la création d’une
            invitation)
          </li>
          <li>Vos réponses écrites aux questions d’évaluation</li>
          <li>Votre CV si vous en téléversez un</li>
          <li>
            Données d’engagement : date d’ouverture du lien, durée de passation de
            l’évaluation, sections complétées et métadonnées techniques de base
            (navigateur, adresse IP) utilisées à des fins de sécurité
          </li>
          <li>
            Évaluation assistée par IA de vos réponses écrites, réalisée via l’API
            Claude d’Anthropic. Le modèle reçoit vos réponses confrontées à la grille
            d’évaluation du poste et renvoie une note structurée et des observations
            à notre équipe de recrutement
          </li>
        </ul>

        <h2>Usage de ces données</h2>
        <p>
          Nous utilisons ces données uniquement pour évaluer votre adéquation au
          poste visé et pour communiquer cette évaluation à notre équipe de
          recrutement. Nous ne vendons pas vos données. Nous ne les utilisons pas à
          des fins publicitaires. Nous ne les communiquons à aucun tiers, hormis nos
          sous-traitants ci-dessous.
        </p>

        <h2>Sous-traitants</h2>
        <ul>
          <li>
            <strong>Anthropic</strong> : vos réponses écrites sont transmises à
            l’API Claude d’Anthropic aux fins d’évaluation. Anthropic indique que
            les données transmises via son API ne servent pas à entraîner ses
            modèles. Consultez{" "}
            <a href="https://www.anthropic.com/legal/privacy" rel="noopener noreferrer">
              la politique de confidentialité d’Anthropic
            </a>
            .
          </li>
          <li>
            <strong>Hébergement</strong> : les données de candidature sont stockées
            sur une infrastructure contrôlée par {ORG_NAME}.{" "}
            <span className="bg-amber-100 px-1">
              [Décrivez ici l’hébergeur, son pays et les dispositions de sauvegarde
              de votre déploiement.]
            </span>
          </li>
        </ul>

        <h2>Durée de conservation</h2>
        <p>
          <span className="bg-amber-100 px-1">
            [Incohérence à trancher : le formulaire de consentement (étape 1) annonce
            24 mois, le présent paragraphe 12 mois. Alignez les deux avant mise en
            production.]
          </span>{" "}
          Nous conservons les données de votre candidature pendant la durée du
          processus de recrutement, augmentée d’une période d’archivage raisonnable
          (généralement jusqu’à 12 mois), afin de pouvoir nous reporter sur des
          candidatures passées. Passé ce délai, les données sont supprimées sur
          votre demande ou lors des opérations de nettoyage régulier.
        </p>

        <h2>Vos droits</h2>
        <p>Vous pouvez à tout moment nous demander :</p>
        <ul>
          <li>De recevoir une copie des données que nous détenons sur vous</li>
          <li>De supprimer vos données</li>
          <li>
            De corriger toute information erronée vous concernant dont nous
            disposons
          </li>
        </ul>
        <p>
          Écrivez à{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> et nous traitons
          votre demande dans les 14 jours.
        </p>

        <h2>Sécurité</h2>
        <p>
          Le site est servi en HTTPS. L’accès administrateur est restreint à une
          liste restreinte d’adresses e-mail de salariés. Votre lien de candidature
          contient un jeton à usage unique qui vous est propre : ne le partagez pas.
        </p>

        <h2>Contact</h2>
        <p>
          Pour toute question relative à la confidentialité, écrivez à{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <p className="text-xs text-slate-500 mt-12 border-t border-slate-200 pt-4">
          <Link href="/terms">Conditions d’utilisation</Link>
        </p>
      </main>
    </div>
  );
}
