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
- SCSS styling pipeline for shared, home, and auth styles
- Better Auth integration with Prisma adapter (`src/server/lib/auth.ts`) and mounted auth endpoints (`/api/auth/*`)
- Session introspection endpoint (`GET /api/me`)
- Prisma schema and migrations for the three core game tables:
  - `games`
  - `play_sessions`
  - `wishlist`
- Prisma schema and migration for auth tables:
  - `user`
  - `session`
  - `account`
  - `verification`
- Enums for:
  - `GameStatus` (`BACKLOG`, `PLAYING`, `COMPLETED`, `DROPPED`)
  - `Priority` (`HIGH`, `MEDIUM`, `LOW`)
- Working Prisma + Postgres connection via `@prisma/adapter-pg`
- Basic data route:
  - `GET /games` returns `prisma.game.findMany()` JSON
- Build/deploy pipeline:
  - esbuild server/client bundling
  - Prisma generate on build
  - Prisma Compute deploy script (`npm run deploy`)

### What is not implemented yet

- Game CRUD routes beyond `GET /games`
- Play session CRUD routes
- Wishlist CRUD routes
- Auth-gated data ownership and per-user game/wishlist workflows
- RAWG API integration
- CheapShark API integration
- localStorage personalization
- Robust validation/business rules for game and wishlist inputs
- Automated tests

## 3. Tech Stack (current)

- **Runtime/Language:** Node.js + TypeScript
- **Server:** Express 5
- **Templating:** EJS
- **ORM:** Prisma 7 (`prisma-client` generator output to `generated/prisma`)
- **Database:** PostgreSQL
- **DB Driver/Adapter:** `pg` + `@prisma/adapter-pg`
- **Auth:** Better Auth + `@better-auth/prisma-adapter`
- **Environment:** `dotenv`
- **Build Tooling:** esbuild + Sass + concurrently
- **Dev runner:** `tsx` (`npm run dev:server`)
- **Deployment:** Prisma Compute (`npm run deploy`)

## 4. Current Database Design (implemented)

The schema in `prisma/schema.prisma` and migrations
`prisma/migrations/20260723041044_init` +
`prisma/migrations/20260723060100_add_better_auth` implement:

### `games`

| Field     | Type              | Notes                                      |
| --------- | ----------------- | ------------------------------------------ |
| id        | SERIAL PK         | Prisma `Int @id @default(autoincrement())` |
| user_name | VARCHAR(50)       | required                                   |
| title     | VARCHAR(100)      | required                                   |
| platform  | VARCHAR(30)       | required                                   |
| status    | enum `GameStatus` | default `BACKLOG`                          |
| rating    | SMALLINT          | nullable                                   |
| cover_url | VARCHAR(255)      | nullable                                   |
| added_at  | TIMESTAMP         | default current timestamp                  |

### `play_sessions`

| Field        | Type         | Notes                  |
| ------------ | ------------ | ---------------------- |
| id           | SERIAL PK    |                        |
| game_id      | INTEGER FK   | references `games(id)` |
| hours        | DECIMAL(4,1) | required               |
| session_date | DATE         | required               |
| notes        | TEXT         | nullable               |

### `wishlist`

| Field       | Type            | Notes                     |
| ----------- | --------------- | ------------------------- |
| id          | SERIAL PK       |                           |
| user_name   | VARCHAR(50)     | required                  |
| title       | VARCHAR(100)    | required                  |
| priority    | enum `Priority` | default `MEDIUM`          |
| price_limit | DECIMAL(6,2)    | nullable                  |
| saved_at    | TIMESTAMP       | default current timestamp |

### Relationship

- `games` 1 -> many `play_sessions` via `play_sessions.game_id`
- Cascade delete configured from game to play sessions
- `user` 1 -> many `session` via `session.user_id` (cascade delete)
- `user` 1 -> many `account` via `account.user_id` (cascade delete)

### Auth Tables (Better Auth)

#### `user`

| Field          | Type      | Notes                |
| -------------- | --------- | -------------------- |
| id             | TEXT PK   | Better Auth user id  |
| name           | TEXT      | required             |
| email          | TEXT      | unique               |
| email_verified | BOOLEAN   | default `false`      |
| image          | TEXT      | nullable             |
| created_at     | TIMESTAMP | default current time |
| updated_at     | TIMESTAMP | updated timestamp    |

#### `session`

| Field      | Type      | Notes                         |
| ---------- | --------- | ----------------------------- |
| id         | TEXT PK   |                               |
| expires_at | TIMESTAMP | required                      |
| token      | TEXT      | unique                        |
| created_at | TIMESTAMP | default current time          |
| updated_at | TIMESTAMP | updated timestamp             |
| ip_address | TEXT      | nullable                      |
| user_agent | TEXT      | nullable                      |
| user_id    | TEXT FK   | references `user(id)` cascade |

#### `account`

| Field                    | Type      | Notes                                  |
| ------------------------ | --------- | -------------------------------------- |
| id                       | TEXT PK   |                                        |
| account_id               | TEXT      | required                               |
| provider_id              | TEXT      | required                               |
| user_id                  | TEXT FK   | references `user(id)` cascade          |
| access_token             | TEXT      | nullable                               |
| refresh_token            | TEXT      | nullable                               |
| id_token                 | TEXT      | nullable                               |
| access_token_expires_at  | TIMESTAMP | nullable                               |
| refresh_token_expires_at | TIMESTAMP | nullable                               |
| scope                    | TEXT      | nullable                               |
| password                 | TEXT      | nullable (email/password auth support) |
| created_at               | TIMESTAMP | default current time                   |
| updated_at               | TIMESTAMP | updated timestamp                      |

Unique index: (`provider_id`, `account_id`)

#### `verification`

| Field      | Type      | Notes                |
| ---------- | --------- | -------------------- |
| id         | TEXT PK   |                      |
| identifier | TEXT      | required             |
| value      | TEXT      | required             |
| expires_at | TIMESTAMP | required             |
| created_at | TIMESTAMP | default current time |
| updated_at | TIMESTAMP | updated timestamp    |

Unique index: (`identifier`, `value`)

## 5. Current Routes

| Method | Path               | Status      | Behavior                                           |
| ------ | ------------------ | ----------- | -------------------------------------------------- |
| GET    | `/`                | Implemented | renders `index.ejs` with home assets               |
| GET    | `/login`           | Implemented | renders `auth.ejs` with auth assets (login tab)    |
| GET    | `/register`        | Implemented | renders `auth.ejs` with auth assets (register tab) |
| ALL    | `/api/auth/*splat` | Implemented | Better Auth handler (sign-up/sign-in/sign-out etc) |
| GET    | `/api/me`          | Implemented | returns current session/user JSON (or null)        |
| GET    | `/games`           | Implemented | returns all rows from `games` as JSON              |

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
- `npm run deploy` — deploy app via Prisma CLI using `deploy.env`
- `npx prisma migrate deploy` — apply migrations to target database

## 7. Next Milestones

1. Add full CRUD routes for `games`, `play_sessions`, and `wishlist`
2. Add authenticated ownership flow so game/wishlist records are tied to signed-in users
3. Add validation and centralized error handling for all write operations
4. Build authenticated UI workflows for managing backlog, sessions, and wishlist data
5. Integrate RAWG and CheapShark APIs
6. Add tests plus seed/sample data workflow
