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
- Auth-gated `PlaySession` CRUD nested under `/api/games/:id/sessions`
- Shelf UI for managing games and logging play sessions with total hours
- Demo seed script (`npm run db:seed`) and SQL export workflow
- Build pipeline for server, client JS, and SCSS assets
- Prisma Compute deployment configuration

- Play session CRUD scoped to the signed-in user (`/api/sessions`)
- IGDB game search endpoint (`/api/igdb/search`), server-side via the
  Twitch-authenticated helper in `src/server/lib/igdb.ts`

Still in progress:

- External API integration (IGDB)
- Test coverage beyond the `/api/games` and `/api/games/:id/sessions` route tests

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
			auth.ts
			prisma.ts
		views/
			index.ejs
			auth.ejs
			partials/
	client/
		home.ts
		auth.ts
		_tokens.scss
		shared.scss
		home.scss
		auth.scss
		tsconfig.json
prisma/
	schema.prisma
	migrations/
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
- `npm run deploy`: deploys with `dotenvx` + `bunx @prisma/cli app deploy --db` using `deploy.env`
- `npm test`: runs the Vitest suite once; `npm run test:watch` for watch mode.
  The route tests hit a real database, so start one first (`npx prisma dev`).
  They create and delete their own `@gameshelf.test` users and rows.

## Routes (Current)

### Page Routes

- `GET /`: home page (session-aware card UI)
- `GET /login`: auth page with Sign In tab
- `GET /register`: auth page with Sign Up tab

### API Routes

- `ALL /api/auth/*splat`: Better Auth endpoints (sign up, sign in, sign out, session)
- `GET /api/me`: current session/user payload (or `null`)
  All `/api/games` routes require a session and only ever touch the signed-in user's
  rows; a request for someone else's game returns 404. Errors come back as
  `{ "error": "...", "fields": { ... } }`.

- `GET /api/games`: the user's games, filterable with `?status=BACKLOG` and
  `?archived=true|false|all` (archived rows are hidden by default)
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
