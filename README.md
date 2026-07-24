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
- Auth-gated ownership flows for game and wishlist records
- External API integrations (RAWG, CheapShark)
- Automated tests

## Tech Stack

- Node.js + TypeScript
- Express 5
- EJS templates
- Prisma ORM 7 (`prisma-client` generator to `generated/prisma`)
- PostgreSQL + `pg` + `@prisma/adapter-pg`
- Better Auth + `@better-auth/prisma-adapter`
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
		shared.scss
		home.scss
		auth.scss
prisma/
	schema.prisma
	migrations/
generated/
	prisma/
```

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL database

## Environment Variables

Create a `.env` file for local development.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
BETTER_AUTH_SECRET="replace-with-long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
STAGE="development"
PORT="3000"
```

Notes:

- `DATABASE_URL` is required by Prisma and the PG adapter.
- `BETTER_AUTH_URL` should be your public app URL in production.
- `STAGE=development` tells the server to load static assets from the local development layout.

For deploys, this project also uses `deploy.env` with `dotenvx`.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Apply migrations:

```bash
npx prisma migrate deploy
```

3. Generate Prisma client:

```bash
npx prisma generate
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
- `npm run start`: runs the server once
- `npm run deploy`: deploys with Prisma CLI using `deploy.env`

## Routes (Current)

### Page Routes

- `GET /`: home page (session-aware card UI)
- `GET /login`: auth page with Sign In tab
- `GET /register`: auth page with Sign Up tab

### API Routes

- `ALL /api/auth/*splat`: Better Auth endpoints (sign up, sign in, sign out, session)
- `GET /api/me`: current session/user payload (or `null`)
- `GET /games`: returns all records from `games`

## Database Models (Current)

Game domain:

- `Game`
- `PlaySession`
- `WishlistItem`
- Enums: `GameStatus`, `Priority`

Auth domain (Better Auth):

- `User`
- `Session`
- `Account`
- `Verification`

Migrations are in `prisma/migrations`.

## Build and Runtime Notes

- Client assets are emitted to `dist/client/assets`.
- `build:server` also copies `src/server/views` to `dist/views` and `public` to `dist/public`.
- In development (`STAGE=development`), static files are loaded from project-root-relative paths.
- In production, static files are expected alongside the built output in `dist`.

## Deployment

This repo includes Prisma Compute config in `prisma.compute.ts` and deploy command wiring in `package.json`.

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
