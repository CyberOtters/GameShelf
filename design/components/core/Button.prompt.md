Pressable CTA button with GameShelf's signature chunky offset-shadow treatment — lifts on hover, slams flat on press.

```jsx
<Button variant="primary">Insert Coin</Button>
<Button variant="ghost" as="a" href="/register">New Game</Button>
<Button disabled>Loading…</Button>
```

Variants: `primary` (tomato fill, used for the main CTA — "Insert Coin", "Sign Out") and `ghost` (card-colored, used for secondary actions — "New Game"). Renders as `<button>` by default; pass `as="a"` + `href` for link-style buttons.
