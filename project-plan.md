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
  - Shelf (`/shelf`) and per-game play log (`/shelf/games/:gameId/log`), both
    behind `requirePageAuth` (`src/server/lib/pageAuth.ts`); signed-in visitors
    to `/`, `/login`, and `/register` are redirected to `/shelf`
- Client-side TypeScript bundles for:
  - Home session UI (`src/client/home.ts`)
  - Login/register tab + form handling (`src/client/auth.ts`)
  - Shelf grid, add/edit dialog, IGDB type-ahead, and session logging
    (`src/client/shelf.ts`)
  - Play log page (`src/client/game-log.ts`)
- SCSS styling pipeline: `shared.scss`, `home.scss`, `auth.scss`, `shelf.scss`,
  `game-log.scss`, plus the `_tokens.scss` partial (imported, not emitted as its
  own CSS file)
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
- `coverUrl` is writable through the game routes (https-only, ≤255 chars), so
  IGDB search results can be saved with their cover art
- Auth-gated `PlaySession` CRUD, scoped to the signed-in user and nested under
  the parent game (`src/server/routes/sessions.ts`, schemas in
  `src/server/lib/validateSession.ts`):
  - `GET /api/games/:gameId/sessions` — newest session date first, plus a
    `totalHours` sum; the parent game must belong to the caller (a foreign
    game 404s)
  - `POST /api/games/:gameId/sessions` — `gameId` and `userId` both come from
    the route and session, never from the body
  - `PATCH /api/games/:gameId/sessions/:sessionId` updates
    `hours`/`sessionDate`/`notes`;
    `DELETE /api/games/:gameId/sessions/:sessionId` removes one session
  - `hours` serializes as a JSON number and `sessionDate` as `YYYY-MM-DD`;
    `GET /api/games` embeds the same serialized sessions per game
- IGDB search endpoint `GET /api/igdb/search?q=` (`src/server/routes/igdb.ts`)
  on top of the `src/server/lib/igdb.ts` helper — auth-gated so it is not an
  open proxy for the Twitch credentials, returns
  `{ igdbId, title, coverUrl, releaseYear, platforms, genres, rating }` with
  `coverUrl` sized (`t_cover_big`) and https-prefixed to fit `Game.coverUrl`
- Shelf UI (`src/client/shelf.ts` + `src/server/views/shelf.ejs`):
  - card grid with cover art, status pill, priority pill, rating, archived tag,
    total hours, and the most recent session
  - add/edit dialog sharing one form — editing pre-fills title, platform,
    status, priority, rating, archived, notes, and cover
  - debounced IGDB type-ahead on the title field that fills title, platform,
    rating, and cover art from the selected result
  - per-card "Log Session" dialog and delete with confirmation
- Shelf filter bar (`src/client/lib/shelfFilters.ts` + `shelf.ejs`): status,
  archived, and sort selects driving `GET /api/games`, with a live result count
  and a Reset button. `status=WISHLIST` is the wishlist view; `sort=priority`
  ranks HIGH → MEDIUM → LOW with unranked games last
- **localStorage personalization**: the chosen filter/sort combination is
  persisted under `gameshelf:shelf-filters` and restored on load, so a preferred
  view survives reloads and return visits. Stored values are re-validated on
  read, and every storage call is guarded — a browser that blocks localStorage
  still gets a working shelf on the defaults
- Play log UI (`src/client/game-log.ts` + `game-log.ejs`): per-game session
  history with a total-hours summary, a log-session dialog, and per-entry Edit
  (pre-filled hours/date/notes → `PATCH`) and Delete (confirm → `DELETE`)
- Wishlist business rules (`src/server/lib/gameRules.ts`), enforced on every
  write and surfaced in the UI:
  - a game with logged play sessions cannot move back to the wishlist
  - play time cannot be logged against a wishlisted game (the shelf hides the
    Log Session button for those cards, and the play log hides it too)
  - violations answer `409` with a message written for the user, which the
    client shows verbatim
  - rating is deliberately _not_ restricted: a wishlisted game may carry a
    score, so you can rank something you have played on someone else's console
    or are re-buying
