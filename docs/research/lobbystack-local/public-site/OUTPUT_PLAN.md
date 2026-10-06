# LobbyStack public-site clone output plan

## Source and destination

- Source application: `C:/Users/33758/Documents/CloneWebSIte/Projets/lobbystack-main/apps/landing`
- Source runtime: Astro 7 static output with React islands and Tailwind CSS 4
- Destination application: repository root (Next.js 15 App Router)
- Destination bundle: `public/_lobbystack/`
- Destination route manifest: `public/_lobbystack-route-manifest.json`
- Route integration: exact `beforeFiles` rewrites generated from the manifest

The Astro output is embedded as complete HTML documents. This keeps LobbyStack's markup, CSS, JavaScript, fonts, assets, responsive behavior and animations isolated from Okjobs' root React layout and global Tailwind theme.

## Route preservation

- `/`, LobbyStack marketing routes, localized routes and generated blog/SEO routes are served from the embedded bundle.
- `/login`, `/signup`, `/auth/**`, `/admin/**`, `/api/**`, `/apply/**`, `/healthz` and `/monitoring` remain owned by Okjobs.
- Okjobs' candidate legal pages remain available at `/okjobs/privacy` and `/okjobs/terms`.
- The LobbyStack versions occupy their original `/privacy` and `/terms` paths.
- Authentication links in the copied output are rewritten to `/login` and `/signup` only; page copy and visual design are unchanged.

## Shared foundation changes

- `next.config.ts`: exact public-page and asset rewrites plus static cache headers.
- `app/signup/page.tsx`: compatibility entry into the existing authentication flow.
- `app/okjobs/privacy/page.tsx` and `app/okjobs/terms/page.tsx`: preserve candidate legal pages.
- `app/apply/layout.tsx`: point candidate legal links at their preserved routes.
- `scripts/import-lobbystack-static.mjs`: reproducible copy, auth-link rewrite and manifest generation.

## Collision policy

No catch-all rewrite is used. Only paths present in the generated static manifest are rewritten, preventing public content from intercepting private or candidate routes.
