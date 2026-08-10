Backlog item tile: cover art (or a diagonal-stripe placeholder), title, platform, status pill, and star rating. **Intentional addition** composed from `Card` + `StatusPill` — the `games` table has this shape but no list screen exists upstream yet.

```jsx
<GameCard title="Hollow Knight" platform="Switch" status="PLAYING" rating={5} />
```
