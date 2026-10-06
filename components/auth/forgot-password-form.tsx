"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  requestPasswordResetAction,
  type AuthActionState,
} from "@/app/auth/actions";
import { AuthShell } from "@/components/auth/auth-shell";

const INITIAL_STATE: AuthActionState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, INITIAL_STATE);

  if (state.status === "reset-sent") {
    return (
      <AuthShell
        description={`Si un compte existe pour ${state.email}, un lien de réinitialisation vient d’être envoyé.`}
        title="Vérifiez votre courriel"
      >
        <p className="text-center text-sm text-[#737373]">
          <Link className="font-medium text-[#0a0a0a] underline-offset-4 hover:underline" href="/login">Retour à la connexion</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      description="Entrez le courriel de votre compte et nous vous enverrons un lien de réinitialisation."
      title="Réinitialiser votre mot de passe"
    >
      <div className="flex w-full flex-col gap-6">
        <form action={action}>
          <div className="flex w-full flex-col gap-4">
            <div className="flex w-full flex-col gap-3">
              <label className="w-fit text-sm font-medium leading-snug" htmlFor="reset-email">Courriel</label>
              <input
                autoComplete="email"
                className="h-11 w-full rounded-[26px] border border-[#e5e5e5] bg-[#fafafa] px-3 text-base outline-none placeholder:text-[#737373] focus:border-[#a3a3a3] focus:ring-3 focus:ring-[#d4d4d4]/50 md:text-sm"
                id="reset-email"
                name="email"
                placeholder="vous@entreprise.com"
                required
                type="email"
              />
            </div>

            {state.error ? (
              <p className="-mt-1 text-sm text-red-600" role="alert">
                {state.error === "configuration" ? "L’authentification n’est pas configurée. Contactez un administrateur." : "Impossible d’envoyer le lien de réinitialisation. Veuillez réessayer."}
              </p>
            ) : null}

            <button className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-[26px] bg-[#171717] px-4 text-sm font-medium text-white transition-all hover:bg-[#404040] active:translate-y-px disabled:opacity-50" disabled={pending} type="submit">
              {pending ? <><LoaderCircle aria-hidden="true" className="size-4 animate-spin" /><span className="sr-only">Envoi du lien...</span></> : "Envoyer le lien"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-[#737373]">
          <Link className="font-medium text-[#0a0a0a] underline-offset-4 hover:underline" href="/login">Retour à la connexion</Link>
        </p>
      </div>
    </AuthShell>
  );
}
