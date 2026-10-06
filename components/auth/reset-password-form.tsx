"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const strongPassword = password.length >= 8 && /\d/.test(password) && /[^A-Za-z0-9\s]/.test(password);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!strongPassword) {
      setError("Utilisez un mot de passe d'au moins 8 caractères, avec un chiffre et un caractère spécial.");
      return;
    }

    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Ce lien de réinitialisation est invalide ou expiré. Demandez-en un nouveau.");
      setPending(false);
      return;
    }

    await supabase.auth.signOut();
    setComplete(true);
    setPending(false);
  }

  return (
    <AuthShell
      description={complete ? "Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter." : undefined}
      title="Nouveau mot de passe"
    >
      <div className="flex w-full flex-col gap-6">
        {!complete ? (
          <form onSubmit={submit}>
            <div className="flex w-full flex-col gap-4">
              <div className="flex w-full flex-col gap-3">
                <label className="w-fit text-sm font-medium leading-snug" htmlFor="reset-new-password">Nouveau mot de passe</label>
                <input
                  autoComplete="new-password"
                  className="h-11 w-full rounded-[26px] border border-[#e5e5e5] bg-[#fafafa] px-3 text-base outline-none placeholder:text-[#737373] focus:border-[#a3a3a3] focus:ring-3 focus:ring-[#d4d4d4]/50 md:text-sm"
                  id="reset-new-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Choisissez un nouveau mot de passe"
                  required
                  type="password"
                  value={password}
                />
              </div>
              {error ? <p className="-mt-1 text-sm text-red-600" role="alert">{error}</p> : null}
              <button className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-[26px] bg-[#171717] px-4 text-sm font-medium text-white transition-all hover:bg-[#404040] active:translate-y-px disabled:opacity-50" disabled={pending} type="submit">
                {pending ? <><LoaderCircle aria-hidden="true" className="size-4 animate-spin" /><span className="sr-only">Réinitialisation...</span></> : "Réinitialiser le mot de passe"}
              </button>
            </div>
          </form>
        ) : null}

        <p className="text-center text-sm text-[#737373]">
          <Link className="font-medium text-[#0a0a0a] underline-offset-4 hover:underline" href="/login">Retour à la connexion</Link>
        </p>
      </div>
    </AuthShell>
  );
}
