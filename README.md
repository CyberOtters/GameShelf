# GameShelf

GameShelf is a full-stack TypeScript app for tracking a video game backlog. It uses Express + EJS for the web app, Prisma ORM + PostgreSQL for persistence, and Better Auth for email/password authentication.

## Current Status

Implemented today:

- Server-rendered app shell and auth pages
- Better Auth integration with Prisma adapter
- Session-aware home screen (`/api/me`)
- Prisma models and migrations for game data and auth tables
- Build pipeline for server, client JS, and SCSS assets
- Prisma Compute deployment configuration

Still in progress:

- CRUD beyond `GET /games`
- Auth-gated ownership flows — no data route checks the session yet, so
  `GET /games` returns every user's rows
- Any UI beyond the home player card and the login/register forms
- External API integrations (RAWG, CheapShark)
- Automated tests (`npm test` is still the npm placeholder and exits 1)

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
- `BETTER_AUTH_URL` should be your public app URL in production.
- `STAGE=development` tells the server to load static assets from the local development layout.
- `PORT` is optional and defaults to `3000`.

For deploys, this project also uses `deploy.env` with `dotenvx`.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Generate the Prisma client (`generated/prisma` is not checked in):

```bash
npx prisma generate
```

3. Apply migrations:

```bash
npx prisma migrate deploy
```

4. Start local development:

```bash
npm run dev
```

Open http://localhost:3000.

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
- `npm run deploy`: deploys with `dotenvx` + `bunx @prisma/cli app deploy --db` using `deploy.env`
- `npm test`: not implemented — still the npm placeholder that exits 1

## Routes (Current)

### Page Routes

- `GET /`: home page (session-aware card UI)
- `GET /login`: auth page with Sign In tab
- `GET /register`: auth page with Sign Up tab

### API Routes

- `ALL /api/auth/*splat`: Better Auth endpoints (sign up, sign in, sign out, session)
- `GET /api/me`: current session/user payload (or `null`)
- `GET /games`: returns all rows from the `Game` table (not yet scoped to the signed-in user)

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
