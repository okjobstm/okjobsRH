import { ORG_NAME } from "@/lib/site-config";

export default function BulkLinkExpiredPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Ce lien de candidature n’est plus actif</h1>
        <p className="text-slate-500">
          Le lien que vous avez utilisé a expiré, a été révoqué ou n’accepte plus de nouvelles
          candidatures. Contactez l’équipe de recrutement si vous pensez qu’il s’agit d’une erreur.
        </p>
        <p className="text-sm text-slate-400">{ORG_NAME}</p>
      </div>
    </div>
  );
}
