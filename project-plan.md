**CyberOtters**  
Tim Shaker, Glenn Bale Carreon, Jack DePizzo, Eric Tern

---

## 1. Project Title

**GameShelf** — A Video Game Backlog Tracker

## 2. Current Project State (as implemented)

GameShelf is currently a **backend-first TypeScript app** using **Express + Prisma ORM + PostgreSQL**.

### What is implemented now

- Express server in `src/server.ts`
- Prisma schema and migration for the three core tables:
  - `games`
  - `play_sessions`
  - `wishlist`
- Enums for:
  - `GameStatus` (`BACKLOG`, `PLAYING`, `COMPLETED`, `DROPPED`)
  - `Priority` (`HIGH`, `MEDIUM`, `LOW`)
- Working Prisma + Postgres connection via `@prisma/adapter-pg`
- Basic routes:
  - `GET /` returns a text health response
  - `GET /games` returns `prisma.game.findMany()` JSON

### What is not implemented yet

- Frontend UI (no EJS/React pages yet)
- Game CRUD routes beyond `GET /games`
- Play session CRUD routes
- Wishlist CRUD routes
- RAWG API integration
- CheapShark API integration
- localStorage personalization
- Validation/business rules
- Automated tests

## 3. Tech Stack (current)

- **Runtime/Language:** Node.js + TypeScript
- **Server:** Express 5
- **ORM:** Prisma 7 (`prisma-client` generator output to `generated/prisma`)
- **Database:** PostgreSQL
- **DB Driver/Adapter:** `pg` + `@prisma/adapter-pg`
- **Environment:** `dotenv`
- **Dev runner:** `tsx`
- **Deployment script:** Prisma app deploy (`npm run deploy:prod`)

## 4. Current Database Design (implemented)

The schema in `prisma/schema.prisma` and migration `prisma/migrations/20260723041044_init` implement:

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

## 5. Current Routes

| Method | Path     | Status      | Behavior                                     |
| ------ | -------- | ----------- | -------------------------------------------- |
| GET    | `/`      | Implemented | returns `"🎮 Hello World from GameShelf!!!"` |
| GET    | `/games` | Implemented | returns all rows from `games` as JSON        |

## 6. Execution Commands (current)

- `npm run dev` — run server with watch mode
- `npm run start` — run server once
- `npm run deploy:prod` — deploy via Prisma CLI

## 7. Next Milestones

1. Add full CRUD routes for `games`, `play_sessions`, and `wishlist`
2. Add validation and error handling for inputs
3. Add frontend experience (or API documentation) for user workflows
4. Integrate RAWG and CheapShark APIs
5. Add tests and seed/sample data workflow
