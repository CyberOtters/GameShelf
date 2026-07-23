# 🎮 Final Project Plan: GameShelf — Video Game Backlog Tracker

**Team X**
Tim [Last Name]
[Teammate 2]
[Teammate 3]
[Teammate 4]

---

## 1. Project Title

**GameShelf** — A Video Game Backlog Tracker

## 2. Project Description

GameShelf is a full-stack web application that solves a problem nearly every gamer has: buying games faster than they can play them. Digital sales and subscription services make it easy to accumulate a "backlog" of dozens of unplayed titles, and players lose track of what they own, what they've started, and what they actually finished. GameShelf gives users a single organized shelf where they can add games, track their status (Backlog, Playing, Completed, Dropped), log play sessions, rate finished games, and maintain a wishlist with live price-deal lookups.

The application will be built with **Node.js, Express, MySQL, and EJS templates**, with all JavaScript and CSS in external files. It integrates two external Web APIs, uses Web Storage for personalization, and supports full CRUD operations on a normalized database.

### User Stories

- As a gamer, I want to add games to my shelf with title, platform, and status so I can see everything I own in one place.
- As a user, I want to update a game's status and rating with a pre-filled edit form so tracking my progress is quick.
- As a user, I want to log play sessions (hours + notes) so I can see how much time I've invested in each game.
- As a user, I want to filter and sort my shelf by platform, status, or rating so I can decide what to play next.
- As a bargain hunter, I want my wishlist to show current deal prices so I know when to buy.
- As a returning visitor, I want the app to remember my last-used filter and sort order so I don't have to reset them every visit.

### ✅ How We Will Meet the Rubric Requirements

**Final Report Elements** — Our final report will include:

1. Project title and description
2. Task distribution
3. Description of AI use (e.g., Claude/ChatGPT for SQL query help, JS debugging, and layout planning)
4. Screenshots of the completed app
5. An ERD / database schema diagram
6. All files uploaded as a zip, including the database exported in SQL format

**Database: 3 Tables, 19 Fields Total** (exceeds the 10-field minimum — see Section 6 for details)

1. `games` — the user's main shelf (8 fields)
2. `play_sessions` — logged gaming sessions per game (5 fields)
3. `wishlist` — games the user wants to buy (6 fields)

**Form Elements (5 types — exceeds the 3 minimum):**

1. **Text input** — game title, session notes
2. **Select dropdown** — platform (PC, PS5, Switch, Xbox, etc.)
3. **Radio buttons** — game status (Backlog / Playing / Completed / Dropped)
4. **Checkboxes** — attributes (co-op, replayable, physical copy)
5. **Range slider** — rating (1–10)

**Web Storage:** We will use `localStorage` to remember the user's last-used platform filter and sort order (e.g., "sort by rating, PC games only") so the shelf loads personalized on return visits.

**Update Records with Pre-filled Forms:** The Edit Game page will load the selected game's current values into the form. Users can update at least three fields: **status, rating, and platform** (plus checkboxes/notes).

**Add Records:** Users can add games manually through the Add Game form, or search a title via the RAWG API and add it with cover art and metadata auto-filled.

**Client-side JavaScript (50+ lines, external file):**

1. Form validation (required title, rating range, no duplicate titles)
2. `fetch()` calls to the RAWG and CheapShark APIs
3. Reading/writing `localStorage` for filter and sort preferences
4. DOM manipulation to filter/sort the shelf without a page reload
5. Rendering fetched cover art and deal prices dynamically

**Two External Web APIs (fetch calls will be documented in the final report):**

1. **RAWG Video Games API** — game metadata: cover image, release year, genres, Metacritic score. Fetch call located in the Add Game page's external JS (search-as-you-type lookup).
2. **CheapShark API** — current best deal price for wishlist titles. Fetch call located in the Wishlist page's external JS (runs on page load for each wishlist item). No API key required.

**Professional and Consistent Design:** Dark "game library" theme built with Bootstrap plus a custom external stylesheet (50+ CSS rules) covering layout, card grids, hover effects, responsive breakpoints, and status color-coding. All pages share a common navbar and footer via EJS partials.

## 3. Target Audience

- 🎯 Gamers ages 16–35 who own games across multiple platforms and storefronts
- 🎯 Game Pass / PS Plus subscribers whose libraries grow faster than their free time
- 🎯 Completionists who want stats on hours played and finish rates
- 🎯 Budget-conscious players who wait for sales before buying wishlist titles

## 4. Proposed User Interface (Mockups)

_(Wireframes below will be recreated as polished mockups in Figma / hand-drawn sketches for submission.)_

**Screen 1 — Home / My Shelf**