- Seed and export workflow: `npm run db:seed` creates the demo user, 6 games,
  and 8 play sessions (fetching real IGDB covers when Twitch credentials are
  present); `npm run db:export` writes `gameshelf-data.sql`
- Build/deploy pipeline:
  - esbuild server/client bundling
  - Prisma generate on build
  - Prisma Compute deploy script (`npm run deploy`)

### Test coverage

119 tests across 7 files (`npm test`; the route tests need a running database).

| File                                  | Covers                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/server/routes/games.test.ts`     | `/api/games` CRUD, ownership scoping, filters, priority sort, wishlist rules            |
| `src/server/routes/sessions.test.ts`  | nested session CRUD, ownership, the wishlist write guard                                |
| `src/server/routes/igdb.test.ts`      | IGDB route auth and query validation (not the live call)                                |
| `src/server/lib/gameRules.test.ts`    | every business rule and the patch-merge logic, as pure units                            |
| `src/server/lib/pageAuth.test.ts`     | `requirePageAuth`, `redirectToShelfIfSignedIn`, `requireAuth` against real sessions     |
| `src/client/lib/shelfFilters.test.ts` | filter normalization, query building, the localStorage round-trip and its failure modes |
| `src/client/lib/format.test.ts`       | hour and date formatting, including the local-vs-UTC date boundary                      |

### What is not implemented yet

Everything previously listed here has been built. What remains is deliberately
out of scope for this project:

- No client tests that drive the DOM — the browser-facing code keeps its logic
  in `src/client/lib`, which is unit-tested directly, so the suite needs no
  jsdom/happy-dom dependency. `shelf.ts` and `game-log.ts` are verified by hand.
- No test of the live IGDB call, which would need Twitch credentials in CI and
  would spend rate limit on every run.

## 3. Tech Stack (current)

- **Runtime/Language:** Node.js + TypeScript
- **Server:** Express 5
- **Templating:** EJS
- **ORM:** Prisma 7 (`prisma-client` generator output to `generated/prisma`)
- **Database:** PostgreSQL
- **DB Driver/Adapter:** `pg` + `@prisma/adapter-pg`
- **Auth:** Better Auth, using its built-in `better-auth/adapters/prisma`
  adapter. (`@better-auth/prisma-adapter` is in `dependencies` and no source
  file imports it directly, but `better-auth/adapters/prisma` resolves into it
  at runtime — it shows up in Better Auth stack traces — so it is a real
  dependency and should not be dropped.)
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

| Method | Path                                     | Status      | Behavior                                                                                                                           |
| ------ | ---------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/`                                      | Implemented | renders `index.ejs`; redirects to `/shelf` when signed in                                                                          |
| GET    | `/login`                                 | Implemented | renders `auth.ejs` with auth assets (login tab); redirects to `/shelf` when signed in                                              |
| GET    | `/register`                              | Implemented | renders `auth.ejs` with auth assets (register tab); redirects to `/shelf` when signed in                                           |
| GET    | `/shelf`                                 | Implemented | renders `shelf.ejs`; redirects to `/login` without a session                                                                       |
| GET    | `/shelf/games/:gameId/log`               | Implemented | renders `game-log.ejs` for an owned game; redirects to `/shelf` otherwise                                                          |
| ALL    | `/api/auth/*splat`                       | Implemented | Better Auth handler (sign-up/sign-in/sign-out etc)                                                                                 |
| GET    | `/api/me`                                | Implemented | returns current session/user JSON; 401 without a session                                                                           |
| GET    | `/api/games`                             | Implemented | signed-in user's games with embedded sessions and `totalHours`; `?status=`, `?archived=true\|false\|all`, `?sort=added\|priority`  |
| POST   | `/api/games`                             | Implemented | creates a game owned by the session user (body `userId` ignored)                                                                   |
| PATCH  | `/api/games/:id`                         | Implemented | updates title/platform/status/priority/rating/coverUrl/notes/archived; 404 on another user's row, 409 on a wishlist-rule violation |
| DELETE | `/api/games/:id`                         | Implemented | deletes an owned game (cascades its play sessions); 404 otherwise                                                                  |
| GET    | `/api/games/:gameId/sessions`            | Implemented | sessions for an owned game, newest first, plus `totalHours`; foreign game 404s                                                     |
| POST   | `/api/games/:gameId/sessions`            | Implemented | logs a session against an owned game; `gameId`/`userId` come from route + session; 409 if the game is wishlisted                   |
| PATCH  | `/api/games/:gameId/sessions/:sessionId` | Implemented | updates hours/sessionDate/notes; 404 on another user's row                                                                         |
| DELETE | `/api/games/:gameId/sessions/:sessionId` | Implemented | deletes an owned session (game stays); 404 otherwise                                                                               |
| GET    | `/api/igdb/search`                       | Implemented | auth-gated IGDB title search (`?q=`, optional `?limit=`); needs `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET`                          |

