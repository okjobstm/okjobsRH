# Changelog

Each entry is one line per shipped commit on `main`. Newest at the top.
Append a line whenever you commit something user-visible or operationally meaningful.
Skip purely internal cleanups (formatting, comment fixes) unless they affect behavior.

## 2026-10-03

- Confidentialite: « Supprimer ma candidature » supprimait le `Candidate` puis remettait l'`Invite` en `ACTIVE`. L'invitation conservait le nom, l'adresse et un jeton vivant, le fichier CV restait sur le disque, et l'audit de l'entreprise partait en cascade avec l'invitation (`AuditLog.inviteId` est `onDelete: Cascade`). L'action efface desormais le fichier CV, detache les lignes d'audit avant de supprimer l'invitation, ecrit une entree `CANDIDATE_DATA_ERASED` (acteur `candidat:auto-service`, `jobId` seul, pas d'`inviteId`) puis supprime l'invitation : postuler a nouveau exige une nouvelle invitation. Le libelle devient « Effacer mes donnees », la confirmation passe du `confirm()` natif a la boite de dialogue existante, et le bouton est partage par les etapes 2 a 5 pour que le texte ne diverge pas. La page de lien expire confirme desormais l'effacement et les 35 jours de sauvegarde. Nouveau `scripts/reap-orphan-uploads.mjs` (dry run par defaut, `--apply`, refuse un `UPLOADS_DIR` illisible ou vide) et `scripts/recruit-reaper.cron` pour ramasser les fichiers CV laisses derriere par un `unlink` echoue ou un upload interrompu.
- Securite: l'action serveur `recordCvUpload` est supprimee. Elle etait exportee donc directement appelable, acceptait n'importe quel `candidateId` et n'exigeait aucun jeton : elle ecrivait un `cvPath` arbitraire, y compris hors du dossier de depot, ce qui deplaceait le CV lu par l'admin et par l'extraction. Le confinement est centralise dans `lib/uploads.ts` (`resolveInsideUploads`, `isInsideUploads`) et applique au telechargement CV admin et a `extractCvText` : traversée `..`, chemin absolu et racine du depot sont refuses, la racine parce que c'est un repertoire. Correction de severite : la route admin disposait deja d'un controle de confinement, la lecture arbitraire n'etait donc pas possible, le risque etait l'ecriture non authentiquee de `Submission.cvPath`. L'evenement `cv_uploaded` est desormais emis par la route d'upload, qui le derivait de l'action supprimee, pour que l'historique d'activite du candidat reste identique. Test `tests/uploads-confinement.test.mjs`.
- Securite: `POST /api/apply/upload` n'autorisait plus que sur un `candidateId` envoye par le client, sans jeton. La route ecrivait le fichier fourni et ecrivait par-dessus `Submission.cvPath` / `cvText`, puis relanait l'extraction qui alimente le scoring STAR : connaitre un simple identifiant suffisait a substituer le CV d'un candidat et donc son evaluation. L'identite vient desormais du jeton d'invitation (`validateToken`), le `candidateId` a disparu du corps de requete, et un jeton absent, expire ou revoque renvoie 403. `field` passe en liste blanche (`cv`) : il entrait dans le nom de fichier, donc une valeur contenant `../` permettait d'ecrire hors du dossier du candidat.

## 2026-10-02

