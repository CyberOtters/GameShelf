repo: CyberOtters/GameShelf
branch: main
## Last sync
date: 2026-07-28T16:00:07Z
### Updated in this project
- Initial import: tokens (colors, Bungee/Karla type, spacing, shadows) from `src/client/*.scss`
- Core components (Button, Card, StatBox, PlayerBadge) and forms/nav/feedback pieces recreated from `home.scss`/`auth.scss`/`home.ts`/`auth.ts`
- Web app UI kit recreating the two shipped screens: Home (session card) and Auth (Sign In / Sign Up)
- Game/wishlist components (GameCard, StatusPill, PriorityPill) added as intentional extensions of the `Game`/`Priority` Prisma enums — no backlog UI ships upstream yet

## Screen map
| Project screen | Repo files |
| --- | --- |
| ui_kits/web-app — Home | src/client/home.ts, src/client/home.scss, src/client/shared.scss |
| ui_kits/web-app — Auth | src/client/auth.ts, src/client/auth.scss, src/client/shared.scss |
| tokens/colors.css, tokens/typography.css | src/client/shared.scss, src/client/_tokens.scss |
| components/game/* | prisma/schema.prisma (GameStatus, Priority enums) — inferred, no UI source |
