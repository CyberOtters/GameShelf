# GameShelf Design System

GameShelf is a fun, engaging videogame backlog tracker — a full-stack TypeScript app (Express + EJS + Prisma/PostgreSQL, Better Auth) built by a four-person team (CyberOtters: Tim Shaker, Glenn Bale Carreon, Jack DePizzo, Eric Tern) as a class project. It's early-stage: only the home (session) screen and the sign-in/sign-up screen are implemented upstream today; game/wishlist CRUD and RAWG/CheapShark API integrations are still on the roadmap.

**Source:** [github.com/CyberOtters/GameShelf](https://github.com/CyberOtters/GameShelf) (branch `main`). Explore it directly for the freshest routes, schema, and styling — this system was built by reading `src/client/*.scss`, `src/client/*.ts`, `prisma`-derived `project-plan.md`, and `README.md` at commit `49ca2e5`. See `github.md` for the sync record.

## Index

- `styles.css` — root stylesheet, imports everything in `tokens/`
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `effects.css`
- `components/core/` — Button, Card/CardTitleBar/CardBody, StatBox, PlayerBadge
- `components/navigation/` — TabGroup
- `components/forms/` — TextField
- `components/feedback/` — MessageBanner
- `components/game/` — GameCard, StatusPill, PriorityPill (intentional additions, see below)
- `ui_kits/web-app/` — click-through recreation of the Home and Auth screens
- `guidelines/` — foundation specimen cards (colors, type, spacing, brand motifs)
- `assets/` — app icon PNGs (no distinct logo — see Iconography)

## Components

Button, Card, CardTitleBar, CardBody, StatBox, PlayerBadge, TabGroup, TextField, MessageBanner, GameCard, StatusPill, PriorityPill.

### Intentional additions

The upstream repo has no component library — just page-level SCSS (`.btn`, `.card`, `.stat`, `.badge`, tabs, form fields, `.msg`). The Core/Navigation/Forms/Feedback components above are direct 1:1 extractions of those classes. `GameCard`, `StatusPill`, and `PriorityPill` are **new**: the `games` table and `GameStatus`/`Priority` enums exist in the Prisma schema, but no backlog or wishlist screen has shipped yet. These three components apply the established shadow/border/pill language to that data shape so the eventual backlog UI has somewhere to start — treat them as a proposal, not a copy of a real screen.

## Content Fundamentals

- **Voice:** playful, retro-arcade, second person and light game-speak. Copy leans into gaming metaphors rather than plain SaaS language: "Insert Coin" (sign in), "New Game" (sign up), "Now playing" (current user label), "Loading save file…" / "Starting new game…" (auth success states), "No Player Found" (logged-out state).
- **Casing:** sentence case for body copy and messages; the display font (Bungee) is often set as a single short phrase or label, not full sentences.
- **Errors:** friendly, low-drama — "Something went wrong. Try again." No blame, no jargon.
- **Emoji:** none found. The brand's playfulness comes from copy and shape language, not emoji.
- **Length:** everything is short. No paragraph-length copy exists yet; labels and single-line messages only.

## Visual Foundations

- **Palette:** warm cream paper (`#faf1de`) and off-white card (`#fffaf0`) surfaces, near-black ink (`#1a1512`) for text/borders, with three saturated accents — tomato red (`#ff5d40`), teal (`#1fa596`), gold (`#ffc53d`). Two background colors max (paper for page, card/white for surfaces) — no gradients.
- **Type:** Bungee (a bold, rounded display face) for all headings, titles, buttons, and tab labels; Karla (humanist sans) for body copy, form labels, and stats. Big contrast between the two — display type carries the game/arcade energy, body type stays legible and quiet.
- **Backgrounds:** a subtle repeating dot-grid (`radial-gradient` dots, 26px pitch) across the whole page, dimmed under a translucent paper overlay. No photography, no illustrations, no textures beyond the dot grid.
- **Shadows/borders:** the signature move is a **hard, non-blurred offset shadow** (`6px 6px 0 var(--ink)` for cards, `3px 3px 0` for smaller elements) paired with a thick (2.5–3px) solid ink border — no soft/blurred box-shadows anywhere, no inner shadows.
- **Corner radii:** generous and consistent — 18px for the outer card, 12px for buttons/avatars, 10px for inputs/stat tiles, 4px for tiny chips.
- **Animation:** a bouncy "drop-in" keyframe (`translateY(-40px)` + fade, `cubic-bezier(0.2, 1.4, 0.4, 1)`, ~0.55s) staggers page elements in on load. Decorative background glyphs use a slow 6s ease-in-out vertical "bob". No other motion (no page transitions, no spinners beyond a disabled-button cursor state).
- **Hover/press states:** buttons and inputs "lift" on hover (`translate: -2px -2px` + a bigger offset shadow) and "slam flat" on press/focus (`translate: 3px 3px` + shadow collapses to `0 0 0`). This physical, tactile feedback is used everywhere instead of color-only hover states.
- **Transparency/blur:** minimal — only the paper background overlay (88% opacity) softens the dot grid. No frosted-glass/backdrop-blur anywhere.
- **Layout:** single centered card on a full-viewport backdrop (`display:grid;place-items:center`), max-width ~420px. No fixed headers/sidebars exist yet since only two screens are implemented.
- **Cards:** one card motif everywhere — thick ink border, 18px radius, hard offset shadow, optional teal "cartridge ridge" top bar with cream notches (used on the player card, not the auth card).

## Iconography

No icon system, icon font, or SVG icon set exists in the repo. The only graphic asset is a generic game-controller glyph used solely as the favicon/touch-icon (`assets/android-chrome-512x512.png`, `apple-touch-icon.png`, `favicon-32x32.png`) — it reads as generic clip art, not a designed brand mark, so it is not used as a logo anywhere in this system. No emoji or Unicode-symbol icons are used in the existing UI. If backlog/wishlist screens are built later, prefer a simple, thin-stroke icon set (e.g. Lucide, same stroke weight throughout) rather than inventing new iconography — flag any such substitution.

## Caveats & ask

- Upstream ships only two screens (Home, Auth) — the UI kit here is a faithful recreation of exactly those. `GameCard`/`StatusPill`/`PriorityPill` are original extensions built from the schema, not from a real screen; treat them as a starting proposal.
- No real logo/wordmark exists — the favicon controller glyph is generic. If GameShelf gets an actual logo, please attach it and I'll swap it in.
- Fonts (Bungee, Karla) are loaded from Google Fonts by name — no font files were in the repo to copy in directly; flag if you'd rather I self-host `.woff2` files instead.
- **Help me iterate:** tell me if the retro-arcade direction is right, whether you want the backlog/wishlist screens fleshed out further (they're currently just components, not a full screen), and whether the intentional additions match where you're headed with the product.
