# GameShelf

GameShelf is a full-stack TypeScript app for tracking a video game backlog. It uses Express + EJS for the web app, Prisma ORM + PostgreSQL for persistence, and Better Auth for email/password authentication.

## Current Status

Implemented today:

- Server-rendered app shell and auth pages
- Better Auth integration with Prisma adapter
- Session-aware home screen (`/api/me`)
- Prisma models and migrations for game data and auth tables
- Auth-gated `Game` CRUD scoped to the signed-in user, with zod request
  validation and centralized JSON errors
- Auth-gated `PlaySession` CRUD nested under `/api/games/:gameId/sessions`
- Shelf page (`/shelf`) for adding, editing, archiving, and deleting games,
  with a pre-filled edit dialog and per-game play-session logging
- Shelf filter bar — status (including a Wishlist view), archived, and sort
  (recently added or priority), with a live result count and Reset
- localStorage personalization: the chosen filter/sort view is remembered
  across reloads under `gameshelf:shelf-filters`
- Per-game play log page (`/shelf/games/:gameId/log`) with total hours and
  per-entry editing (pre-filled) and deletion
- Wishlist business rules enforced server-side and reflected in the UI: play
  time cannot be logged against a wishlisted game, and a game with a play
  history cannot move back to the wishlist
- IGDB game search endpoint (`/api/igdb/search`), server-side via the
  Twitch-authenticated helper in `src/server/lib/igdb.ts`, wired into the
  add-game form as a debounced type-ahead that fills in title, platform,
  rating, and cover art
- Demo seed script (`npm run db:seed`) and SQL export workflow
  (`npm run db:export`)
- Build pipeline for server, client JS, and SCSS assets
- Prisma Compute deployment configuration

Test coverage: 119 tests across 7 files — the three route suites, the business
rules and page/API auth guards, and the shared client helpers. Deliberately not
covered: DOM-driving client tests (the browser code keeps its logic in
`src/client/lib`, which is unit-tested directly, so the suite needs no jsdom)
and the live IGDB call (it would need Twitch credentials in CI).

## Tech Stack

- Node.js + TypeScript
- Express 5
- EJS templates
- Prisma ORM 7 (`prisma-client` generator to `generated/prisma`)
- PostgreSQL + `pg` + `@prisma/adapter-pg`
- Better Auth, using its built-in `better-auth/adapters/prisma` adapter
- esbuild + Sass + concurrently
- Prisma Compute (`prisma.compute.ts`)

## Project Structure

```text
src/
	server/
		index.ts
		lib/
			auth.ts            Better Auth setup
			demoAccount.ts     demo credentials shared by the seed and login page
			errors.ts          HttpError helpers + centralized JSON error handler
			gameRules.ts       wishlist business rules (pure, 409s on violation)
			igdb.ts            Twitch-authenticated IGDB client
			pageAuth.ts        session guards for HTML page routes
			prisma.ts          Prisma client + pg adapter
			requireAuth.ts     session guard for JSON API routes
			validateGame.ts    zod schemas for game requests
			validateSession.ts zod schemas + serializers for play sessions
		routes/
			games.ts           /api/games
			sessions.ts        /api/games/:gameId/sessions
			igdb.ts            /api/igdb
			shelf.ts           /shelf pages
			*.test.ts          Vitest route tests
		views/
			index.ejs
			auth.ejs
			shelf.ejs
			game-log.ejs
			partials/
	client/
		home.ts / home.scss
		auth.ts / auth.scss
		shelf.ts / shelf.scss
		game-log.ts / game-log.scss
		lib/               DOM-free helpers, unit-tested under Node
			api.ts           ApiError + the {error, fields} response shape
			format.ts        hour and date formatting
			shelfFilters.ts  filter state + the localStorage round-trip
			*.test.ts
		_tokens.scss
		shared.scss
		tsconfig.json
prisma/
	schema.prisma
	seed.ts
	migrations/
scripts/
	export-sql.ts
public/
generated/
	prisma/
```

`generated/prisma` is git-ignored and recreated by `prisma generate`.

## Requirements

- Node.js 20+ (Prisma 7 requires 20.19 or newer; `package.json` does not pin an `engines` range)
- npm 10+
- PostgreSQL database
- Bun, only if you run `npm run deploy` — the deploy script shells out to `bunx`

## Environment Variables

Create a `.env` file for local development.

