# CurbAlert LA

A community tool for reporting abandoned or illegally parked vehicles in Los Angeles — cars parked 72+ hours, expired tags, or other violations — with photo evidence and location tracking.

## How it works

- **Report a vehicle** — anyone can submit a report with a photo, license plate, vehicle details, and location (auto-detected via geolocation + reverse geocoding, or entered manually).
- **Rate limiting** — the same email can't report the same plate again within 72 hours.
- **Dashboard** — browse all reports, with search and status filtering (open / investigating / closed), and see how many times a given vehicle has been reported in total. Click any row to open its detail page.
- **Report detail page** — full info on a single report (`/reports/[id]`), including how many times that plate has been reported overall and a total upvote count.
- **Upvote / validate a report** — anyone viewing a report can upvote it to corroborate that it's accurate. A random anonymous token is generated and saved to `localStorage` on first upvote, so the same browser can't upvote a given report more than once (a soft, MVP-level limit — not real anti-abuse).
- **Edit your reports** — after submitting, reporters get a unique edit link (`/edit/[token]`) tied to their email. That one link lists and lets them update every report they've filed — no account or password needed. If you're viewing a report's detail page and your saved edit token matches its reporter, an "Edit this report" button appears; otherwise it doesn't.

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
    api/reports/                   # POST (create), GET (list/search)
    api/reports/[id]/             # GET a single report (with counts + edit-access check)
    api/reports/[id]/vote/        # POST an upvote for a report
    api/reports/edit/[token]/     # GET/PATCH reports for a given reporter token
  lib/
    components/                   # VehicleSelector, ColorSelector, PhotoUpload, SelectDropdown, Navbar
    server/db/                    # Drizzle schema + DB client
    utils/imageCompression.ts     # client-side photo compression before upload
```

### Database schema

- **`reports`** — one row per submission: reporter email, plate/state, vehicle make/model/color, lat/lng + address, reason, notes, photo (base64), status, timestamps. Indexed on `(license_plate, plate_state)`.
- **`reporters`** — one row per unique email, holding the edit `token` used to authenticate that reporter's `/edit/[token]` page.
- **`votes`** — one row per (report, anonymous voter token) upvote. A unique index on `(report_id, voter_token)` is what actually enforces one upvote per browser per report — not anything client-side.

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

```sh
npm run build
```

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
