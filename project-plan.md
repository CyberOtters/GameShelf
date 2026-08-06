**CyberOtters**  
Tim Shaker, Glenn Bale Carreon, Jack DePizzo, Eric Tern

---

## 1. Project Title

**GameShelf** — A Video Game Backlog Tracker

## 2. Current Project State (as implemented)

GameShelf is currently a **full-stack TypeScript app** using **Express + EJS + Prisma ORM + PostgreSQL**, with session auth powered by Better Auth.

### What is implemented now

- Express server in `src/server/index.ts`
- Server-rendered EJS pages for:
  - Home (`/`)
  - Auth entry (`/login` and `/register`)
- Client-side TypeScript bundles for:
  - Home session UI (`src/client/home.ts`)
  - Login/register tab + form handling (`src/client/auth.ts`)
- SCSS styling pipeline: `shared.scss`, `home.scss`, `auth.scss`, plus the
  `_tokens.scss` partial (imported, not emitted as its own CSS file)
- Better Auth integration with the built-in Prisma adapter
  (`prismaAdapter` from `better-auth/adapters/prisma`, wired in
  `src/server/lib/auth.ts`) and mounted auth endpoints (`/api/auth/*`)
- Email/password authentication enabled (`emailAndPassword.enabled`)
- Session introspection endpoint (`GET /api/me`)
- Prisma schema and migrations for the two core game tables:
  - `Game`
  - `PlaySession`
- Prisma schema and migration for auth tables:
  - `User`
  - `Session`
  - `Account`
  - `Verification`
- Enums for:
  - `GameStatus` (`WISHLIST`, `BACKLOG`, `PLAYING`, `COMPLETED`, `DROPPED`)
  - `Priority` (`HIGH`, `MEDIUM`, `LOW`)
- Wishlist is modeled as `GameStatus.WISHLIST` on `Game` (plus the nullable
  `priority` column) rather than as a separate table
- Working Prisma + Postgres connection via `pg` + `@prisma/adapter-pg`
- Auth-gated `Game` CRUD, all scoped to the signed-in user
  (`src/server/routes/games.ts`):
  - `requireAuth` middleware resolves the Better Auth session and 401s without
    one (`src/server/lib/requireAuth.ts`)
  - `GET /api/games` with `status` and `archived` filters, `POST`, `PATCH /:id`,
    `DELETE /:id`; another user's row reads as 404, never 403
  - zod request schemas (`src/server/lib/validateGame.ts`) and a centralized
    JSON error handler (`src/server/lib/errors.ts`)
- Build/deploy pipeline:
  - esbuild server/client bundling
  - Prisma generate on build
  - Prisma Compute deploy script (`npm run deploy`)

### What is not implemented yet

- Play session CRUD routes
- Wishlist workflows on top of `GameStatus.WISHLIST` / `priority`
- Auth-gated data ownership for `PlaySession` — `Game` routes are scoped to the
  session, play sessions have no routes yet
- Any UI beyond the home player card and the login/register forms
- Archive UI — `Game.archived` is readable and writable through the game routes,
  but nothing in the interface uses it yet
- RAWG API integration
- CheapShark API integration
- localStorage personalization
- Business rules beyond field validation (game writes are validated with zod;
  wishlist-specific rules are not written yet)
- Tests for anything beyond the `/api/games` routes (no client or auth tests)

## 3. Tech Stack (current)

- **Runtime/Language:** Node.js + TypeScript
- **Server:** Express 5
- **Templating:** EJS
- **ORM:** Prisma 7 (`prisma-client` generator output to `generated/prisma`)
- **Database:** PostgreSQL
- **DB Driver/Adapter:** `pg` + `@prisma/adapter-pg`
- **Auth:** Better Auth, using its built-in `better-auth/adapters/prisma`
  adapter. (`@better-auth/prisma-adapter` is listed in `dependencies` but is
  not imported anywhere; it can be dropped.)
- **Environment:** `dotenv` locally, `@dotenvx/dotenvx` for deploys. The
  `datasource` block in `schema.prisma` has no inline `url`; Prisma reads
  `DATABASE_URL` through `prisma.config.ts`.
