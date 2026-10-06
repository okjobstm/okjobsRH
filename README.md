# Recruit

[![CI](https://github.com/billynaveed/recruit/actions/workflows/ci.yml/badge.svg)](https://github.com/billynaveed/recruit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An AI-assisted recruitment and candidate-assessment platform. Hiring teams
create roles, invite candidates via tokenized magic links, and review a
structured six-stage application. Written behavioral answers are scored against
a per-role rubric using Anthropic's Claude API, then synthesized into a
role-fit read for human reviewers. It is not a hire/no-hire engine — it
surfaces structured signal to support an interview decision.

> Originally built as an internal tool and released under the MIT license. You
> will need to supply your own configuration (database, Supabase Auth providers,
> Anthropic API key) and customize the branding and legal copy for your
> organization.

## Features

- **Roles and questions** — create jobs, store the job description, and manage a
  role-specific question set.
- **Invites** — single tokenized magic-link invites and reusable bulk links,
  plus bulk CSV import.
- **Six-stage candidate flow** — welcome, CV upload, role questions, standard
  questions, behavioral (STAR) assessment, and review/submit, all with
  autosave and resume.
- **AI scoring** — STAR responses are scored against the role rubric via the
  Claude API; dimension scores are synthesized into a role-fit read.
- **Reviewer workflow** — assign, submit, and withdraw reviews with a pending
  queue and badge.
- **Audit log** — every administrative action is recorded.
- **Engagement signals, analytics, and an in-app help walkthrough.**
- **Ops** — `/healthz` check, structured pino logging, Supabase point-in-time
  recovery, and optional Sentry error monitoring.

## Stack

- [Next.js 15](https://nextjs.org/) App Router, React 19, TypeScript
- [Prisma 7](https://www.prisma.io/) (driver-adapter pattern) on Supabase Postgres
- [Supabase Auth](https://supabase.com/docs/guides/auth) (email/password and Google) + Storage
- Tailwind CSS v4, shadcn-style components
- [pino](https://getpino.io/) structured logging
- [Anthropic Claude API](https://docs.anthropic.com/) for rubric scoring
- pm2 for process management (one example deployment model)

## Prerequisites

- Node.js 22+
- Three [Supabase](https://supabase.com/) projects (production, dev, test), or at
  least one to start. Production needs the IPv4 add-on for direct connections
- The Email provider enabled in Supabase Auth with email confirmation; Google is optional
- Supabase Site URL and Redirect URLs configured for `/auth/callback`
- An Anthropic API key (for AI scoring)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`. The key variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Supabase session-pooler URL used by the application |
| `DIRECT_URL` | yes | Supabase session-pooler URL used by Prisma migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Publishable API key, safe in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Service-role key, server-only, bypasses RLS |
| `ANTHROPIC_API_KEY` | yes | Enables AI rubric scoring |
| `ADMIN_HOSTED_DOMAIN` | no | Email domain allowed to use the Admin role (e.g. `acme.com`) |
| `ADMIN_EMAILS` | no | Comma-separated allowlist, also seeds the reviewer picker |
| `NEXT_PUBLIC_BASE_URL` | recommended | Public origin used to build candidate links |
| `NEXT_PUBLIC_APP_NAME` / `NEXT_PUBLIC_ORG_NAME` / `NEXT_PUBLIC_CONTACT_EMAIL` | no | Branding and legal-copy customization |

Candidate and company accounts can be created with any valid email address.
The selected role is promoted into server-controlled Supabase `app_metadata`
after email confirmation. Candidate accounts use the restricted `/dashboard`.
Company accounts use the complete recruitment console under `/admin` (offers,
invites, candidates, reviews, analytics, exports, help, and settings). The Admin
role currently inherits that console and is the base for a future global view.
Admin access additionally requires a match on `ADMIN_HOSTED_DOMAIN` **or**
`ADMIN_EMAILS`, so choosing “Admin” in the form never bypasses the allowlist.

In Supabase Auth, keep **Confirm email** enabled. Add both the production origin
and the local development origin to the allowed redirect URLs, including
`/auth/callback`. The `/login`, `/signup`, `/forgot-password`, and
`/reset-password` pages use the public Supabase client. The service-role key is
used only on the server to assign the verified role in protected `app_metadata`.

Create the private Storage bucket named `cvs` in each project. It holds one
object per candidate CV at `<candidateId>/<field>_<uuid>.<ext>`, and is read and
written only with the service-role key.

### 3. Set up the database

```bash
npm run db:generate          # generate the Prisma client
npx prisma migrate deploy    # apply tracked migrations
# or, for quick local iteration: npm run db:push
```

Optional seed data for local development:

```bash
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

The app runs at `http://localhost:3000`. The root is the public LobbyStack site;
its authentication calls to action lead to `/login` and `/signup`. The private
application remains under `/admin` and redirects to `/login` without a valid
administrator session.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run test:unit` | Run unit tests |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:push` | Push the schema to the database (dev) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed development data |

## Project layout

- `app/admin/*` — admin shell, dashboard, role detail, candidate detail, reviews, help
- `app/apply/[token]/*` — candidate-facing flow (stages 1–6)
- `actions/*` — server actions (auth, jobs, candidates, reviews, apply)
- `lib/scoring/*` — STAR scoring, dimension synthesis, role-fit reads
- `lib/supabase/*` — Auth, Storage, and service-role clients
- `components/*` — admin and candidate UI components
- `prisma/schema.prisma` — data model (single source of truth)
- `tests/e2e/*` — Playwright end-to-end suites
- `scripts/*` — deploy and ops helpers

## Testing

Unit tests run with `npm run test:unit`. End-to-end suites use Playwright
(Python) and expect a running app plus a database. Point everything at a
**disposable** Supabase test project, since these suites write rows and delete CVs:

```bash
set -a && source .env.test && set +a
npm run dev:safe &
python tests/e2e/test_candidate_erase.py
```

`tests/e2e/mint_admin_session.mjs` mints a real Supabase session for
`ADMIN_E2E_EMAIL` and prints its cookies, so admin suites skip the browser OAuth
dance. `ADMIN_E2E_PASSWORD` is no longer used.

## Deployment

`scripts/setup-deploy.sh` bootstraps one example deployment model: a GitHub
Actions self-hosted runner that, on each push to `main`, runs
`scripts/deploy.sh` (`git pull && npm ci && prisma migrate deploy && next build
&& pm2 reload`) with a `/healthz` gate. Both scripts read their paths and names
from the environment, so adapt or replace them to suit your infrastructure. See
`scripts/RESTORE.md` for the point-in-time recovery runbook and
`scripts/UPTIME.md` for uptime guidance.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and our
[Code of Conduct](CODE_OF_CONDUCT.md). Security issues: see
[SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