See `.env.example` for the checked-in template.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
TWITCH_CLIENT_ID="your-twitch-app-client-id"
TWITCH_CLIENT_SECRET="your-twitch-app-client-secret"
BETTER_AUTH_SECRET="replace-with-long-random-secret"   # openssl rand -hex 32
BETTER_AUTH_URL="http://localhost:3000"
STAGE="development"
PORT="3000"
PRISMA_PROJECT_ID=""                                   # only needed for Prisma Compute deploys
```

Notes:

- `DATABASE_URL` is required by Prisma and the PG adapter. `schema.prisma` has no
  inline `datasource.url`; Prisma reads the variable through `prisma.config.ts`,
  and `src/server/lib/prisma.ts` passes it to the `pg` pool.
- With `npx prisma dev`, copy the `DATABASE_URL` it prints into `.env`. The local
  port can change between runs (for example `51214` vs `51218`), so update `.env`
  whenever Prisma Dev shows a different URL, then restart `npm run dev`.
- `BETTER_AUTH_URL` should be your public app URL in production.
- `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are required for IGDB API calls.
- `STAGE=development` tells the server to load static assets from the local development layout.
- `PORT` is optional and defaults to `3000`.

For deploys, this project also uses `deploy.env` with `dotenvx`.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from the template and fill in Twitch / Better Auth values:

```bash
cp .env.example .env
```

On Windows PowerShell: `Copy-Item .env.example .env`

3. Generate the Prisma client (`generated/prisma` is not checked in):

```bash
npx prisma generate
```

4. Start the local Prisma Postgres database (leave this terminal running):

```bash
npx prisma dev
```

Copy the printed `DATABASE_URL` into `.env`. Do not hardcode a port from docs or
another machine — use the URL Prisma Dev prints for this run.

5. In a second terminal, apply migrations:

```bash
npx prisma migrate deploy
```

6. Optional: load demo data for local development or SQL export:

```bash
npm run db:seed
```

7. Start the app (keep `npx prisma dev` running in the other terminal):

```bash
npm run dev
```

Open http://localhost:3000.

If login or queries fail with a connection error after restarting Prisma Dev,
compare `.env`’s `DATABASE_URL` to the URL in the Prisma Dev terminal and update
the port if it changed.

## Demo Account

Created by `npm run db:seed` for local development and SQL export samples:

| Field | Value |
| ----- | ----- |
| Email | `demo@gameshelf.dev` |
| Password | `demo-password` |
| Display name | Demo Player |

The login page shows these credentials in development (`STAGE=development`).
Source of truth: `src/server/lib/demoAccount.ts`.

## Scripts

- `npm run dev`: runs server watch + Sass watch + client esbuild watch
- `npm run dev:server`: runs Express server with `tsx watch`
- `npm run dev:css`: compiles SCSS from `src/client` to `dist/client/assets` in watch mode
- `npm run dev:js`: bundles client TS with esbuild in watch mode
- `npm run build`: `prisma generate` + full client and server builds
- `npm run build:client`: one-shot client SCSS + JS build
- `npm run build:server`: bundles server and copies views/public into `dist`
- `npm run typecheck`: runs TS type checks for server and client tsconfigs
- `npm run start`: runs the server once with `tsx`
- `npm run db:seed`: runs `prisma/seed.ts` to create the demo user, games, and sessions
- `npm run db:export`: runs `scripts/export-sql.ts` to write `gameshelf-data.sql`
- `npm run deploy`: deploys with `dotenvx` + `bunx @prisma/cli app deploy --db` using `deploy.env`
- `npm test`: runs the Vitest suite once; `npm run test:watch` for watch mode.
  The route tests hit a real database, so start one first (`npx prisma dev`).
  They create and delete their own `@gameshelf.test` users and rows.
  All 119 tests currently pass. The pure helper tests under `src/client/lib`
  and `gameRules.test.ts` run without a database; the route and auth suites
  need one.

## Known Issues

- **Prisma Dev can wedge under concurrent connections.** If a write fails with
  `25006 cannot execute INSERT in a read-only transaction`, every later query —
  including from brand-new connections — returns `25P02 current transaction is
  aborted` until Prisma Dev is restarted. The seed, export, and test commands
  each connect once and are unaffected; it shows up when the dev server's
  connection pool is running alongside them. Restart `prisma dev` to clear it.
- **Re-seed before the final SQL export.** Sessions logged through the UI stay
  in the dev database and would be swept into the next `npm run db:export`. Run
  `npm run db:seed` first so the export is the clean 6-game / 8-session set.

## Routes (Current)

### Page Routes

