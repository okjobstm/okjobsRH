# Security Policy

## Reporting a vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Instead, report them privately using
[GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
for this repository, or by emailing the maintainers at the address configured
in `NEXT_PUBLIC_CONTACT_EMAIL` for your deployment.

Please include:

- A description of the issue and its impact
- Steps to reproduce
- Any relevant logs or proof-of-concept (without including real user data)

We will acknowledge your report as soon as we can and keep you updated on
remediation progress.

## Deploying securely

This is open-source software you self-host. A few essentials when running it:

- Serve the app over HTTPS. Supabase sets the `Secure` flag on its session
  cookies itself.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. It bypasses RLS and is the one
  credential that can read every CV, so it must never be prefixed with
  `NEXT_PUBLIC_` and never reach a client component.
- Restrict admin sign-in by setting `ADMIN_HOSTED_DOMAIN` to your organization’s
  email domain, and use `ADMIN_EMAILS` for any admin outside it. Candidate and
  company signup remains open, while the Admin role fails closed when both are
  empty.
- Treat Supabase `app_metadata.role` as the authorization source. The signup
  choice is initially untrusted `user_metadata`; only the server-side callback
  may promote it after email confirmation and the Admin allowlist check.
- Keep Supabase **Confirm email** enabled for email/password signup, configure a
  production SMTP provider, and allow only your exact `/auth/callback` origins.
- Keep the `cvs` bucket private. Nothing in this app relies on public object
  URLs, and nothing should be able to list it anonymously.
- Keep `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and the Supabase database
  password out of version control; they belong in `.env`, which is gitignored.
- Rotate any credential that may have been exposed.
