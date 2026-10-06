"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import {
  signInAction,
  signUpAction,
  type AuthActionState,
} from "@/app/auth/actions";
import { AuthShell } from "@/components/auth/auth-shell";

const INITIAL_STATE: AuthActionState = {};

const ERROR_COPY: Record<NonNullable<AuthActionState["error"]>, string> = {
  credentials: "Courriel ou mot de passe incorrect. Veuillez réessayer.",
  signup: "Impossible de créer votre compte. Veuillez réessayer.",
  unauthorized: "Cette adresse ne peut pas utiliser le rôle Administrateur. Choisissez un autre rôle ou contactez un administrateur.",
  password: "Utilisez un mot de passe d'au moins 8 caractères, avec un chiffre et un caractère spécial.",
  configuration: "L’authentification n’est pas configurée. Contactez un administrateur.",
};

type AuthFormProps = {
  mode: "login" | "signup";
  returnTo?: string;
  externalError?: string;
};

export function AuthForm({ mode, returnTo = "/admin", externalError }: AuthFormProps) {
  const login = mode === "login";
  const [state, action, pending] = useActionState(login ? signInAction : signUpAction, INITIAL_STATE);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [role, setRole] = useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const criteria = [
    { label: "Minimum 8 caractères", met: password.length >= 8 },
    { label: "Au moins un chiffre", met: /\d/.test(password) },
    { label: "Au moins un caractère spécial", met: /[^A-Za-z0-9\s]/.test(password) },
  ];
  const signupReady = emailValid && Boolean(role) && criteria.every((criterion) => criterion.met);

  if (!login && state.status === "check-email") {
    return (
      <AuthShell
        description={`Nous avons envoyé un lien de vérification à ${state.email ?? email.trim().toLowerCase()}.`}
        title="Vérifiez votre courriel"
      >
        <div className="flex w-full flex-col gap-6 text-center">
          <p className="text-sm leading-6 text-[#737373]">
            Ouvrez le lien reçu pour vérifier votre adresse et terminer la création de votre compte.
          </p>
          <Link className="text-sm font-medium underline-offset-4 hover:underline" href="/login">
            Retour à la connexion
          </Link>
        </div>
      </AuthShell>
    );
  }

  const legalFooter = !login ? (
    <p className="max-w-full text-center text-xs leading-5 text-[#737373] sm:whitespace-nowrap">
      En cliquant sur &quot;Créer le compte&quot;, vous acceptez nos{" "}
      <Link className="underline underline-offset-4 hover:text-[#0a0a0a]" href="/terms" target="_blank">conditions d&apos;utilisation</Link>{" "}
      et notre{" "}
      <Link className="underline underline-offset-4 hover:text-[#0a0a0a]" href="/privacy" target="_blank">politique de confidentialité</Link>.
    </p>
  ) : undefined;

  return (
    <AuthShell legalFooter={legalFooter} progress={!login} title={login ? "Retrouvez votre espace Okjobs" : "Commencez votre parcours Okjobs"}>
      <div className="flex w-full flex-col gap-6">
        <form action={action}>
          <input name="returnTo" type="hidden" value={returnTo} />
          <div className="flex w-full flex-col gap-4">
            {!login ? (
              <fieldset className="flex w-full flex-col gap-3">
                <legend className="text-sm font-medium leading-snug">Quel espace souhaitez-vous rejoindre ?</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    { value: "CANDIDATE", label: "Candidat" },
                    { value: "COMPANY", label: "Entreprise" },
                    { value: "ADMIN", label: "Admin" },
                  ].map((option) => (
                    <label
                      className={`flex min-h-11 cursor-pointer items-center justify-center rounded-[18px] border px-3 py-2 text-center text-sm font-medium transition-colors focus-within:ring-3 focus-within:ring-[#d4d4d4]/50 ${
                        role === option.value
                          ? "border-[#171717] bg-[#171717] text-white"
                          : "border-[#e5e5e5] bg-[#fafafa] text-[#525252] hover:border-[#a3a3a3]"
                      }`}
                      key={option.value}
                    >
                      <input
                        className="sr-only"
                        name="role"
                        onChange={(event) => setRole(event.target.value)}
                        required
                        type="radio"
                        value={option.value}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                <p className="text-xs leading-5 text-[#737373]">
                  Le rôle Administrateur est réservé aux adresses préautorisées.
                </p>
              </fieldset>
            ) : null}

            <div className="flex w-full flex-col gap-3">
              <label className="w-fit text-sm font-medium leading-snug" htmlFor="auth-email">Courriel</label>
              <input
                aria-invalid={emailBlurred && email.length > 0 && !emailValid}
                autoComplete="email"
                className="h-11 w-full min-w-0 rounded-[26px] border border-[#e5e5e5] bg-[#fafafa] px-3 py-1 text-base outline-none transition-colors placeholder:text-[#737373] focus:border-[#a3a3a3] focus:ring-3 focus:ring-[#d4d4d4]/50 aria-invalid:border-red-600 aria-invalid:text-red-600 md:text-sm"
                id="auth-email"
                name="email"
                onBlur={() => setEmailBlurred(true)}
                onChange={(event) => { setEmailBlurred(false); setEmail(event.target.value); }}
                placeholder={login ? "vous@entreprise.com" : "vous@exemple.com"}
                required
                type="email"
                value={email}
              />
              {emailBlurred && email.length > 0 && !emailValid ? (
                <p className="flex items-center gap-2 text-sm font-medium text-red-600" role="alert">
                  <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
                  L&apos;adresse courriel fournie est invalide.
                </p>
              ) : null}
            </div>

            <div className="flex w-full flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <label className="w-fit text-sm font-medium leading-snug" htmlFor="auth-password">Mot de passe</label>
                {login ? (
                  <Link className="text-xs font-medium text-[#737373] hover:text-[#0a0a0a]" href="/forgot-password">Mot de passe oublié?</Link>
                ) : null}
              </div>
              <input
                autoComplete={login ? "current-password" : "new-password"}
                className="h-11 w-full min-w-0 rounded-[26px] border border-[#e5e5e5] bg-[#fafafa] px-3 py-1 text-base outline-none transition-colors placeholder:text-[#737373] focus:border-[#a3a3a3] focus:ring-3 focus:ring-[#d4d4d4]/50 md:text-sm"
                id="auth-password"
                minLength={8}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                onFocus={() => setPasswordFocused(true)}
                placeholder={login ? "••••••••" : "Créer un mot de passe"}
                required
                type="password"
                value={password}
              />
              {!login && passwordFocused ? (
                <ul aria-live="polite" className="flex flex-col gap-1 pt-0.5 text-sm font-medium">
                  {criteria.map((criterion) => (
                    <li className={`flex items-center gap-2 ${criterion.met ? "text-emerald-700" : "text-[#737373]"}`} key={criterion.label}>
                      <span aria-hidden="true" className="w-3 text-center">{criterion.met ? "✓" : "×"}</span>
                      <span>{criterion.label}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {state.error || externalError ? (
              <p className="-mt-1 text-sm text-red-600" role="alert">
                {state.error
                  ? ERROR_COPY[state.error]
                  : externalError === "code_manquant"
                    ? "Ce lien de connexion est invalide ou expiré. Veuillez réessayer."
                    : "Vous n’avez pas accès à cet espace. Veuillez vous reconnecter."}
              </p>
            ) : null}

            <button
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-[26px] bg-[#171717] px-4 text-sm font-medium text-white transition-all hover:bg-[#404040] active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
              disabled={pending || (!login && !signupReady)}
              type="submit"
            >
              {pending ? (
                <><LoaderCircle aria-hidden="true" className="size-4 animate-spin" /><span className="sr-only">{login ? "Connexion..." : "Création du compte..."}</span></>
              ) : login ? "Se connecter" : "Créer le compte"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-[#737373]">
          {login ? "Vous n'avez pas de compte?" : "Vous avez déjà un compte?"}{" "}
          <Link className="font-medium text-[#0a0a0a] underline-offset-4 hover:underline" href={login ? "/signup" : "/login"}>
            {login ? "Créer un compte" : "Se connecter"}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