- `GET /`: home page (session-aware card UI); redirects to `/shelf` when signed in
- `GET /login`: auth page with Sign In tab; redirects to `/shelf` when signed in
- `GET /register`: auth page with Sign Up tab; redirects to `/shelf` when signed in
- `GET /shelf`: the game shelf — requires a session, otherwise redirects to `/login`
- `GET /shelf/games/:gameId/log`: play log for one owned game; an unknown or
  someone else's game redirects back to `/shelf`

### API Routes

- `ALL /api/auth/*splat`: Better Auth endpoints (sign up, sign in, sign out, session)
- `GET /api/me`: current session/user payload (or `null`)
  All `/api/games` routes require a session and only ever touch the signed-in user's
  rows; a request for someone else's game returns 404. Errors come back as
  `{ "error": "...", "fields": { ... } }`.

- `GET /api/games`: the user's games, filterable with `?status=BACKLOG` and
  `?archived=true|false|all` (archived rows are hidden by default), and
  orderable with `?sort=added|priority` (`priority` ranks HIGH → MEDIUM → LOW
  and puts unranked games last)
- `POST /api/games`: create a game — `userId` always comes from the session
- `PATCH /api/games/:id`: update `title`, `platform`, `status`, `priority`,
  `rating`, `coverUrl`, `notes`, or `archived`
- `DELETE /api/games/:id`: delete a game and, by cascade, its play sessions

All `/api/games/:gameId/sessions` routes require a session, verify the parent
game belongs to the caller, and scope session rows to that same user. Responses
serialize `hours` as a JSON number and `sessionDate` as `YYYY-MM-DD`.

- `GET /api/games/:gameId/sessions`: list sessions for an owned game plus
  `totalHours`
- `POST /api/games/:gameId/sessions`: log hours against an owned game
- `PATCH /api/games/:gameId/sessions/:sessionId`: update hours, date, or notes
- `DELETE /api/games/:gameId/sessions/:sessionId`: delete one session

### Business rules and status codes

`400` means the payload's shape is wrong, `401` no session, `404` the row does
not exist *or* belongs to another user, and `409` a well-formed request that
would break one of the wishlist rules in `src/server/lib/gameRules.ts`:

- a game with logged play sessions cannot move back to the wishlist
- play time cannot be logged against a wishlisted game

Rating is not restricted — a wishlisted game may carry a score.

Ownership is checked before the rules, so another user's game reports `404`
rather than revealing that a rule exists. The 409 messages are written for the
user and the client renders them verbatim.

The IGDB search route is also auth-gated, so it cannot be used as an open proxy
for the Twitch credentials:

- `GET /api/igdb/search?q=hades&limit=8`: title search against IGDB, returning
  `{ igdbId, title, coverUrl, releaseYear, platforms, genres, rating }` per hit.
  `limit` is optional (default 8, max 25). Requires `TWITCH_CLIENT_ID` and
  `TWITCH_CLIENT_SECRET`; if IGDB is down or misconfigured the route returns 503
  and the add-game form falls back to manual entry.

### Where the Fetch calls are (submission note)

Client-side `fetch()` calls, all in `src/client`:

| File | Endpoint | Purpose |
| ---- | -------- | ------- |
| `shelf.ts` | `GET /api/igdb/search?q=` | debounced IGDB type-ahead in the add-game form (external API) |
| `shelf.ts` | `GET /api/games?status=&archived=&sort=` | load the shelf for the current filter/sort view |
| `shelf.ts` | `POST /api/games`, `PATCH /api/games/:id`, `DELETE /api/games/:id` | add, edit, delete a game |
| `shelf.ts` | `POST /api/games/:gameId/sessions` | log a session from a shelf card |
| `game-log.ts` | `GET`/`POST /api/games/:gameId/sessions` | read and add sessions on the play log page |
| `game-log.ts` | `PATCH`/`DELETE /api/games/:gameId/sessions/:sessionId` | edit or delete one session from the play log |
| `home.ts` | `GET /api/me` | session-aware home card |
| `auth.ts` | `POST /api/auth/sign-in/email`, `POST /api/auth/sign-up/email` | sign in / sign up |
| `shelf.ts`, `game-log.ts`, `home.ts` | `POST /api/auth/sign-out` | sign out |

The external Web API is IGDB (via Twitch OAuth), called server-side from
`src/server/lib/igdb.ts` and exposed to the browser through `/api/igdb/search`.
The local Web APIs are `/api/games`, `/api/games/:gameId/sessions`, `/api/me`,
and the Better Auth endpoints.

## SQL Export (Submission Requirement)

