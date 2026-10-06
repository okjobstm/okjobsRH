import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { APP_NAME } from "@/lib/site-config";

type AuthShellProps = {
  title: string;
  description?: React.ReactNode;
  progress?: boolean;
  legalFooter?: React.ReactNode;
  children: React.ReactNode;
};

export function AuthShell({
  title,
  description,
  progress = false,
  legalFooter,
  children,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-svh w-full flex-col bg-white text-[#0a0a0a]">
      <main className="flex flex-1 flex-col items-center px-6 py-12">
        <div className="my-auto flex w-full max-w-sm flex-col items-center">
          <Link aria-label={APP_NAME} className="flex w-full items-center justify-center gap-2.5" href="/">
            <BrandMark className="size-8 select-none" priority />
            <span className="text-xl font-semibold leading-none">{APP_NAME}</span>
          </Link>

          <div className="mt-10 flex w-full flex-col items-center gap-4 text-center">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">{title}</h1>
            {description ? <p className="text-[15px] leading-7 text-[#737373]">{description}</p> : null}
          </div>

          <div className="mt-10 w-full">{children}</div>
        </div>
      </main>

      <footer className="flex flex-col items-center gap-4 px-6 pb-12 pt-16">
        {progress ? (
          <nav aria-label="Progression de l’inscription : étape 1 sur 8">
            <ol className="flex items-center justify-center gap-1.5">
              {Array.from({ length: 8 }, (_, index) => (
                <li className="flex" key={index}>
                  <span
                    aria-current={index === 0 ? "step" : undefined}
                    className={index === 0 ? "h-1.5 w-6 rounded-full bg-[#0a0a0a]" : "h-1.5 w-1.5 rounded-full bg-[#e5e5e5]"}
                  />
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        {legalFooter ?? (
          <div className="flex items-center gap-4 text-xs text-[#737373]">
            <Link className="hover:text-[#0a0a0a]" href="/terms">Conditions</Link>
            <span aria-hidden="true">·</span>
            <Link className="hover:text-[#0a0a0a]" href="/privacy">Confidentialité</Link>
          </div>
        )}
      </footer>
    </div>
  );
}