- FR: couche IA en français (critères d'évaluation STAR, prompts de synthèse, prose déterministe, détection de poste `CEO_TITLE_RE` et `MARKETING_ENGINEER_TITLE_RE` qui reconnaissent aussi les intitulés français). Le scorer produit désormais une sortie JSON contrainte (`output_config.format`) qui n'admet que les tokens ASCII, avec un repli `normalizeFeatureValue` qui résout les libellés français vers leur token et journalise l'écart. Test A/B : un jeu de features français tombe sur la même bande et les mêmes règles que son jumeau anglais. Plafond des questions de relance porté de 60 à 75 mots, le français étant 15 à 20 % plus long. Les synthèses déjà générées restent en anglais jusqu'à leur régénération (prose addressée par contenu).
- FR: rapport PDF candidat traduit (chrome, libellés de dimensions et de bandes, questions d'entretien). `MOTIVATOR_LABELS` factorisé et partagé avec la synthèse. Les polices standard de PDFKit sont encodées en WinAnsi : un convertisseur appliqué une seule fois sur `doc.text` replie `’`, l'espace insécable et `…`, absents de CP1252, pour que la prose française ne s'affiche pas en blancs.

- FR: interface admin entièrement en français (tableau de bord, statistiques, évaluations, paramètres, détail candidat, aide, fichiers de poste). Les clés machine restent en anglais : valeurs `RoleFitBand` et `DimensionBand`, enums Prisma, clés des maps de classes CSS. Libellés français ajoutés au seul point de rendu (`ROLE_FIT_LABEL`, `JOB_STATUS_LABEL`, `INVITE_STATUS_LABEL`, `formatStage`, `ENGAGEMENT_BAND_LABEL`). Avertissement « scores non calibrés » ajouté au détail candidat.
- FR: parcours de candidature (étapes 1 à 6, libellés d'étapes, compteur de mots, enregistrement automatique), pages de confirmation d'envoi et de lien expiré, candidatures groupées. Apostrophes typographiques, espaces insécables, aucun tiret cadratin.
- FR: pages Confidentialité et Conditions d'utilisation traduites, avec bandeau « à faire relire avant mise en production ». Incohérence de durée de conservation relevée (consentement 24 mois contre 12 mois dans la politique) et signalée dans les deux pages, non tranchée.

## 2026-06-05

- Ops: `scripts/deploy.sh` now fails fast if anything under `node_modules`/`.next` is not owned by the deploy user, printing the exact `chown` fix. Root-owned dirs (from a stray `npm install`/`next build` as root) make `npm ci` die with `EACCES rmdir` and had silently blocked every deploy from May 22 to Jun 5.
- Upgrade `@anthropic-ai/sdk` 0.90.0 → 0.100.1. Also a redeploy to recover from an out-of-band `next build` run as `root` in the prod checkout on Jun 4: that had replaced on-disk `.next` chunks under the still-running May-31 server (causing `Failed to find Server Action` errors for users) and left `.next` files root-owned (causing `EACCES` when the `dev` runtime wrote its `/privacy` and `/terms` prerender cache). Ownership restored to `dev`; this commit forces a clean rebuild + `pm2 reload` so the on-disk build and running process match again.

## 2026-05-31

- Fix: silent CV upload failures. Some PDFs leaked NUL bytes through pdf-parse into extracted text; Postgres `TEXT` rejected the write with `invalid byte sequence for encoding "UTF8": 0x00`, surfacing as a generic "Upload failed" toast for candidates. 22 prod failures logged 2026-05-04 → 2026-05-22. `lib/cv-extract.ts` `normalize()` now strips NULs at the head of the chain. New unit-test runner (`npm run test:unit`) covers the regression. Also adds `npm run dev:safe` (`NEXT_DIST_DIR=.next-dev`) so local `next dev` no longer clobbers the prod `.next/`.

## 2026-05-22

- Excel export per role. New `GET /api/admin/jobs/[jobId]/export?ids=…` produces an `.xlsx` with one row per candidate: job title / department / location, candidate name + email, stage, role-fit band, submission timestamps, an admin-only CV download URL (`/api/admin/cv/<candidate>`), cover letter, every role-specific answer, every standard answer, final reflection, admin notes. Wired to the Candidates tab as a "Download all to Excel" button above the table and an "Excel" entry on the bulk action bar when rows are selected. Action audited as `CANDIDATES_EXPORTED_XLSX`.

## 2026-05-20

- Auth: any Google Workspace user on the configured `ADMIN_HOSTED_DOMAIN` can now sign in. The Workspace hosted-domain check (`hd` claim) is the only gate at sign-in; the per-email `ADMIN_EMAILS` allowlist is no longer required. `ADMIN_EMAILS` now serves only as an optional bootstrap list for the reviewer picker — once a new admin signs in once, they appear in pickers automatically via `AdminSession` history.

## 2026-05-15

- Polish wave: toast notifications on all admin actions; replaced native `confirm()` / `prompt()` with proper Radix AlertDialog flows (including typed-name confirms); bulk multi-select action bar on the candidate table with bulk shortlist / reject / archive; loading skeletons for dashboard, job detail, candidate detail, and audit log; dashboard tab strip (All / Open / Drafts / Archived) + inline stat strip replacing the 5 KPI cards; sidebar right-click context menu per role (Archive; from the Archived disclosure: Restore or Delete forever with typed-name confirm); clickable role-page stat chips that jump-filter the Candidates tab; mobile card-list fallback for the candidate table below `md`; audit log filter chips (All / Invites / Candidates / Reviews / Role config).
- Removed the email + password fallback login. Google Sign-In (restricted to the configured Workspace domain) is now the only path.
- Main page nav fixes: dashboard role titles link directly to the role detail page; Role setup tab now opens with the description in an editable textarea and all questions auto-expanded for edit.
- New server actions: `updateJobDescriptionAction`. Existing `setJobStatusAction` reused for sidebar archive/restore.

- Redesigned the per-role admin page (`/admin/jobs/[jobId]`) into a three-tab shell: Candidates (default), Invites, Role setup. Replaced the four big stat cards with inline chips in the header. New per-row ⋯ menus on candidate, invite, and question rows (built on Radix DropdownMenu). Candidate rows now show a colour-coded role-fit pill (Strong fit → Likely mis-fit) derived from `synthesisJson.roleFitRead.band`, plus inline shortlist / reject buttons. Invite rows get Extend expiry / Regenerate token / Delete. Role setup tab gains a danger zone (Close / Archive / Delete role with typed-name confirm). Audit log moved to `/admin/jobs/[jobId]/audit`, reachable from the job ⋯ menu.
- Schema: `ARCHIVED` value added to `JobStatus` and `CandidateStage`; `notes TEXT?` added to `Candidate` for free-form admin notes per candidate.
- New server actions (all audited): `setJobStatusAction`, `deleteJobAction`, `moveToInReviewAction`, `archiveCandidateAction`, `unarchiveCandidateAction`, `updateCandidateNotesAction`, `extendInviteExpiryAction`, `regenerateInviteTokenAction`, `deleteInviteAction`.
- Google Sign-In for admin login. Renders a "Sign in with Google" button on `/login` when `GOOGLE_CLIENT_ID` is set, verifies the ID token server-side via `google-auth-library`, gates on Workspace hosted domain (`ADMIN_HOSTED_DOMAIN`) + the existing `ADMIN_EMAILS` allowlist, then mints the same iron-session cookie as the password flow. Email/password remains as a fallback.
- Reusable bulk invite links: admins generate one URL per job, candidates self-register with name + email, each spawned candidate drops into the existing 6-stage flow. Repeat email on same link resumes the existing draft. New `BulkInviteLink` model + `/apply/bulk/[token]` public page + admin card on the job detail page.

## 2026-05-04

- Fixed broken CV upload (EACCES on /var/recruit/uploads after pm2 user migration; chown'd to dev) and added text extraction. PDFs go through pdfjs-dist via pdf-parse v2; DOCX via mammoth. Extracted text stored in Submission.cvText and surfaced on the candidate detail page next to the Download CV link with character count and an expandable view. Old .doc binaries are explicitly rejected with a friendly message.
- New tests/e2e/test_cv_extraction.py drives stage 2 with a real generated PDF (tests/e2e/make_fake_cv.mjs) and verifies cvText contents in the DB.

## 2026-05-03

- Engagement score column on dashboard rows + candidate detail (Strong / Engaged / Stale / Abandoned bands with a 0-100 score)
- Stale-invite flag on job detail invites tab + per-job count on dashboard role headers (>7 days with no candidate activity)
- Time-to-finish on candidate engagement panel: Active time (sum of session durations) and Time to finish (wall-clock first event → submittedAt)
- New /admin/analytics page: per-job stage funnel, drop-off counts per stage, median time-to-finish for submitters
- Sidebar: Analytics link added
- New helper module lib/engagement.ts is the single source for these metrics

## 2026-05-02

- Multi-reviewer consensus: rollup on candidate page (e.g. "2 strong yes, 1 lean no") + needs-decision count on job rows + per-candidate "Needs decision" badge
- Rewrote CLAUDE.md to reflect Phases 1-4 shipped + auto-deploy guidance
- Added this CHANGELOG

## 2026-05-01

- Auto-deploy via self-hosted GitHub Actions runner on the prod box (push-to-main → pm2 reload, zero downtime)
- `pm2` migrated from root to the `dev` user, registered via `ecosystem.config.js`
- Per-org git auth pattern wired up for the YFS org (`~/.gitconfig.yfs` + `~/.tokens/yfs`)
- Added `How to use` page at `/admin/help` and a dismissible `Tip` component across key pages
- Reviews link promoted to top of admin sidebar
- Migration baseline reset: single fresh `prisma/migrations/0_init` matches current schema, `migration_lock.toml` added
- New full-submission E2E (`tests/e2e/test_candidate_full_submission.py`) drives all 6 stages and verifies COMPLETED in DB
- Phase 4 (reviewer workflow): `Review` model, assign/submit/withdraw actions, reviewer panel on candidate page, `/admin/reviews` queue, sidebar link with pending-count badge, audit-logged

## 2026-04-30

- Sprint 2 prod hardening: backups + cron, migration baseline, Sentry scaffold (no-op without DSN), `/healthz`, `/privacy`, `/terms`, in-memory rate limiter
- Phase 3 candidate event logging + Sprint 1 dashboard polish + admin export
- Initial commit: Recruit candidate CRM (Phases 1-2 foundation)