The rubric requires database records exported in SQL format.

Run all commands from the `GameShelf` project folder.

1. Start the database: `npx prisma dev` (leave it running)
2. Seed demo data: `npm run db:seed`
3. Export SQL: **`npm run db:export`**

That writes `gameshelf-data.sql` in the project root. On Windows it finds
`pg_dump` automatically (even when it is not on PATH), e.g.
`C:\Program Files\PostgreSQL\18\bin\pg_dump.exe`.

### Documented `pg_dump` command

```bash
pg_dump "$DATABASE_URL" --schema=public --data-only --inserts --column-inserts -f gameshelf-data.sql
```

PowerShell (if `pg_dump` is on PATH):

```powershell
pg_dump $env:DATABASE_URL --schema=public --data-only --inserts --column-inserts -f gameshelf-data.sql
```

Or call the full path directly:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" $env:DATABASE_URL --schema=public --data-only --inserts --column-inserts -f gameshelf-data.sql
```

Notes:

- `--schema=public` exports only app tables (skips Prisma local internals).
- `--data-only` skips schema DDL because migrations already ship in
  `prisma/migrations/`.
- `--inserts --column-inserts` produces plain `INSERT` statements that restore
  cleanly into a database that already has the schema applied.
- `npm run db:export` also strips PostgreSQL 18-only dump directives so the
  file restores on PostgreSQL 16+.

### Verify restore into a clean database

Use a temporary Docker Postgres (does not touch your `prisma dev` database):

```powershell
docker run -d --name gameshelf-restore-test -e POSTGRES_PASSWORD=postgres -p 55432:5432 postgres:16
# wait until ready, then:
$env:DATABASE_URL = "postgres://postgres:postgres@localhost:55432/postgres?sslmode=disable"
npx prisma migrate deploy
docker cp gameshelf-data.sql gameshelf-restore-test:/tmp/gameshelf-data.sql
docker exec gameshelf-restore-test psql -U postgres -v ON_ERROR_STOP=1 -f /tmp/gameshelf-data.sql
@"
SELECT COUNT(*) AS games FROM "Game";
SELECT COUNT(*) AS sessions FROM "PlaySession";
"@ | Set-Content -Encoding ascii .\tmp-verify.sql
docker cp .\tmp-verify.sql gameshelf-restore-test:/tmp/tmp-verify.sql
docker exec gameshelf-restore-test psql -U postgres -f /tmp/tmp-verify.sql
Remove-Item .\tmp-verify.sql
docker rm -f gameshelf-restore-test
```

Expected counts after seed + restore: **6 games**, **8 play sessions**.

Include `gameshelf-data.sql` in the project zip submission alongside the code.

## Database Models (Current)

Game domain:

- `Game` — backlog and wishlist entries, owned by a `User` via `userId`
- `PlaySession` — hours logged against a `Game`
- Enums: `GameStatus` (`WISHLIST`, `BACKLOG`, `PLAYING`, `COMPLETED`, `DROPPED`)
  and `Priority` (`HIGH`, `MEDIUM`, `LOW`)

There is no separate wishlist table. A wishlisted game is a `Game` row with
`status = 'WISHLIST'`, optionally ranked with the nullable `priority` column.

Auth domain (Better Auth):

- `User`
- `Session`
- `Account`
- `Verification`

Models use Prisma's default naming, so the SQL tables and columns are
PascalCase/camelCase (`"Game"."coverUrl"`, not `games.cover_url`). Migrations
are in `prisma/migrations`; see `project-plan.md` for the full field-by-field
schema.

## Build and Runtime Notes

- Client assets are emitted to `dist/client/assets`.
- `build:server` also copies `src/server/views` to `dist/views` and `public` to `dist/public`.
- In development (`STAGE=development`), static files are loaded from project-root-relative paths.
- In production, static files are expected alongside the built output in `dist`.

## Deployment

This repo includes Prisma Compute config in `prisma.compute.ts` and deploy command wiring in `package.json`. The app is registered as `GameShelf` with the
`custom` framework strategy (so `dist/client` ships alongside the server bundle),
build command `npm run build`, output directory `dist`, entrypoint `server.mjs`,
and HTTP port 3000.

Deploy command:

```bash
npm run deploy
```

Before deploying, ensure your deployment environment provides:

- a valid database URL
- Better Auth secret and URL
- Prisma project/deploy configuration values used by your workspace

## Team

CyberOtters:

- Tim Shaker
- Glenn Bale Carreon
- Jack DePizzo
- Eric Tern
