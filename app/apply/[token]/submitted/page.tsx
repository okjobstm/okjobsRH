import { ORG_NAME } from "@/lib/site-config";

export default function SubmittedPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-slate-900">Candidature envoyée</h1>
          <p className="text-slate-500">
            Merci d’avoir terminé votre candidature auprès de {ORG_NAME}. Nous examinerons
            attentivement votre dossier et vous contacterons pour vous présenter la suite.
          </p>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500 text-left space-y-2">
          <p>La suite :</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Notre équipe examinera votre candidature</li>
            <li>Nous nous efforçons de vous répondre sous deux semaines</li>
            <li>Vous pourrez être invité à un entretien</li>
          </ul>
        </div>

        <p className="text-sm text-slate-400">{ORG_NAME}</p>
      </div>
    </div>
  );
}