- **Build Tooling:** esbuild + Sass + concurrently
- **Dev runner:** `tsx` (`npm run dev:server`)
- **Deployment:** Prisma Compute (`npm run deploy`)

## 4. Current Database Design (implemented)

The schema in `prisma/schema.prisma` and migrations
`prisma/migrations/20260726182943_init` +
`prisma/migrations/20260730003838_update_gamestatus_enum` implement the
following. No model uses `@@map`/`@map`, so table and column names are the
PascalCase/camelCase Prisma identifiers exactly as written below.

### `Game`

| Field    | Type              | Notes                                      |
| -------- | ----------------- | ------------------------------------------ |
| id       | SERIAL PK         | Prisma `Int @id @default(autoincrement())` |
| userId   | TEXT FK           | references `User(id)`, cascade delete      |
| title    | VARCHAR(100)      | required                                   |
| platform | VARCHAR(30)       | required                                   |
| priority | enum `Priority`   | nullable, no default                       |
| status   | enum `GameStatus` | default `BACKLOG`                          |
| archived | BOOLEAN           | default `false`                            |
| rating   | SMALLINT          | nullable                                   |
| coverUrl | VARCHAR(255)      | nullable                                   |
| addedAt  | TIMESTAMP(3)      | default current timestamp                  |
| notes    | VARCHAR(500)      | nullable                                   |

Wishlist entries live in this table: a wishlisted game is a `Game` row with
`status = 'WISHLIST'`, optionally ranked with `priority`. The original
`wishlist` boolean column was dropped by the second migration in favor of the
`WISHLIST` enum value.

### `PlaySession`

| Field       | Type         | Notes                                 |
| ----------- | ------------ | ------------------------------------- |
| id          | SERIAL PK    |                                       |
| gameId      | INTEGER FK   | references `Game(id)`, cascade delete |
| userId      | TEXT FK      | references `User(id)`, cascade delete |
| hours       | DECIMAL(4,1) | required                              |
| sessionDate | DATE         | required                              |
| notes       | TEXT         | nullable                              |

### Relationships

- `User` 1 -> many `Game` via `Game.userId` (cascade delete)
- `User` 1 -> many `PlaySession` via `PlaySession.userId` (cascade delete)
- `Game` 1 -> many `PlaySession` via `PlaySession.gameId` (cascade delete)
- `User` 1 -> many `Session` via `Session.userId` (cascade delete)
- `User` 1 -> many `Account` via `Account.userId` (cascade delete)

### Auth Tables (Better Auth)

#### `User`

| Field         | Type         | Notes                |
| ------------- | ------------ | -------------------- |
| id            | TEXT PK      | Better Auth user id  |
| name          | TEXT         | required             |
| email         | TEXT         | unique               |
| emailVerified | BOOLEAN      | default `false`      |
| image         | TEXT         | nullable             |
| createdAt     | TIMESTAMP(3) | default current time |
| updatedAt     | TIMESTAMP(3) | Prisma `@updatedAt`  |

#### `Session`

| Field     | Type         | Notes                         |
| --------- | ------------ | ----------------------------- |
| id        | TEXT PK      |                               |
| expiresAt | TIMESTAMP(3) | required                      |
| token     | TEXT         | unique                        |
| createdAt | TIMESTAMP(3) | default current time          |
| updatedAt | TIMESTAMP(3) | Prisma `@updatedAt`           |
| ipAddress | TEXT         | nullable                      |
| userAgent | TEXT         | nullable                      |
| userId    | TEXT FK      | references `User(id)` cascade |

#### `Account`

| Field                 | Type         | Notes                                  |
| --------------------- | ------------ | -------------------------------------- |
| id                    | TEXT PK      |                                        |
| accountId             | TEXT         | required                               |
| providerId            | TEXT         | required                               |
| userId                | TEXT FK      | references `User(id)` cascade          |
| accessToken           | TEXT         | nullable                               |
| refreshToken          | TEXT         | nullable                               |
| idToken               | TEXT         | nullable                               |
| accessTokenExpiresAt  | TIMESTAMP(3) | nullable                               |
| refreshTokenExpiresAt | TIMESTAMP(3) | nullable                               |
| scope                 | TEXT         | nullable                               |
| password              | TEXT         | nullable (email/password auth support) |
| createdAt             | TIMESTAMP(3) | default current time                   |
| updatedAt             | TIMESTAMP(3) | Prisma `@updatedAt`                    |

