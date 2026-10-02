import {
  createInviteAction,
  bulkImportInvitesAction,
  createBulkInviteLinkAction,
  revokeBulkInviteLinkAction,
} from "@/actions/jobs";
import { CopyUrlButton } from "@/components/admin/copy-url-button";
import { InviteRowMenu } from "./invite-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LOCALE, TIME_ZONE } from "@/lib/site-config";
import { formatDate, INVITE_STATUS_LABEL } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link2, Share2, Upload } from "lucide-react";
import { getInviteStatus } from "@/lib/jobs";
import { computeInviteStaleness } from "@/lib/engagement";
import { bulkApplyUrl } from "@/lib/base-url";
import type { InviteStatus } from "@prisma/client";

export type InviteRow = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  token: string;
  expiresAt: Date;
  revokedAt: Date | null;
  status: InviteStatus;
  notes: string | null;
  createdAt: Date;
  candidate: { id: string } | null;
};

export type BulkInviteLinkRow = {
  id: string;
  token: string;
  label: string | null;
  status: string;
  expiresAt: Date;
  revokedAt: Date | null;
  registrations: number;
  lastOpenedAt: Date | null;
};

export function InvitesTab({
  jobId,
  invites,
  bulkLinks,
}: {
  jobId: string;
  invites: InviteRow[];
  bulkLinks: BulkInviteLinkRow[];
}) {
  return (
    <div className="grid gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,1fr)]">
      <PendingInvitesPanel jobId={jobId} invites={invites} />

      <div className="space-y-5">
        <BulkInviteLinkCard jobId={jobId} links={bulkLinks} />
        <SingleInviteCard jobId={jobId} />
        <BulkImportCard jobId={jobId} />
      </div>
    </div>
  );
}

