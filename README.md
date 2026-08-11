# CurbAlert LA

A community tool for reporting abandoned or illegally parked vehicles in Los Angeles — cars parked 72+ hours, expired tags, or other violations — with photo evidence and location tracking.

## How it works

- **Report a vehicle** — anyone can submit a report with a photo, license plate, vehicle details, and location (auto-detected via geolocation + reverse geocoding, or entered manually).
- **Rate limiting** — the same email can't report the same plate again within 72 hours.
- **Dashboard** — browse all reports, with search and status filtering (open / investigating / closed), and see how many times a given vehicle has been reported in total. Click any row to open its detail page.
- **Report detail page** — full info on a single report (`/reports/[id]`), including how many times that plate has been reported overall and a total upvote count.
- **Upvote / validate a report** — anyone viewing a report can upvote it to corroborate that it's accurate. A random anonymous token is generated and saved to `localStorage` on first upvote, so the same browser can't upvote a given report more than once (a soft, MVP-level limit — not real anti-abuse).
- **Edit your reports** — after submitting, reporters get a unique edit link (`/edit/[token]`) tied to their email. That one link lists and lets them update every report they've filed — no account or password needed. If you're viewing a report's detail page and your saved edit token matches its reporter, an "Edit this report" button appears; otherwise it doesn't.
- **Admin dashboard** (`/admin`) — password-protected. Admins can change a report's status, and can select 2+ rows and **merge** them as "the same vehicle" when reports for one real car have inconsistent details (wrong make/model, re-typed plate, etc). Merging never deletes data — it just links the rows with a `vehicle_group_id`, which shows as a "🔗 Same vehicle ×N" badge on both the admin and public dashboards. Any report can be un-merged ("Remove from group") at any time. See "Admin accounts" below to create a login.

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5) with the [Cloudflare adapter](https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-kit-site/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/) for the database, via [Drizzle ORM](https://orm.drizzle.team/)
- [Tailwind CSS](https://tailwindcss.com/) (forms + typography plugins)
- [Playwright](https://playwright.dev/) for e2e tests, [Vitest](https://vitest.dev/) for unit/component tests
- [Nominatim](https://nominatim.org/) for reverse geocoding

## Project structure

```
src/
  routes/
    +page.svelte                  # report submission form
    dashboard/                    # browse/search/filter all reports
    reports/[id]/                 # single report detail page + upvote button
    edit/[token]/                 # reporter's edit page for their own reports
    admin/login/                  # admin sign-in form
    admin/(protected)/            # admin dashboard, guarded by +layout.server.ts
    api/reports/                   # POST (create), GET (list/search)
    api/reports/[id]/             # GET a single report; PATCH status (admin-only)
    api/reports/[id]/vote/        # POST an upvote for a report
    api/reports/edit/[token]/     # GET/PATCH reports for a given reporter token
    api/admin/logout/             # POST to end the admin session
    api/admin/groups/             # POST to merge 2+ reports into a "same vehicle" group
    api/admin/groups/[groupId]/                        # GET a group's member reports
    api/admin/groups/[groupId]/reports/[reportId]/     # DELETE to un-merge one report
  lib/
    components/                   # VehicleSelector, ColorSelector, PhotoUpload, SelectDropdown, Navbar
    server/db/                    # Drizzle schema + DB client
    server/auth.ts                # PBKDF2 password hashing + session token helpers
    utils/imageCompression.ts     # client-side photo compression before upload
hooks.server.ts                   # reads the admin session cookie on every request
```

### Database schema

- **`reports`** — one row per submission: reporter email, plate/state, vehicle make/model/color, lat/lng + address, reason, notes, photo (base64), status, `vehicle_group_id`, timestamps. Indexed on `(license_plate, plate_state)` and on `vehicle_group_id`.
- **`reporters`** — one row per unique email, holding the edit `token` used to authenticate that reporter's `/edit/[token]` page.
- **`votes`** — one row per (report, anonymous voter token) upvote. A unique index on `(report_id, voter_token)` is what actually enforces one upvote per browser per report — not anything client-side.
- **`admins`** — one row per admin login: email + PBKDF2 password hash.
- **`admin_sessions`** — one row per active login. Only a SHA-256 hash of the session token is stored; the raw token lives solely in the browser's httpOnly cookie.
- **`vehicle_groups`** — one row per admin-confirmed "these reports are the same car". Reports point at a group via `reports.vehicle_group_id`; deleting/un-merging just sets that back to `null`, nothing is ever hard-deleted from `reports`. A group is auto-removed once it has ≤1 member left. Note: SQLite can't attach a `REFERENCES` constraint via `ALTER TABLE ADD COLUMN`, so this foreign key is enforced by Drizzle/TypeScript, not the database itself — an existing SQLite limitation, not a bug.

### ⚠️ Local dev has two separate databases — don't get burned by this

`npm run db:push` (as configured in `drizzle.config.ts`) pushes your schema to whatever `DATABASE_URL` points at — by default, a plain `local.db` SQLite file. But `wrangler pages dev` / `wrangler d1 execute --local` (i.e. your actual running app locally) reads from a *different* SQLite file that Wrangler manages itself, under `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite`.

Pushing a schema change to `local.db` does **not** affect the database your local app actually queries. If you add/change a table and your app doesn't seem to see it, this is almost always why.

To push schema changes to the database your local app really uses:

```bash
find .wrangler -name "*.sqlite"   # find the real local D1 file
DATABASE_URL="<paste that path>" npx drizzle-kit push
```

(TODO: consider just setting `DATABASE_URL` in `.env` to that `.wrangler` path permanently, so a plain `npm run db:push` always hits the right database. Not done yet since the filename is a generated hash that can change if `.wrangler/` is ever deleted/regenerated.)

### Admin accounts

There's no signup UI on purpose. Create an admin from the CLI:

```bash
node scripts/create-admin.mjs you@example.com "a strong password"
```

This writes the SQL to `scripts/.create-admin.sql` (gitignored — it briefly contains a real password hash) and prints two ready-to-run commands:

```bash
npx wrangler d1 execute curbalert-la-db --local  --file=scripts/.create-admin.sql   # local dev
npx wrangler d1 execute curbalert-la-db --remote --file=scripts/.create-admin.sql   # production
```

**Why a file and not `--command`:** the script used to print a raw `--command "INSERT INTO admins ... VALUES ('pbkdf2$100000$...')..."` string to copy/paste. Don't do that — inside double quotes, most shells (bash, zsh) treat `$` followed by digits as variable/positional-parameter expansion (`$1`, `$100000`, etc.), which silently strips those chunks out *before wrangler ever sees them*. Since a PBKDF2 hash string is full of `$` separators, this corrupted the stored hash and produced a very confusing "invalid email or password" on every login attempt, with no error anywhere. Writing to a `.sql` file and reading it with `--file=` sidesteps the shell entirely — same pattern the existing `db:seed` script already uses.

`wrangler d1 execute --local` reads/writes the *same* `.wrangler/state/...` database your local app actually reads from — no `DATABASE_URL` juggling needed for this step, unlike `db:push` (see the warning above). Just make sure you've pushed the `admins`/`admin_sessions`/`vehicle_groups` tables to that same `.wrangler` database first, or the insert will fail with "no such table."

Then sign in at `/admin/login`. Sessions last 7 days; "Log out" on the admin dashboard clears both the cookie and the session row.

## Developing

Install dependencies:

```sh
npm install
```

Copy the env example and set your local database path:

```sh
cp .env.example .env
```

Generate and apply database migrations locally:

```sh
npm run db:generate   # writes a new migration from schema.ts
npm run db:migrate    # applies migrations to your local DB
```

Start the dev server:

```sh
npm run dev

# or open it in a new browser tab
npm run dev -- --open
```

Other useful scripts:

```sh
npm run db:studio     # browse your local DB in Drizzle Studio
npm run check          # svelte-check + type checking
npm run lint            # prettier + eslint
npm run test:unit      # vitest
npm run test:e2e       # playwright
```

## Deploying

This project deploys to Cloudflare Pages with a D1 database bound as `DB` (see `wrangler.jsonc`). Since our migration files live in `drizzle/` (from `drizzle-kit generate`) rather than Wrangler's default `migrations/` folder, `wrangler.jsonc` points at it explicitly:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "curbalert-la-db",
    "database_id": "9939ab6f-5e36-40e7-8027-a5bc853e6368",
    "migrations_dir": "drizzle"
  }
]
```

### Manual deploy (CLI)

Log in to Cloudflare, if you haven't already (one-time):

```sh
npx wrangler login
```

Build the app:

```sh
npm run build
```

Deploy — Wrangler reads the output directory from `pages_build_output_dir` in `wrangler.jsonc` automatically, so no path argument is needed:

```sh
npx wrangler pages deploy
```

First deploy will prompt you to create the Pages project and pick a Cloudflare account (if you have more than one). You'll get a live URL like `https://curbalert-la.pages.dev`.

> Deploying the app and migrating the database are separate steps — deploying doesn't touch D1 at all. Always make sure remote migrations are applied (see below) before or right after a deploy, or you'll ship a frontend against a database that's missing tables/columns.

### Auto-deploy on push (alternative)

Instead of running the CLI manually every time, you can connect this repo in the Cloudflare dashboard under **Workers & Pages → your project → Settings → Builds**, so every push to the connected branch builds and deploys automatically, with preview URLs on pull requests.

### Database migrations

Apply migrations to the **local** Wrangler D1 emulator during development:

```sh
npx wrangler d1 migrations apply curbalert-la-db --local
```

And to the **remote** production database when deploying:

```sh
npx wrangler d1 migrations apply curbalert-la-db --remote
```

> Local dev (`npm run dev`), Wrangler's local D1 emulator, and plain SQLite (used by `drizzle-kit migrate` per `DATABASE_URL`) are three separate databases — migrations applied to one won't show up in the others.

### Troubleshooting: "table already exists" / "no such table"

If `wrangler d1 migrations apply` fails with something like `table 'reports' already exists`, it means a table got created in that database outside of Wrangler's migration tracking (e.g. an old `drizzle-kit push`, or a stray dev session), so Wrangler doesn't know that migration already ran. For **local dev only** (never run this against `--remote`), the fastest fix is to wipe the local D1 emulator's storage and let migrations rebuild it from scratch:

```sh
rm -rf .wrangler/state/v3/d1
npx wrangler d1 migrations apply curbalert-la-db --local
```

If you instead see `no such table` errors while the app is running, it usually means migrations were applied to the wrong database — double check you're running the `--local` command above (not `drizzle-kit migrate`, which uses `DATABASE_URL` and a separate plain-SQLite file, not D1 at all).

### Troubleshooting: the same conflict on `--remote`

The same "table already exists" error can happen against production, but **don't reuse the local fix** — you can't just wipe a live D1 database the same way you wipe the local emulator's folder.

First, check what's actually there and whether Wrangler's tracking table (`d1_migrations`) exists yet:

```sh
npx wrangler d1 execute curbalert-la-db --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

**If `d1_migrations` doesn't exist**, the table was created outside migration tracking. Mark the conflicting migration as already applied, without re-running its SQL:

```sh
npx wrangler d1 execute curbalert-la-db --remote --command "CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP)"

npx wrangler d1 execute curbalert-la-db --remote --command "INSERT INTO d1_migrations (name) VALUES ('0000_motionless_jazinda.sql')"

npx wrangler d1 migrations apply curbalert-la-db --remote
```

**If you'd rather just start clean** (only reasonable while there's no real data in it — check first), drop the conflicting table(s) and let migrations rebuild them:

```sh
npx wrangler d1 execute curbalert-la-db --remote --command "DROP TABLE reports"
npx wrangler d1 migrations apply curbalert-la-db --remote
```

D1 has [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), a point-in-time restore that Cloudflare keeps automatically (30 days on paid plans, shorter on free), so a `DROP TABLE` on remote isn't instantly unrecoverable if something goes wrong — but treat it as a safety net, not a reason to skip checking what's in the table first.
