# Immersive Leaderboard + Unified Loader — Design

Date: 2026-09-29
Status: Draft (awaiting user review)

Two related UI-polish efforts requested together:

1. **Unified loader** — reuse the orange-bouncing-grid boot loader everywhere anything loads.
2. **Immersive leaderboard** — visual overhaul + contest/season framing (display-only prizes).

---

## 1. Unified Loader

### Problem
Only the initial boot uses `PulpLoadingScreen` (orange 🍊 bouncing across a 7×7 dot grid via
`DotLoader`). Every other load point uses `<Suspense fallback={null}>` (blank) or ad-hoc spinners,
so loading feels inconsistent and abrupt.

### Design
New shared component `app/components/PulpLoader.tsx` wrapping the **same** `DotLoader` frames +
🍊 dot style (extracted from `PulpLoadingScreen`). One source of truth for the animation.

Variants (prop `variant`):
- `fullscreen` — current boot look: `h-screen bg-[#0e0c0b]`, centered. `PulpLoadingScreen`
  becomes a thin wrapper that renders `<PulpLoader variant="fullscreen" />` (keeps existing import
  paths working).
- `panel` — fills its container (`absolute inset-0` / `h-full w-full`), **transparent** background
  so it overlays the panel's own backdrop; centered loader at normal size.
- `inline` — small, no background, for in-flow "loading a section" spots.

Shared dot styling (`.pulp-dot` + `pulp-spin` keyframes) moves into the shared component so all
variants animate identically.

### Where it goes
- Replace all 10 `<Suspense fallback={null}>` in `app/app/page.tsx` with
  `<Suspense fallback={<PulpLoader variant="panel" />}>` (settings, shelf, orchard, boutique,
  stats, leaderboard, cover modal, etc.).
- View/data loads that currently show blank while fetching (leaderboard fetch, orchard mount)
  use `variant="panel"`.

### Explicitly NOT changed
- Tiny button/label spinners that are semantically inline and correct as-is:
  Settings "Syncing…" (`SettingsView.tsx:510,1641`), Sidebar search spinner (`Sidebar.tsx:730`),
  `AiResultModal` spinner. A 7×7 grid there would be wrong. Leave them.

### Units
- `PulpLoader` — pure presentational, prop `variant`, no state beyond `DotLoader`'s own interval.
  Depends only on `DotLoader`. Testable in isolation.

---

## 2. Immersive Leaderboard

### Problem
`LeaderboardView` is a single flat school board (rows + one trophy watermark). Bland; no contest
tension, no sense of season, minimal motion.

### Currency reality
Gems are removed. The one currency for prizes is **sap**. Prizes are **display-only** this pass —
no payout, no persistence. Real payout + seasonal reset is a later slice (would need a Supabase
migration; out of scope here).

### Design

**A. Segmented tabs** (top of board): `Weekly Contest` · `Season` · `School`.
- `School` = existing behavior (school board, demo/live), unchanged data path.
- `Weekly Contest` = current period ranking by `pulpDelta` (already tracked per period) +
  countdown to Monday reset (`daysLeftInWeek()` already exists) + prize display + past-winners strip.
- `Season` = term-long total ranking by `totalPulp`.
- Tabs are client-side views over the **same** already-fetched entries; no new fetch per tab.

**B. Podium** (top 3): the three leaders rendered as their deterministic tree species
(`speciesFor`, `PlantIcon`), scaled by rank (1st tallest/center, 2nd left, 3rd right), medal glow
(`MEDAL_COLORS` already defined), avatar + name + metric. Reuse `CachedPlantIcon` so 3 live SVGs
don't add cost.

**C. Ambient backdrop**: replace the single trophy watermark with an orchard-sky gradient using
`themePalette`/`orchardSky` (already imported) — soft horizon behind the podium, so the board feels
like it sits in the world. Respect `reduceMotion`/`reduceVisuals` if available (fall back to static).

**D. Rank rows** (below podium, ranks 4+): compact rows with avatar, name, metric, and a small
delta indicator (▲/▼). Your-row highlighted; your-rank card pinned at the bottom if off-screen
(pattern already present via `youRank`).

**E. Contest prize display** (Weekly tab): a small banner — "This week's prize" — showing a sap
amount + a trophy badge icon. Purely cosmetic; clicking does nothing / shows a tooltip
"Awarded at reset (coming soon)".

**F. Past winners** (Weekly tab): a thin horizontal strip of the last few weeks' #1 (name +
their tree). Data is display-only placeholder this pass (derived from current demo/live top entry);
real history needs the later migration.

### Motion
Framer Motion (already used): podium trees rise on mount, rows stagger in, rank-up shimmer when a
row's rank improves vs. previous render. Keep subtle; gate heavy motion behind reduce-motion.

### Units
- `LeaderboardTabs` — segmented control, controlled `tab` state.
- `Podium` — takes top-3 entries + theme, renders trees/medals. Presentational.
- `LeaderboardRow` — memoized single row (avatar, metric, delta). Fixes per-row re-render.
- `ContestBanner` / `PastWinnersStrip` — presentational, display-only.
- `LeaderboardView` — orchestrates: fetch (unchanged) → derive per-tab ordering → compose the above.

### Data flow
No backend change. `LeaderboardView` already fetches entries (live or demo). Tabs re-sort the same
array:
- Weekly → sort by `pulpDelta` desc.
- Season → sort by `totalPulp` desc.
- School → existing path.

### Non-goals (this pass)
- Real prize payout / claiming.
- Persisted weekly/seasonal history (past-winners is placeholder).
- Group-scoped contests (that's the friends-and-study-groups slice).
- New Supabase migrations.

---

## Testing
- Loader: visual check each variant renders + animates; Suspense fallbacks show the grid, not blank.
- Leaderboard: tab switch re-sorts without refetch; podium renders top 3; your-row highlight;
  reduce-motion path static. Playwright smoke: open leaderboard, switch tabs, assert order changes.

## Rollout
Two independent plans (loader first — small, unblocks nicer Suspense everywhere; then leaderboard).
