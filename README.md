# CurbAlert LA

A community tool for reporting abandoned or illegally parked vehicles in Los Angeles — cars parked 72+ hours, expired tags, or other violations — with photo evidence and location tracking.

## How it works

- **Report a vehicle** — anyone can submit a report with a photo, license plate, vehicle details, and location (auto-detected via geolocation + reverse geocoding, or entered manually).
- **Rate limiting** — the same email can't report the same plate again within 72 hours.
- **Dashboard** — browse all reports, with search and status filtering (open / investigating / closed), and see how many times a given vehicle has been reported in total.
- **Edit your reports** — after submitting, reporters get a unique edit link (`/edit/[token]`) tied to their email. That one link lists and lets them update every report they've filed — no account or password needed.

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
    +page.svelte              # report submission form
    dashboard/                # browse/search/filter all reports
    edit/[token]/             # reporter's edit page for their own reports
    api/reports/               # POST (create), GET (list/search)
    api/reports/edit/[token]/ # GET/PATCH reports for a given reporter token
  lib/
    components/               # VehicleSelector, ColorSelector, PhotoUpload, SelectDropdown, Navbar
    server/db/                # Drizzle schema + DB client
    utils/imageCompression.ts # client-side photo compression before upload
```

### Database schema

- **`reports`** — one row per submission: reporter email, plate/state, vehicle make/model/color, lat/lng + address, reason, notes, photo (base64), status, timestamps. Indexed on `(license_plate, plate_state)`.
- **`reporters`** — one row per unique email, holding the edit `token` used to authenticate that reporter's `/edit/[token]` page.

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

This project deploys to Cloudflare Pages with a D1 database bound as `DB` (see `wrangler.jsonc`).

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