function PendingInvitesPanel({ jobId, invites }: { jobId: string; invites: InviteRow[] }) {
  if (invites.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
        Aucune invitation créée pour le moment. Utilisez le lien réutilisable ou la carte
        d’invitation individuelle à droite.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Invitations en attente</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          {invites.length}
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {invites.map((invite) => {
          const status = getInviteStatus(invite.expiresAt, invite.revokedAt);
          const staleness = computeInviteStaleness({
            createdAt: invite.createdAt,
            hasCandidate: !!invite.candidate,
            isActive: invite.status === "ACTIVE",
            // eslint-disable-next-line react-hooks/purity -- Server Component
            now: Date.now(),
          });
          return (
            <div key={invite.id} className="flex items-center gap-3 px-5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{invite.candidateName}</p>
                <p className="truncate text-xs text-slate-500">{invite.candidateEmail}</p>
              </div>
              <span className="hidden text-xs text-slate-400 sm:inline">
                Expire le {new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric", timeZone: TIME_ZONE }).format(invite.expiresAt)}
              </span>
              {staleness.isStale && (
                <span
                  className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800"
                  title={`Aucune activité depuis ${Math.floor(staleness.daysSinceCreated)} jours`}
                >
                  Sans activité
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {INVITE_STATUS_LABEL[status]}
              </span>
              <InviteRowMenu
                invite={{
                  id: invite.id,
                  jobId,
                  candidateName: invite.candidateName,
                  candidateEmail: invite.candidateEmail,
                  token: invite.token,
                  status: invite.status,
                  isStale: staleness.isStale,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BulkInviteLinkCard({
  jobId,
  links,
}: {
  jobId: string;
  links: BulkInviteLinkRow[];
}) {
  // eslint-disable-next-line react-hooks/purity -- Server Component
  const now = Date.now();
  const heroLink = links.find((l) => l.status === "ACTIVE" && l.expiresAt.getTime() > now) ?? links[0];

  return (
    <Card id="invite-hero" className="border-slate-900/80 ring-2 ring-slate-900/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="h-4 w-4 text-yfs-accent" />
          Lien d’invitation réutilisable
        </CardTitle>
        <CardDescription>
          Une seule URL, autant de candidats. Votre flux principal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {heroLink ? (
          <ActiveBulkLink jobId={jobId} link={heroLink} />
        ) : (
          <p className="text-sm text-slate-500">Aucun lien actif. Créez-en un ci-dessous.</p>
        )}

        <form action={createBulkInviteLinkAction} className="space-y-3 border-t border-slate-100 pt-4">
          <input type="hidden" name="jobId" value={jobId} />
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <div className="space-y-1.5">
              <Label htmlFor="bulkLinkLabel">Libellé (facultatif)</Label>
              <Input id="bulkLinkLabel" name="label" placeholder="Publication LinkedIn · mai 2026" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bulkLinkExpiresInDays">Expire dans</Label>
              <Input
                id="bulkLinkExpiresInDays"
                name="expiresInDays"
                type="number"
                min={1}
                max={180}
                defaultValue={30}
                required
              />
            </div>
          </div>
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Créer un autre lien réutilisable
          </Button>
        </form>

        {links.length > 1 && (
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Liens plus anciens
            </p>
            {links
              .filter((l) => l.id !== heroLink?.id)
              .map((l) => (
                <OlderBulkLink key={l.id} jobId={jobId} link={l} />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActiveBulkLink({ jobId, link }: { jobId: string; link: BulkInviteLinkRow }) {
  const url = bulkApplyUrl(link.token);
  // eslint-disable-next-line react-hooks/purity -- Server Component
  const expired = link.expiresAt.getTime() < Date.now();
  const isActive = link.status === "ACTIVE" && !expired;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-900">{link.label || "Lien réutilisable"}</p>
      <div className="rounded-md bg-yfs-accent/10 px-3 py-2 font-mono text-xs text-slate-700 break-all ring-1 ring-yfs-accent/30">
        {url}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CopyUrlButton url={url} label="Copier le lien" />
        {isActive && (
          <form
            action={async () => {
              "use server";
              await revokeBulkInviteLinkAction(link.id, jobId);
            }}
          >
            <Button type="submit" variant="ghost" size="sm" className="text-red-600">
              Révoquer
            </Button>
          </form>
        )}
      </div>
      <p className="text-xs text-slate-500">
        {link.registrations} inscription{link.registrations === 1 ? "" : "s"}
        {link.lastOpenedAt ? ` · dernière ouverture ${formatRelative(link.lastOpenedAt)}` : ""}
        {" · expire le "}
        {formatDate(link.expiresAt)}
      </p>
    </div>
  );
}

function OlderBulkLink({ jobId, link }: { jobId: string; link: BulkInviteLinkRow }) {
  const url = bulkApplyUrl(link.token);
  // eslint-disable-next-line react-hooks/purity -- Server Component
  const expired = link.expiresAt.getTime() < Date.now();
  const isActive = link.status === "ACTIVE" && !expired;
  const displayStatus = link.status === "REVOKED" ? "REVOKED" : expired ? "EXPIRED" : "ACTIVE";
  return (
    <div className="rounded-md border border-slate-100 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-slate-700">
          {link.label || "Lien réutilisable"}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          {INVITE_STATUS_LABEL[displayStatus]}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">
        {link.registrations} inscription{link.registrations === 1 ? "" : "s"} · expire le{" "}
        {formatDate(link.expiresAt)}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <CopyUrlButton url={url} />
        {isActive && (
          <form
            action={async () => {
              "use server";
              await revokeBulkInviteLinkAction(link.id, jobId);
            }}
          >
            <Button type="submit" variant="ghost" size="sm" className="text-red-600">
              Révoquer
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function SingleInviteCard({ jobId }: { jobId: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Link2 className="h-4 w-4 text-slate-400" />
          Invitation individuelle
        </CardTitle>
        <CardDescription className="text-xs">
          Un lien à usage unique pour une personne précise.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createInviteAction} className="space-y-3">
          <input type="hidden" name="jobId" value={jobId} />
          <Input name="candidateName" placeholder="Nom du candidat" required />
          <Input name="candidateEmail" type="email" placeholder="candidat@exemple.com" required />
          <Input name="expiresInDays" type="number" min={1} max={90} defaultValue={14} required />
          <Textarea name="notes" rows={2} placeholder="Notes (facultatif)" />
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Créer le lien d’invitation
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function BulkImportCard({ jobId }: { jobId: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Upload className="h-4 w-4 text-slate-400" />
          Import CSV
        </CardTitle>
        <CardDescription className="text-xs">
          name, email, notes : jetons générés automatiquement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={bulkImportInvitesAction} className="space-y-3">
          <input type="hidden" name="jobId" value={jobId} />
          <Textarea
            name="csvText"
            rows={5}
            placeholder={
              "name,email,notes\nAmina Rahman,amina@example.com,Rencontrée lors d’une conférence"
            }
            required
          />
          <Input name="expiresInDays" type="number" min={1} max={90} defaultValue={14} required />
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Importer le CSV
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function formatRelative(date: Date): string {
  // eslint-disable-next-line react-hooks/purity -- Server Component
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "à l’instant";
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return formatDate(date);
}