Unique index: (`providerId`, `accountId`)

#### `Verification`

| Field      | Type         | Notes                |
| ---------- | ------------ | -------------------- |
| id         | TEXT PK      |                      |
| identifier | TEXT         | required             |
| value      | TEXT         | required             |
| expiresAt  | TIMESTAMP(3) | required             |
| createdAt  | TIMESTAMP(3) | default current time |
| updatedAt  | TIMESTAMP(3) | Prisma `@updatedAt`  |

Unique index: (`identifier`, `value`)

## 5. Current Routes

| Method | Path               | Status      | Behavior                                           |
| ------ | ------------------ | ----------- | -------------------------------------------------- |
| GET    | `/`                | Implemented | renders `index.ejs` with home assets               |
| GET    | `/login`           | Implemented | renders `auth.ejs` with auth assets (login tab)    |
| GET    | `/register`        | Implemented | renders `auth.ejs` with auth assets (register tab) |
| ALL    | `/api/auth/*splat` | Implemented | Better Auth handler (sign-up/sign-in/sign-out etc) |
| GET    | `/api/me`          | Implemented | returns current session/user JSON (or null)        |
| GET    | `/api/games`       | Implemented | signed-in user's games; `?status=` and `?archived=true\|false\|all` filters |
| POST   | `/api/games`       | Implemented | creates a game owned by the session user (body `userId` ignored) |
| PATCH  | `/api/games/:id`   | Implemented | updates title/platform/status/priority/rating/notes/archived; 404 on another user's row |
| DELETE | `/api/games/:id`   | Implemented | deletes an owned game (cascades its play sessions); 404 otherwise |

## 6. Execution Commands (current)

- `npm run dev` — run server + Sass watch + esbuild watch concurrently
- `npm run dev:server` — run server with `tsx watch`
- `npm run dev:css` — watch SCSS into `dist/client/assets`
- `npm run dev:js` — watch client bundle with esbuild
- `npm run build` — `prisma generate` + client build + server build
- `npm run build:client` — build SCSS + client JS bundles
- `npm run build:server` — bundle server and copy views/public into `dist`
- `npm run typecheck` — TypeScript checks for server and client configs
- `npm run start` — run server once with `tsx`
- `npm run deploy` — deploy via `dotenvx run -f deploy.env -- bunx @prisma/cli app deploy --db`
- `npm test` — Vitest run of `src/server/**/*.test.ts`; needs a running database
- `npm run test:watch` — same suite in watch mode
- `npx prisma migrate deploy` — apply migrations to target database

## 7. Next Milestones

1. Add full CRUD routes for `Game` (backlog + wishlist, via `status`) and `PlaySession`
2. Add authenticated ownership flow so every game/session query is scoped to
   `session.user.id`, starting with `GET /api/games`
3. Add validation and centralized error handling for all write operations
4. Build authenticated UI workflows for managing backlog, sessions, and wishlist data
5. Integrate RAWG and CheapShark APIs
6. Add tests plus seed/sample data workflow

## 8. Open Gaps Against the Rubric

Tracked here so the final report is not the first place these surface:

- **Three form element types** — the app currently ships only text/email/password
  inputs. Needs at least one `select`, radio group, or checkbox (status,
  platform, priority, and `archived` are all natural fits).
- **Edit existing records with pre-filled data, 3+ fields** — `PATCH /api/games/:id`
  exists; the edit UI does not.
- **Two web APIs** — only local endpoints (`/api/me`, `/api/games`) exist today;
  RAWG and CheapShark are still unstarted.
- **Database records export** — submission requires a SQL export of real data;
  there is no seed or sample data yet.
- **Sessions/Web storage** — satisfied by Better Auth sessions.
- **50+ lines of client-side JS** — satisfied by `src/client/home.ts` and
  `src/client/auth.ts`.
- **External JS/CSS files** — satisfied; all scripts and styles are bundled to
  `dist/client/assets` and linked, with none inline in the EJS views.
