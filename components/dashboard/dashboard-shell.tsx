"use client";

import { useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, FileText, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { APP_NAME } from "@/lib/site-config";
import type { UserRole } from "@/lib/roles";
import { BrandMark } from "@/components/brand-mark";

type DashboardShellProps = {
  role: Extract<UserRole, "CANDIDATE" | "COMPANY">;
  email: string;
  children: React.ReactNode;
};

const ROLE_LABELS = {
  CANDIDATE: "Espace candidat",
  COMPANY: "Espace entreprise",
} as const;

export function DashboardShell({ role, email, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const candidate = role === "CANDIDATE";

  const navigation = candidate
    ? [
        { label: "Vue d’ensemble", href: "/dashboard", icon: LayoutDashboard },
        { label: "Mes candidatures", href: "/dashboard#applications", icon: FileText },
      ]
    : [
        { label: "Vue d’ensemble", href: "/dashboard", icon: LayoutDashboard },
        { label: "Mes offres", href: "/dashboard#jobs", icon: BriefcaseBusiness },
        { label: "Candidatures", href: "/dashboard#candidates", icon: FileText },
      ];

  const sidebar = (
    <>
      <Link className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-200 px-4 hover:bg-slate-50" href="/dashboard">
        <BrandMark className="size-7" priority />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900">{APP_NAME}</span>
          <span className="block truncate text-[11px] text-slate-500">{ROLE_LABELS[role]}</span>
        </span>
      </Link>

      <nav aria-label="Navigation du tableau de bord" className="flex-1 space-y-1 px-2 py-4">
        {navigation.map(({ label, href, icon: Icon }) => (
          <Link
            className="flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            href={href}
            key={label}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0 text-slate-500" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <p className="truncate px-2 pb-2 text-xs text-slate-500" title={email}>{email}</p>
        <form action={logoutAction}>
          <button className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" type="submit">
            <LogOut aria-hidden="true" className="size-4 text-slate-500" />
            Se déconnecter
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-svh bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        {sidebar}
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Fermer le menu" className="absolute inset-0 bg-slate-950/35" onClick={() => setSidebarOpen(false)} type="button" />
          <aside className="relative flex h-full w-[min(20rem,86vw)] flex-col bg-white shadow-xl">
            <button aria-label="Fermer le menu" className="absolute right-3 top-2.5 z-10 flex size-9 items-center justify-center rounded-md hover:bg-slate-100" onClick={() => setSidebarOpen(false)} type="button">
              <X aria-hidden="true" className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
          <button aria-label="Ouvrir le menu" className="flex size-11 items-center justify-center rounded-md hover:bg-slate-100" onClick={() => setSidebarOpen(true)} type="button">
            <Menu aria-hidden="true" className="size-5" />
          </button>
          <span className="ml-2 text-sm font-semibold">{ROLE_LABELS[role]}</span>
        </header>
        <main className="mx-auto w-full max-w-6xl p-5 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
