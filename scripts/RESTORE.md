# Recruit DB — Backup & Restore

## What runs

Nothing on this host. The nightly `pg_dump` cron is gone: it wrote to the same
disk as the database, so it protected against nothing that matters.

Backups are now Supabase's:

- **Point-in-time recovery**, 28-day window, on the paid project. Off-site,
  managed by Supabase, survives loss of this box.
- **Daily automated backups**, kept for 14 days on the same project.

Set the window in Dashboard → your project → Settings → Backups → PITR. Keep it
at 28 days: the retention copy in `app/privacy/page.tsx` promises exactly that,
and a longer window would contradict it.

## Restore the whole database to a point in time

Dashboard → project → Settings → Backups → Point-in-time recovery, pick a
timestamp, then either restore into a branch (safe, lets you verify) or into
production (destructive, replaces the current database).

With the Supabase CLI, linked to the project:

```bash
supabase link --project-ref <ref> --password '<db password>'
supabase db restore --backup-id <backup-id>   # from supabase backup list
```

After any restore, re-apply migrations, since a restore point predates whatever
has shipped since:

```bash
pm2 stop recruit
npm run db:migrate
npm run db:seed    # seed is idempotent; needed if the restore predates it
pm2 start recruit
```

## Verify a restore without touching production

Restore into a branch, point that branch's `DATABASE_URL` at a scratch build,
and check row counts. Do not rehearse a destructive restore on production.

## Storage is a different system

Candidate CVs are objects in the private `cvs` bucket. They are **not** rows, so
what a database restore brings back depends on whether your plan's PITR and
daily backups include Storage file objects. Confirm it once in Dashboard →
Settings → Backups, and record the answer here:

- [ ] Verified: PITR includes Storage objects
- [ ] Verified: Storage objects are **not** covered by PITR

If they are not covered, a database restore leaves CV rows pointing at missing
objects. The app treats that as a broken download rather than a crash, and the
reaper in `scripts/reap-orphan-uploads.mjs` only prunes objects with no row, so
it will not delete anything on its own. Re-uploading from a `pg_dump` of the old
files, or paying for object-level versioning, are the two ways to close this.

## Known limitations

- **Recovery granularity is the last ~24h for PITR on this plan**, down to the
  transaction. There is no weekly or monthly archive anymore: a mistake older
  than 28 days is not recoverable.
- **Storage coverage is unconfirmed** (see above). Until it is, treat a database
  restore as a partial restore.