**Status codes.** `400` means the payload's shape is wrong (validation), `401`
no session, `404` the row does not exist _or_ belongs to someone else, and `409`
a well-formed request that would break one of the wishlist rules in
`src/server/lib/gameRules.ts`. Ownership is always checked before the rules, so
another user's game reports `404` rather than leaking that a rule exists.

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
- `npm run db:seed` — seed the demo user, games, and play sessions
- `npm run db:export` — write `gameshelf-data.sql` from the current database
- `npm run deploy` — deploy via `dotenvx run -f deploy.env -- bunx @prisma/cli app deploy --db`
- `npm test` — Vitest run of `src/server/**/*.test.ts`; needs a running database
- `npm run test:watch` — same suite in watch mode
- `npx prisma migrate deploy` — apply migrations to target database

## Rubric Completion

Verified against the code and a running instance on 2026-08-11.

### Minimum requirements

- **Final Report** to be included with submission.
- **Three tables, 10+ fields combined** — satisfied. Six tables (`Game`,
  `PlaySession`, `User`, `Session`, `Account`, `Verification`), 11 fields on
  `Game` alone.
- **External JS and CSS files** — satisfied. All scripts and styles are bundled
  to `dist/client/assets` and linked from `partials/header.ejs`; no inline
  `<script>` bodies or `style=` attributes anywhere in the views.
- **Zip including SQL export** — `gameshelf-data.sql` is checked in
  (1 user, 1 account, 1 session, 6 games, 8 play sessions) and regenerated by
  `npm run db:export`. Remember to include it in the submitted zip.

### Feature requirements

- **Three form element types (15pts)** — satisfied, seven types in use:
  text (`title`), `select` (`platform`, `status`, plus the three filter-bar
  selects), radio (`priority`), checkbox (`archived`), `textarea` (`notes`),
  number (`rating`, `hours`), and date (`sessionDate`).
- **Web storage or Sessions (15pts)** — satisfied twice over: Better Auth cookie
  sessions backed by the `Session` table, _and_ `localStorage` personalization
  that remembers the shelf's filter/sort view
  (`src/client/lib/shelfFilters.ts`, key `gameshelf:shelf-filters`).
- **Update records, pre-filled, 3+ fields (15pts)** — satisfied twice. The shelf
  edit dialog (`openEditGameForm` in `src/client/shelf.ts`) pre-fills all seven
  editable fields and `PATCH`es `/api/games/:id`; the play log's edit dialog
  (`openEditSessionForm` in `src/client/game-log.ts`) pre-fills hours, date, and
  notes and `PATCH`es the session.
- **Add records (15pts)** — satisfied. `POST /api/games` from the add dialog and
  `POST /api/games/:gameId/sessions` from both the shelf and the play log.
- **50+ lines of client-side JS (15pts)** — satisfied, ~1,300 lines across
  `shelf.ts` (751), `game-log.ts` (257), `auth.ts` (77), `home.ts` (62), and the
  shared helpers in `src/client/lib` (169).
- **Two Web APIs (15pts)** — satisfied. Local: `/api/games`,
  `/api/games/:gameId/sessions`, `/api/me`, `/api/auth/*`. External: IGDB via
  `/api/igdb/search`. The README lists every Fetch call and its location.
- **Professional design, 50+ CSS properties (10pts)** — satisfied on the count
  (78 distinct properties across the SCSS files). All checked-in copy (views,
  seed notes, client strings) reads cleanly; a final proofread of the report
  itself is still worth doing.