```
+--------------------------------------------------------------+
| 🎮 GameShelf     [My Shelf] [Add Game] [Wishlist] [Stats]    |
+--------------------------------------------------------------+
| Filter: [Platform ▼] [Status ▼]      Sort: [Rating ▼]        |
+--------------------------------------------------------------+
|  +----------+   +----------+   +----------+   +----------+   |
|  | cover    |   | cover    |   | cover    |   | cover    |   |
|  | Hades    |   | Elden R. |   | Celeste  |   | GoW      |   |
|  | PC  9/10 |   | PS5  --  |   | Switch 8 |   | PS5 10   |   |
|  | PLAYING  |   | BACKLOG  |   | DONE ✓   |   | DONE ✓   |   |
|  | [Edit]   |   | [Edit]   |   | [Edit]   |   | [Edit]   |   |
|  +----------+   +----------+   +----------+   +----------+   |
+--------------------------------------------------------------+
```

**Screen 2 — Add Game (RAWG search + form)**

```
+--------------------------------------------------------------+
| Search RAWG: [ elden ring        ] [🔍]                      |
|  > Elden Ring (2022) — click to auto-fill                    |
+--------------------------------------------------------------+
| Title:    [ Elden Ring        ]  (text input)                |
| Platform: [ PS5 ▼ ]              (select)                    |
| Status:   (•) Backlog ( ) Playing ( ) Completed ( ) Dropped  |
| Rating:   [----------O--] 8/10   (range slider)              |
| Tags:     [x] Co-op  [ ] Replayable  [x] Physical copy       |
|                                   [ Add to Shelf ]           |
+--------------------------------------------------------------+
```

**Screen 3 — Edit Game (pre-filled)** — same form as Add, loaded with the game's current values; includes a Delete button and a "Log Session" section (hours, date, notes).

**Screen 4 — Wishlist**

```
+--------------------------------------------------------------+
| Wishlist                                                     |
| Hollow Knight: Silksong | Priority: High | Deal: $14.99 🔥   |
| Baldur's Gate 3         | Priority: Med  | Deal: $47.99      |
| [ + Add wishlist item ]                                      |
+--------------------------------------------------------------+
```

## 5. Proposed Workload Distribution

| Team Member      | Responsibilities                                                                                                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tim**          | **Backend/Routes Lead** — develops Express routes for full CRUD on games and sessions, implements the RAWG API integration server-side helpers, and connects routes to the MySQL database.                                        |
| **[Teammate 2]** | **Database Lead** — designs the schema and ERD, writes table creation and seed insert statements, exports the final `.sql` file, and codes at least two backend query functions (e.g., stats aggregation).                        |
| **[Teammate 3]** | **JavaScript/Frontend Lead** — writes the external client-side JS: validation, `fetch()` calls to RAWG and CheapShark, `localStorage` handling, and DOM filtering/sorting. Also codes at least one backend route (wishlist CRUD). |
| **[Teammate 4]** | **UI/Integration Lead** — builds EJS views and partials, applies Bootstrap + custom CSS (50+ rules), ensures responsive design and consistent theming, and codes at least one backend route (play session logging).               |

All team members will write and test code, contribute at least one core backend function, and collaborate on debugging, QA, and the final report.

**Team Status:** Our team is communicating regularly and has divided responsibilities clearly. If any issues arise (e.g., an unresponsive member), we will contact the instructor promptly.

## 6. Proposed Database Tables

**Total fields: 19** ✔️ (minimum required: 10)

**`games`** — the user's main shelf (8 fields)
| Field | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| user_name | VARCHAR(50) | owner of the entry |
| title | VARCHAR(100) | game title |
| platform | VARCHAR(30) | PC, PS5, Switch, etc. |
| status | ENUM | backlog / playing / completed / dropped |
| rating | TINYINT | 1–10, nullable until completed |
| cover_url | VARCHAR(255) | from RAWG API |
| added_at | DATETIME | default NOW() |

**`play_sessions`** — logged sessions (5 fields)
| Field | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| game_id | INT FK → games.id | |
| hours | DECIMAL(4,1) | session length |
| session_date | DATE | |
| notes | TEXT | optional |

**`wishlist`** — games to buy (6 fields)
| Field | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| user_name | VARCHAR(50) | |
| title | VARCHAR(100) | |
| priority | ENUM | high / medium / low |
| price_limit | DECIMAL(6,2) | buy when deal is below this |
| saved_at | DATETIME | default NOW() |

**Relationships:** `games` 1—many `play_sessions` (via `game_id` FK). `wishlist` is independent but keyed by `user_name` like `games`.
